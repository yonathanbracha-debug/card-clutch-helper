/**
 * Finance Diagnostics Edge Function v2
 * Runs server-side analysis with:
 * - Confidence scoring + micro-explanations
 * - False positive suppression rules
 * - User feedback memory for suppression
 * - Priority scoring for to-dos
 * - Idempotent to-do creation
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============= Types =============

interface Transaction {
  id: string;
  date: string;
  merchant: string;
  merchant_normalized?: string;
  category: string;
  amount: number;
  card_used: {
    card_id: string;
    issuer: string;
    card_name: string;
  };
}

type ConfidenceLevel = 'high' | 'medium' | 'low';
type TodoType = 
  | 'cancel_subscription' 
  | 'review_subscription' 
  | 'claim_benefit' 
  | 'switch_card_rule';

interface InsightBase {
  confidence_level: ConfidenceLevel;
  explanation: string;
}

interface SubscriptionInsight extends InsightBase {
  merchant_normalized: string;
  cadence: 'weekly' | 'monthly' | 'annual';
  avg_amount: number;
  occurrences: number;
  transaction_ids: string[];
  amount_variance_percent: number;
}

interface BenefitInsight extends InsightBase {
  benefit_id: string;
  issuer: string;
  card_name: string;
  title: string;
  value_usd: number;
  triggered: boolean;
  matched_transactions: string[];
  days_remaining_in_month: number;
}

interface TodoInsert {
  user_id: string;
  type: TodoType;
  title: string;
  description: string;
  impact_usd: number;
  priority_score: number;
  source: Record<string, unknown>;
}

// ============= Constants =============

// Merchants to suppress (non-subscription patterns)
const SUPPRESSED_MERCHANT_PATTERNS = [
  'adjustment', 'refund', 'reversal', 'temporary', 'hold',
  'credit', 'payment', 'transfer', 'atm', 'fee'
];

const SUBSCRIPTION_MERCHANTS = [
  'netflix', 'spotify', 'apple', 'google', 'amazon prime', 'hulu', 'disney',
  'max', 'youtube', 'icloud', 'google one', 'dropbox', 'notion', 'adobe',
  'microsoft', 'uber one', 'doordash', 'instacart', 'gym', 'planet fitness',
  'la fitness', 'equinox', 'audible', 'kindle', 'xbox', 'playstation', 'nintendo',
  'peacock', 'paramount', 'crunchyroll', 'vpn', 'nordvpn', 'expressvpn',
];

interface BenefitRule {
  issuer: string;
  card_name: string;
  benefit_id: string;
  title: string;
  cadence: 'monthly' | 'annual';
  value_usd: number;
  requires_enrollment: boolean;
  triggers: {
    merchant_includes?: string[];
    category?: string[];
  };
}

const BENEFIT_RULES: BenefitRule[] = [
  {
    issuer: 'American Express',
    card_name: 'Gold Card',
    benefit_id: 'amex_gold_dining',
    title: 'Dining Credit',
    cadence: 'monthly',
    value_usd: 10,
    requires_enrollment: true,
    triggers: { merchant_includes: ['grubhub', 'seamless', 'cheesecake factory', 'goldbelly', 'shake shack', 'ruth chris'] },
  },
  {
    issuer: 'American Express',
    card_name: 'Platinum Card',
    benefit_id: 'amex_plat_uber',
    title: 'Uber Credit',
    cadence: 'monthly',
    value_usd: 15,
    requires_enrollment: false,
    triggers: { merchant_includes: ['uber'] },
  },
  {
    issuer: 'American Express',
    card_name: 'Platinum Card',
    benefit_id: 'amex_plat_digital',
    title: 'Digital Entertainment Credit',
    cadence: 'monthly',
    value_usd: 20,
    requires_enrollment: true,
    triggers: { merchant_includes: ['disney', 'hulu', 'espn', 'nyt', 'peacock', 'audible'] },
  },
  {
    issuer: 'Chase',
    card_name: 'Sapphire Reserve',
    benefit_id: 'csr_doordash',
    title: 'DoorDash Credit',
    cadence: 'annual',
    value_usd: 60,
    requires_enrollment: false,
    triggers: { merchant_includes: ['doordash'] },
  },
];

// ============= Utility Functions =============

function normalizeMerchant(merchant: string): string {
  return merchant
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function shouldSuppressMerchant(normalized: string): boolean {
  return SUPPRESSED_MERCHANT_PATTERNS.some(p => normalized.includes(p));
}

function getDaysRemainingInMonth(): number {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return lastDay.getDate() - now.getDate();
}

function calculatePriorityScore(
  impactUsd: number,
  cadence: 'weekly' | 'monthly' | 'annual' | null,
  confidence: ConfidenceLevel
): number {
  // Impact weight: log-scaled to prevent huge amounts from dominating
  const impactWeight = Math.log10(Math.max(impactUsd, 1) + 1) * 10;
  
  // Recurrence weight: monthly > weekly > annual
  const recurrenceWeight = cadence === 'monthly' ? 3 : cadence === 'weekly' ? 2 : 1;
  
  // Confidence weight
  const confidenceWeight = confidence === 'high' ? 3 : confidence === 'medium' ? 2 : 1;
  
  return impactWeight + recurrenceWeight + confidenceWeight;
}

function createInsightKey(type: string, source: Record<string, unknown>): string {
  if (type === 'subscription') {
    return `sub:${source.merchant_normalized}`;
  }
  if (type === 'benefit') {
    return `ben:${source.benefit_id}:${source.month}`;
  }
  return `${type}:${JSON.stringify(source)}`;
}

function createTodoKey(type: TodoType, source: Record<string, unknown>): string {
  if (type === 'review_subscription' || type === 'cancel_subscription') {
    return `${type}:${source.merchant_normalized}`;
  }
  if (type === 'claim_benefit') {
    return `${type}:${source.benefit_id}:${source.month}`;
  }
  return `${type}:${JSON.stringify(source)}`;
}

// ============= Detection Functions =============

function detectSubscriptions(
  transactions: Transaction[],
  suppressedKeys: Set<string>
): SubscriptionInsight[] {
  const groups = new Map<string, Transaction[]>();
  
  for (const tx of transactions) {
    const normalized = tx.merchant_normalized || normalizeMerchant(tx.merchant);
    
    // Suppress non-subscription patterns
    if (shouldSuppressMerchant(normalized)) continue;
    
    if (!groups.has(normalized)) {
      groups.set(normalized, []);
    }
    groups.get(normalized)!.push(tx);
  }
  
  const candidates: SubscriptionInsight[] = [];
  
  for (const [merchant, txs] of groups) {
    // SUPPRESSION: Must have at least 2 occurrences
    if (txs.length < 2) continue;
    
    // Check user suppression
    const insightKey = createInsightKey('subscription', { merchant_normalized: merchant });
    if (suppressedKeys.has(insightKey)) continue;
    
    // Calculate amount variance
    const amounts = txs.map(t => t.amount);
    const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
    const maxVariance = Math.max(...amounts.map(a => Math.abs(a - avgAmount) / avgAmount));
    
    // SUPPRESSION: Amount varies > 40%
    if (maxVariance > 0.4) continue;
    
    // Sort by date and compute deltas
    const sorted = [...txs].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
    
    const deltas: number[] = [];
    for (let i = 1; i < sorted.length; i++) {
      const diff = (new Date(sorted[i].date).getTime() - new Date(sorted[i-1].date).getTime()) / (1000 * 60 * 60 * 24);
      deltas.push(diff);
    }
    
    if (deltas.length === 0) continue;
    
    const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;
    
    let cadence: 'weekly' | 'monthly' | 'annual' | null = null;
    if (avgDelta >= 6 && avgDelta <= 8) cadence = 'weekly';
    else if (avgDelta >= 28 && avgDelta <= 33) cadence = 'monthly';
    else if (avgDelta >= 350 && avgDelta <= 380) cadence = 'annual';
    
    if (!cadence) continue;
    
    const isKnownSubscription = SUBSCRIPTION_MERCHANTS.some(s => merchant.includes(s));
    
    // Determine confidence
    let confidence: ConfidenceLevel = 'low';
    if (txs.length >= 3 && isKnownSubscription) confidence = 'high';
    else if (txs.length >= 2 && isKnownSubscription) confidence = 'medium';
    else if (txs.length >= 3) confidence = 'medium';
    
    // SUPPRESSION: Low confidence insights not actionable
    if (confidence === 'low') continue;
    
    // Generate micro-explanation
    const deltaRange = `${Math.floor(Math.min(...deltas))}-${Math.ceil(Math.max(...deltas))}`;
    const explanation = `Detected ${txs.length} charges, ${deltaRange} days apart, similar amounts ($${(avgAmount / 100).toFixed(2)} avg).`;
    
    candidates.push({
      merchant_normalized: merchant,
      cadence,
      avg_amount: avgAmount,
      occurrences: txs.length,
      transaction_ids: txs.map(t => t.id),
      amount_variance_percent: maxVariance * 100,
      confidence_level: confidence,
      explanation,
    });
  }
  
  return candidates;
}

function detectMissedBenefits(
  transactions: Transaction[],
  userCards: { issuer: string; card_name: string }[],
  currentMonth: string,
  suppressedKeys: Set<string>
): BenefitInsight[] {
  const results: BenefitInsight[] = [];
  const daysRemaining = getDaysRemainingInMonth();
  const monthTxs = transactions.filter(tx => tx.date.startsWith(currentMonth));
  
  for (const benefit of BENEFIT_RULES) {
    const hasCard = userCards.some(c => 
      c.issuer.toLowerCase().includes(benefit.issuer.toLowerCase()) &&
      c.card_name.toLowerCase().includes(benefit.card_name.toLowerCase().split(' ')[0])
    );
    
    if (!hasCard) continue;
    
    // Check user suppression
    const insightKey = createInsightKey('benefit', { 
      benefit_id: benefit.benefit_id, 
      month: currentMonth 
    });
    if (suppressedKeys.has(insightKey)) continue;
    
    // Check for trigger transactions
    const matched: string[] = [];
    for (const tx of monthTxs) {
      const normalized = tx.merchant_normalized || normalizeMerchant(tx.merchant);
      
      if (benefit.triggers.merchant_includes?.some(m => normalized.includes(m))) {
        matched.push(tx.id);
      }
      if (benefit.triggers.category?.includes(tx.category)) {
        matched.push(tx.id);
      }
    }
    
    const triggered = matched.length > 0;
    
    // SUPPRESSION: Month incomplete with > 5 days remaining
    if (!triggered && daysRemaining > 5) continue;
    
    // SUPPRESSION: Requires enrollment and status unknown (conservative)
    // We always show these but with lower confidence
    let confidence: ConfidenceLevel = triggered ? 'high' : 'medium';
    if (benefit.requires_enrollment && !triggered) {
      confidence = 'low';
    }
    
    // Generate explanation
    let explanation: string;
    if (triggered) {
      explanation = `We detected a qualifying transaction this month at ${benefit.triggers.merchant_includes?.slice(0, 2).join(', ')}.`;
    } else if (benefit.requires_enrollment) {
      explanation = `No qualifying transaction detected. This benefit may require enrollment—check your account to confirm.`;
    } else {
      explanation = `No qualifying transaction detected for this benefit in the last ${new Date().getDate()} days.`;
    }
    
    results.push({
      benefit_id: benefit.benefit_id,
      issuer: benefit.issuer,
      card_name: benefit.card_name,
      title: benefit.title,
      value_usd: benefit.value_usd,
      triggered,
      matched_transactions: matched,
      days_remaining_in_month: daysRemaining,
      confidence_level: confidence,
      explanation,
    });
  }
  
  return results;
}

// ============= Main Handler =============

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;

    const { transactions, user_cards } = await req.json() as {
      transactions: Transaction[];
      user_cards: { issuer: string; card_name: string }[];
    };

    if (!Array.isArray(transactions)) {
      return new Response(
        JSON.stringify({ error: 'transactions must be an array' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Normalize all merchants
    const normalizedTxs = transactions.map(tx => ({
      ...tx,
      merchant_normalized: tx.merchant_normalized || normalizeMerchant(tx.merchant),
    }));

    // Fetch user feedback for suppressions
    const { data: userFeedback } = await supabase
      .from('user_feedback')
      .select('insight_type, insight_key, feedback')
      .eq('user_id', userId)
      .in('feedback', ['incorrect', 'suppress']);

    const suppressedKeys = new Set(
      (userFeedback || []).map(f => f.insight_key)
    );

    // Detect subscriptions with suppression
    const subscriptions = detectSubscriptions(normalizedTxs, suppressedKeys);
    
    // Detect missed benefits with suppression
    const currentMonth = new Date().toISOString().slice(0, 7);
    const missedBenefits = detectMissedBenefits(
      normalizedTxs, 
      user_cards || [], 
      currentMonth,
      suppressedKeys
    );
    
    // Fetch existing open to-dos
    const { data: existingTodos } = await supabase
      .from('to_dos')
      .select('type, source')
      .eq('user_id', userId)
      .eq('status', 'open');

    const existingKeys = new Set(
      (existingTodos || []).map(t => createTodoKey(t.type as TodoType, t.source as Record<string, unknown>))
    );

    // Prepare new to-dos with priority scoring
    const newTodos: TodoInsert[] = [];

    // Subscription to-dos (max 3, sorted by priority)
    const sortedSubs = [...subscriptions].sort((a, b) => {
      const priorityA = calculatePriorityScore(a.avg_amount / 100, a.cadence, a.confidence_level);
      const priorityB = calculatePriorityScore(b.avg_amount / 100, b.cadence, b.confidence_level);
      return priorityB - priorityA;
    });
    
    for (const sub of sortedSubs.slice(0, 3)) {
      // High confidence + high amount = "consider canceling", else "review"
      const type: TodoType = sub.confidence_level === 'high' && sub.avg_amount > 2500 
        ? 'cancel_subscription' 
        : 'review_subscription';
      
      const source = {
        merchant_normalized: sub.merchant_normalized,
        cadence: sub.cadence,
        avg_amount: sub.avg_amount,
        occurrences: sub.occurrences,
        transaction_ids: sub.transaction_ids,
        confidence_level: sub.confidence_level,
        explanation: sub.explanation,
      };
      
      const key = createTodoKey(type, source);
      if (existingKeys.has(key)) continue;
      
      const monthlyImpact = sub.cadence === 'weekly' 
        ? sub.avg_amount * 4.33 
        : sub.cadence === 'annual' 
          ? sub.avg_amount / 12 
          : sub.avg_amount;
      
      const impactUsd = monthlyImpact / 100;
      
      // UX copy: calm authority, no shame
      const actionWord = sub.confidence_level === 'high' ? 'You may want to review' : 'If applicable, consider reviewing';
      
      newTodos.push({
        user_id: userId,
        type,
        title: `Review: ${sub.merchant_normalized}`,
        description: `${actionWord} this recurring charge. ${sub.explanation}`,
        impact_usd: impactUsd,
        priority_score: calculatePriorityScore(impactUsd, sub.cadence, sub.confidence_level),
        source,
      });
    }

    // Missed benefit to-dos (only medium/high confidence)
    for (const mb of missedBenefits) {
      if (mb.triggered) continue;
      if (mb.confidence_level === 'low') continue;
      
      const source = {
        benefit_id: mb.benefit_id,
        month: currentMonth,
        card: `${mb.issuer} ${mb.card_name}`,
        confidence_level: mb.confidence_level,
        explanation: mb.explanation,
      };
      
      const key = createTodoKey('claim_benefit', source);
      if (existingKeys.has(key)) continue;
      
      const examples = BENEFIT_RULES
        .find(b => b.benefit_id === mb.benefit_id)
        ?.triggers.merchant_includes?.slice(0, 3).join(', ') || 'qualifying merchants';
      
      newTodos.push({
        user_id: userId,
        type: 'claim_benefit',
        title: `${mb.title} available`,
        description: `You hold ${mb.issuer} ${mb.card_name}. ${mb.explanation} If you use ${examples}, you may have $${mb.value_usd} available.`,
        impact_usd: mb.value_usd,
        priority_score: calculatePriorityScore(mb.value_usd, 'monthly', mb.confidence_level),
        source,
      });
    }

    // Insert new to-dos
    let insertedCount = 0;
    if (newTodos.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('to_dos')
        .insert(newTodos)
        .select('id');
      
      if (insertError) {
        console.error('Error inserting to-dos:', insertError);
      } else {
        insertedCount = inserted?.length || 0;
      }
    }

    // Calculate summary
    const totalSubscriptionSpend = subscriptions.reduce((sum, s) => {
      const monthly = s.cadence === 'weekly' ? s.avg_amount * 4.33 
        : s.cadence === 'annual' ? s.avg_amount / 12 
        : s.avg_amount;
      return sum + monthly;
    }, 0) / 100;

    const missedBenefitsValue = missedBenefits
      .filter(mb => !mb.triggered && mb.confidence_level !== 'low')
      .reduce((sum, mb) => sum + mb.value_usd, 0);

    // Data quality indicator
    const isLimitedData = transactions.length < 10;
    const dataQualityNote = isLimitedData 
      ? 'Limited data. Insights may be incomplete.'
      : 'All insights are based solely on your data.';

    return new Response(
      JSON.stringify({
        success: true,
        data_quality: {
          transaction_count: transactions.length,
          is_limited: isLimitedData,
          note: dataQualityNote,
        },
        summary: {
          subscriptions_detected: subscriptions.length,
          subscription_monthly_spend: totalSubscriptionSpend,
          missed_benefits_count: missedBenefits.filter(mb => !mb.triggered && mb.confidence_level !== 'low').length,
          missed_benefits_value: missedBenefitsValue,
        },
        todos_created: insertedCount,
        insights: {
          subscriptions: subscriptions.map(s => ({
            merchant: s.merchant_normalized,
            cadence: s.cadence,
            avg_amount: s.avg_amount / 100,
            confidence_level: s.confidence_level,
            explanation: s.explanation,
          })),
          missed_benefits: missedBenefits.filter(mb => !mb.triggered && mb.confidence_level !== 'low').map(mb => ({
            card: `${mb.issuer} ${mb.card_name}`,
            benefit: mb.title,
            value: mb.value_usd,
            confidence_level: mb.confidence_level,
            explanation: mb.explanation,
          })),
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Finance diagnostics error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
