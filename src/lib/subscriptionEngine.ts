/**
 * Subscription Detection Engine
 * Deterministic detection of recurring charges
 */

import type { Transaction } from './opportunityCostEngine';

export type SubscriptionCandidate = {
  merchant_normalized: string;
  original_merchant: string;
  cadence: 'weekly' | 'monthly' | 'annual';
  avg_amount: number;
  occurrences: number;
  transaction_ids: string[];
  confidence: 'high' | 'medium' | 'low';
  estimated_monthly_cost: number;
  first_seen: string;
  last_seen: string;
};

// Known subscription services (allowlist)
const KNOWN_SUBSCRIPTIONS = new Set([
  'netflix',
  'spotify',
  'apple',
  'google',
  'amazon prime',
  'hulu',
  'disney',
  'disney+',
  'max',
  'hbo',
  'youtube',
  'youtube premium',
  'icloud',
  'google one',
  'dropbox',
  'notion',
  'adobe',
  'microsoft',
  'microsoft 365',
  'uber one',
  'doordash',
  'dashpass',
  'instacart',
  'instacart+',
  'gym',
  'fitness',
  'planet fitness',
  'equinox',
  'la fitness',
  'orangetheory',
  'peloton',
  'audible',
  'kindle',
  'paramount+',
  'peacock',
  'espn',
  'crunchyroll',
  'twitch',
  'patreon',
  'substack',
  'linkedin',
  'zoom',
  'slack',
  'figma',
  'canva',
  'grammarly',
  'nordvpn',
  'expressvpn',
  '1password',
  'lastpass',
  'bitwarden',
  'evernote',
  'todoist',
  'headspace',
  'calm',
  'strava',
  'nytimes',
  'new york times',
  'wsj',
  'wall street journal',
  'washington post',
  'the athletic',
  'playstation',
  'xbox',
  'nintendo',
  'siriusxm',
  'sirius',
]);

/**
 * Normalize merchant name for grouping
 */
export function normalizeMerchant(merchant: string): string {
  return merchant
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Check if merchant appears to be a subscription service
 */
function isKnownSubscription(merchantNormalized: string): boolean {
  return Array.from(KNOWN_SUBSCRIPTIONS).some(sub =>
    merchantNormalized.includes(sub)
  );
}

/**
 * Calculate amount bucket for clustering
 */
function getAmountBucket(amount: number): number {
  if (amount < 100) {
    return Math.round(amount / 5) * 5;
  }
  return Math.round(amount / 10) * 10;
}

/**
 * Infer cadence from day deltas
 */
function inferCadence(
  deltas: number[]
): { cadence: 'weekly' | 'monthly' | 'annual' | null; confidence: 'high' | 'medium' | 'low' } {
  if (deltas.length === 0) {
    return { cadence: null, confidence: 'low' };
  }

  const avgDelta = deltas.reduce((a, b) => a + b, 0) / deltas.length;

  // Weekly: 6-8 days
  if (avgDelta >= 6 && avgDelta <= 8) {
    return { cadence: 'weekly', confidence: deltas.length >= 3 ? 'high' : 'medium' };
  }

  // Monthly: 28-33 days
  if (avgDelta >= 28 && avgDelta <= 33) {
    return { cadence: 'monthly', confidence: deltas.length >= 3 ? 'high' : 'medium' };
  }

  // Annual: 350-380 days
  if (avgDelta >= 350 && avgDelta <= 380) {
    return { cadence: 'annual', confidence: deltas.length >= 2 ? 'high' : 'medium' };
  }

  return { cadence: null, confidence: 'low' };
}

/**
 * Calculate estimated monthly cost from cadence
 */
function calculateMonthlyCost(avgAmount: number, cadence: 'weekly' | 'monthly' | 'annual'): number {
  switch (cadence) {
    case 'weekly':
      return avgAmount * 4.33;
    case 'monthly':
      return avgAmount;
    case 'annual':
      return avgAmount / 12;
    default:
      return avgAmount;
  }
}

/**
 * Detect subscription candidates from transactions
 * Only processes last 120 days of data
 */
export function detectSubscriptions(
  transactions: Transaction[]
): SubscriptionCandidate[] {
  const now = new Date();
  const cutoffDate = new Date(now.getTime() - 120 * 24 * 60 * 60 * 1000);

  // Filter to last 120 days
  const recentTxns = transactions.filter(t => new Date(t.date) >= cutoffDate);

  // Group by normalized merchant
  const merchantGroups = new Map<string, Transaction[]>();
  
  for (const txn of recentTxns) {
    const normalized = normalizeMerchant(txn.merchant);
    if (!merchantGroups.has(normalized)) {
      merchantGroups.set(normalized, []);
    }
    merchantGroups.get(normalized)!.push(txn);
  }

  const candidates: SubscriptionCandidate[] = [];

  for (const [merchantNorm, txns] of merchantGroups) {
    // Need at least 2 occurrences
    if (txns.length < 2) continue;

    // Group by amount bucket
    const amountBuckets = new Map<number, Transaction[]>();
    
    for (const txn of txns) {
      const bucket = getAmountBucket(txn.amount);
      if (!amountBuckets.has(bucket)) {
        amountBuckets.set(bucket, []);
      }
      amountBuckets.get(bucket)!.push(txn);
    }

    for (const [, bucketTxns] of amountBuckets) {
      if (bucketTxns.length < 2) continue;

      // Sort by date
      const sorted = bucketTxns.sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
      );

      // Calculate deltas
      const deltas: number[] = [];
      for (let i = 1; i < sorted.length; i++) {
        const delta = Math.round(
          (new Date(sorted[i].date).getTime() - new Date(sorted[i - 1].date).getTime()) /
            (1000 * 60 * 60 * 24)
        );
        deltas.push(delta);
      }

      const { cadence, confidence } = inferCadence(deltas);
      
      // Skip if no cadence detected or low confidence
      if (!cadence || confidence === 'low') continue;

      // Check if known subscription OR high confidence
      const isKnown = isKnownSubscription(merchantNorm);
      
      // Only include if known subscription or high confidence pattern
      if (!isKnown && confidence !== 'high') continue;

      const avgAmount = sorted.reduce((sum, t) => sum + t.amount, 0) / sorted.length;
      const monthlyCost = calculateMonthlyCost(avgAmount, cadence);

      candidates.push({
        merchant_normalized: merchantNorm,
        original_merchant: sorted[0].merchant,
        cadence,
        avg_amount: Math.round(avgAmount * 100) / 100,
        occurrences: sorted.length,
        transaction_ids: sorted.map(t => t.id),
        confidence: isKnown ? 'high' : confidence,
        estimated_monthly_cost: Math.round(monthlyCost * 100) / 100,
        first_seen: sorted[0].date,
        last_seen: sorted[sorted.length - 1].date,
      });
    }
  }

  // Sort by monthly cost descending
  return candidates.sort((a, b) => b.estimated_monthly_cost - a.estimated_monthly_cost);
}

/**
 * Generate subscription-related to-dos
 * Maximum 3 per scan, prioritized by impact
 */
export function generateSubscriptionTodos(
  candidates: SubscriptionCandidate[]
): Array<{
  type: 'cancel_subscription' | 'review_subscription';
  title: string;
  description: string;
  impact_usd: number;
  source: Record<string, unknown>;
}> {
  const todos: Array<{
    type: 'cancel_subscription' | 'review_subscription';
    title: string;
    description: string;
    impact_usd: number;
    source: Record<string, unknown>;
  }> = [];

  // High confidence subscriptions with monthly cost > $25
  const highImpact = candidates.filter(
    c => c.confidence === 'high' && c.estimated_monthly_cost >= 25
  );

  for (const sub of highImpact.slice(0, 3)) {
    const cadenceLabel = sub.cadence === 'weekly' ? 'weekly' : 
                         sub.cadence === 'annual' ? 'annual' : 'monthly';
    
    todos.push({
      type: 'review_subscription',
      title: `Review subscription: ${sub.original_merchant}`,
      description: `Charged ${sub.occurrences} times, ${cadenceLabel} pattern detected, avg $${sub.avg_amount.toFixed(2)}. Consider canceling if not essential.`,
      impact_usd: sub.estimated_monthly_cost,
      source: {
        merchant_normalized: sub.merchant_normalized,
        cadence: sub.cadence,
        avg_amount: sub.avg_amount,
        occurrences: sub.occurrences,
        transaction_ids: sub.transaction_ids,
      },
    });
  }

  // Fill remaining slots with medium-impact subscriptions
  if (todos.length < 3) {
    const remaining = candidates
      .filter(c => c.estimated_monthly_cost >= 10)
      .filter(c => !highImpact.includes(c))
      .slice(0, 3 - todos.length);

    for (const sub of remaining) {
      const cadenceLabel = sub.cadence === 'weekly' ? 'weekly' : 
                           sub.cadence === 'annual' ? 'annual' : 'monthly';

      todos.push({
        type: 'review_subscription',
        title: `Review subscription: ${sub.original_merchant}`,
        description: `Detected ${cadenceLabel} charge, avg $${sub.avg_amount.toFixed(2)}. Review if still needed.`,
        impact_usd: sub.estimated_monthly_cost,
        source: {
          merchant_normalized: sub.merchant_normalized,
          cadence: sub.cadence,
          avg_amount: sub.avg_amount,
          occurrences: sub.occurrences,
          transaction_ids: sub.transaction_ids,
        },
      });
    }
  }

  return todos;
}
