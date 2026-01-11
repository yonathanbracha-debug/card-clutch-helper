/**
 * Finance Diagnostics Edge Function
 * Runs server-side analysis for subscription detection, missed benefits, and opportunity cost
 * Creates idempotent to-dos for detected issues
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Transaction type (matches frontend)
interface Transaction {
  id: string;
  date: string;
  merchant: string;
  merchant_normalized?: string;
  category: string;
  amount: number; // in cents
  card_used: {
    card_id: string;
    issuer: string;
    card_name: string;
  };
}

// To-do types
type TodoType = 
  | 'cancel_subscription' 
  | 'review_subscription' 
  | 'claim_benefit' 
  | 'switch_card_rule' 
  | 'contact_issuer' 
  | 'set_autopay' 
  | 'verify_statement';

interface TodoInsert {
  user_id: string;
  type: TodoType;
  title: string;
  description: string;
  cta_label?: string;
  cta_url?: string;
  impact_usd: number;
  source: Record<string, unknown>;
}

// Known subscription merchants
const SUBSCRIPTION_MERCHANTS = [
  'netflix', 'spotify', 'apple', 'google', 'amazon prime', 'hulu', 'disney',
  'max', 'youtube', 'icloud', 'google one', 'dropbox', 'notion', 'adobe',
  'microsoft', 'uber one', 'doordash', 'instacart', 'gym', 'planet fitness',
  'la fitness', 'equinox', 'audible', 'kindle', 'xbox', 'playstation', 'nintendo',
  'peacock', 'paramount', 'crunchyroll', 'vpn', 'nordvpn', 'expressvpn',
];

// Benefit rules (simplified)
interface BenefitRule {
  issuer: string;
  card_name: string;
  benefit_id: string;
  title: string;
  cadence: 'monthly' | 'annual';
  value_usd: number;
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
    triggers: { merchant_includes: ['grubhub', 'seamless', 'cheesecake factory', 'goldbelly', 'shake shack', 'ruth chris'] },
  },
  {
    issuer: 'American Express',
    card_name: 'Platinum Card',
    benefit_id: 'amex_plat_uber',
    title: 'Uber Credit',
    cadence: 'monthly',
    value_usd: 15,
    triggers: { merchant_includes: ['uber'] },
  },
  {
    issuer: 'American Express',
    card_name: 'Platinum Card',
    benefit_id: 'amex_plat_digital',
    title: 'Digital Entertainment Credit',
    cadence: 'monthly',
    value_usd: 20,
    triggers: { merchant_includes: ['disney', 'hulu', 'espn', 'nyt', 'peacock', 'audible'] },
  },
  {
    issuer: 'Chase',
    card_name: 'Sapphire Reserve',
    benefit_id: 'csr_doordash',
    title: 'DoorDash Credit',
    cadence: 'annual',
    value_usd: 60,
    triggers: { merchant_includes: ['doordash'] },
  },
];

// Normalize merchant name
function normalizeMerchant(merchant: string): string {
  return merchant
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

// Detect subscription candidates
function detectSubscriptions(transactions: Transaction[]): {
  merchant_normalized: string;
  cadence: 'weekly' | 'monthly' | 'annual';
  avg_amount: number;
  occurrences: number;
  transaction_ids: string[];
  confidence: 'high' | 'medium' | 'low';
}[] {
  // Group by normalized merchant
  const groups = new Map<string, Transaction[]>();
  
  for (const tx of transactions) {
    const normalized = tx.merchant_normalized || normalizeMerchant(tx.merchant);
    if (!groups.has(normalized)) {
      groups.set(normalized, []);
    }
    groups.get(normalized)!.push(tx);
  }
  
  const candidates: ReturnType<typeof detectSubscriptions> = [];
  
  for (const [merchant, txs] of groups) {
    if (txs.length < 2) continue;
    
    // Cluster by amount bucket
    const bucketKey = (amount: number) => {
      const dollars = amount / 100;
      return dollars < 100 
        ? Math.round(dollars / 5) * 5 
        : Math.round(dollars / 10) * 10;
    };
    
    const buckets = new Map<number, Transaction[]>();
    for (const tx of txs) {
      const key = bucketKey(tx.amount);
      if (!buckets.has(key)) buckets.set(key, []);
      buckets.get(key)!.push(tx);
    }
    
    for (const [, clusterTxs] of buckets) {
      if (clusterTxs.length < 2) continue;
      
      // Sort by date and compute deltas
      const sorted = [...clusterTxs].sort((a, b) => 
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
      
      const avgAmount = clusterTxs.reduce((s, t) => s + t.amount, 0) / clusterTxs.length;
      const isKnownSubscription = SUBSCRIPTION_MERCHANTS.some(s => merchant.includes(s));
      
      let confidence: 'high' | 'medium' | 'low' = 'low';
      if (clusterTxs.length >= 3 && isKnownSubscription) confidence = 'high';
      else if (clusterTxs.length >= 2 && isKnownSubscription) confidence = 'medium';
      else if (clusterTxs.length >= 3) confidence = 'medium';
      
      candidates.push({
        merchant_normalized: merchant,
        cadence,
        avg_amount: avgAmount,
        occurrences: clusterTxs.length,
        transaction_ids: clusterTxs.map(t => t.id),
        confidence,
      });
    }
  }
  
  return candidates.filter(c => c.confidence !== 'low');
}

// Detect missed benefits
function detectMissedBenefits(
  transactions: Transaction[],
  userCards: { issuer: string; card_name: string }[],
  currentMonth: string
): {
  benefit: BenefitRule;
  triggered: boolean;
  matched_transactions: string[];
}[] {
  const results: ReturnType<typeof detectMissedBenefits> = [];
  
  // Get transactions for current month
  const monthTxs = transactions.filter(tx => tx.date.startsWith(currentMonth));
  
  for (const benefit of BENEFIT_RULES) {
    // Check if user has this card
    const hasCard = userCards.some(c => 
      c.issuer.toLowerCase().includes(benefit.issuer.toLowerCase()) &&
      c.card_name.toLowerCase().includes(benefit.card_name.toLowerCase().split(' ')[0])
    );
    
    if (!hasCard) continue;
    
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
    
    results.push({
      benefit,
      triggered: matched.length > 0,
      matched_transactions: matched,
    });
  }
  
  return results;
}

// Create deterministic key for idempotency
function createTodoKey(type: TodoType, source: Record<string, unknown>): string {
  if (type === 'review_subscription' || type === 'cancel_subscription') {
    return `${type}:${source.merchant_normalized}`;
  }
  if (type === 'claim_benefit') {
    return `${type}:${source.benefit_id}:${source.month}`;
  }
  return `${type}:${JSON.stringify(source)}`;
}

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

    // Verify user
    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // Parse request body
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

    // Detect subscriptions
    const subscriptions = detectSubscriptions(normalizedTxs);
    
    // Detect missed benefits
    const currentMonth = new Date().toISOString().slice(0, 7);
    const missedBenefits = detectMissedBenefits(normalizedTxs, user_cards || [], currentMonth);
    
    // Fetch existing open to-dos
    const { data: existingTodos } = await supabase
      .from('to_dos')
      .select('type, source')
      .eq('user_id', userId)
      .eq('status', 'open');

    const existingKeys = new Set(
      (existingTodos || []).map(t => createTodoKey(t.type as TodoType, t.source as Record<string, unknown>))
    );

    // Prepare new to-dos
    const newTodos: TodoInsert[] = [];

    // Subscription to-dos (max 3, sorted by impact)
    const sortedSubs = [...subscriptions].sort((a, b) => b.avg_amount - a.avg_amount);
    
    for (const sub of sortedSubs.slice(0, 3)) {
      const type: TodoType = sub.confidence === 'high' && sub.avg_amount > 2500 
        ? 'cancel_subscription' 
        : 'review_subscription';
      
      const source = {
        merchant_normalized: sub.merchant_normalized,
        cadence: sub.cadence,
        avg_amount: sub.avg_amount,
        occurrences: sub.occurrences,
        transaction_ids: sub.transaction_ids,
      };
      
      const key = createTodoKey(type, source);
      if (existingKeys.has(key)) continue;
      
      const monthlyImpact = sub.cadence === 'weekly' 
        ? sub.avg_amount * 4.33 
        : sub.cadence === 'annual' 
          ? sub.avg_amount / 12 
          : sub.avg_amount;
      
      newTodos.push({
        user_id: userId,
        type,
        title: type === 'cancel_subscription' 
          ? `Consider canceling: ${sub.merchant_normalized}`
          : `Review subscription: ${sub.merchant_normalized}`,
        description: `Charged ${sub.occurrences} times, approximately ${sub.cadence}, avg $${(sub.avg_amount / 100).toFixed(2)}`,
        impact_usd: monthlyImpact / 100,
        source,
      });
    }

    // Missed benefit to-dos
    for (const mb of missedBenefits) {
      if (mb.triggered) continue; // Already used
      
      const source = {
        benefit_id: mb.benefit.benefit_id,
        month: currentMonth,
        card: `${mb.benefit.issuer} ${mb.benefit.card_name}`,
      };
      
      const key = createTodoKey('claim_benefit', source);
      if (existingKeys.has(key)) continue;
      
      const examples = mb.benefit.triggers.merchant_includes?.slice(0, 3).join(', ') || 'qualifying merchants';
      
      newTodos.push({
        user_id: userId,
        type: 'claim_benefit',
        title: `Claim your ${mb.benefit.title}`,
        description: `You hold ${mb.benefit.issuer} ${mb.benefit.card_name}. We did not detect a qualifying charge this month. If you use ${examples}, you may have $${mb.benefit.value_usd} available.`,
        impact_usd: mb.benefit.value_usd,
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
      .filter(mb => !mb.triggered)
      .reduce((sum, mb) => sum + mb.benefit.value_usd, 0);

    return new Response(
      JSON.stringify({
        success: true,
        summary: {
          subscriptions_detected: subscriptions.length,
          subscription_monthly_spend: totalSubscriptionSpend,
          missed_benefits_count: missedBenefits.filter(mb => !mb.triggered).length,
          missed_benefits_value: missedBenefitsValue,
        },
        todos_created: insertedCount,
        subscriptions: subscriptions.map(s => ({
          merchant: s.merchant_normalized,
          cadence: s.cadence,
          avg_amount: s.avg_amount / 100,
          confidence: s.confidence,
        })),
        missed_benefits: missedBenefits.filter(mb => !mb.triggered).map(mb => ({
          card: `${mb.benefit.issuer} ${mb.benefit.card_name}`,
          benefit: mb.benefit.title,
          value: mb.benefit.value_usd,
        })),
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
