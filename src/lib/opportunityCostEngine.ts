/**
 * Opportunity Cost & Missed Rewards Engine v1
 * Deterministic error detection for credit card usage
 * 
 * Core Philosophy:
 * - Users are not bad at money. They are bad at invisible rules.
 * - Show what happened, what should have happened, and what it cost.
 * - No judgment. No dopamine loops. Education only.
 */

// ============= CANONICAL TRANSACTION MODEL (Section C) =============

export type TransactionCategory = 
  | 'dining' 
  | 'travel' 
  | 'grocery' 
  | 'gas'
  | 'streaming'
  | 'drugstore'
  | 'online' 
  | 'other';

export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  category: TransactionCategory;
  amount: number; // in cents for precision
  card_used: {
    card_id: string;
    issuer: string;
    card_name: string;
  };
  is_bnpl?: boolean;
}

// ============= REWARDS KNOWLEDGE BASE (Section D) =============

export interface CardRewardRule {
  card_id: string;
  card_name: string;
  issuer: string;
  category: TransactionCategory | 'general';
  multiplier: number; // e.g., 4 for 4x
  cap_cents?: number; // monthly/annual cap
  point_value_cents: number; // conservative valuation per point
}

// Conservative point valuations (cents per point)
// These are CONSERVATIVE estimates, not optimistic transfer valuations
export const POINT_VALUES: Record<string, number> = {
  'chase_ur': 1.25, // Baseline redemption via Chase Travel
  'amex_mr': 1.0,   // Conservative transfer value
  'capital_one': 1.0, // Direct redemption
  'citi_typ': 1.0,   // Transfer partner value
  'cashback': 1.0,   // 1 cent = 1 cent
};

// Reward rules for common cards (to be extended with DB data)
const REWARD_RULES: CardRewardRule[] = [
  // Chase Sapphire Preferred
  { card_id: 'chase-sapphire-preferred', card_name: 'Chase Sapphire Preferred', issuer: 'Chase', category: 'dining', multiplier: 3, point_value_cents: 1.25 },
  { card_id: 'chase-sapphire-preferred', card_name: 'Chase Sapphire Preferred', issuer: 'Chase', category: 'travel', multiplier: 5, point_value_cents: 1.25 },
  { card_id: 'chase-sapphire-preferred', card_name: 'Chase Sapphire Preferred', issuer: 'Chase', category: 'streaming', multiplier: 3, point_value_cents: 1.25 },
  { card_id: 'chase-sapphire-preferred', card_name: 'Chase Sapphire Preferred', issuer: 'Chase', category: 'general', multiplier: 1, point_value_cents: 1.25 },
  
  // Chase Sapphire Reserve
  { card_id: 'chase-sapphire-reserve', card_name: 'Chase Sapphire Reserve', issuer: 'Chase', category: 'dining', multiplier: 3, point_value_cents: 1.5 },
  { card_id: 'chase-sapphire-reserve', card_name: 'Chase Sapphire Reserve', issuer: 'Chase', category: 'travel', multiplier: 10, point_value_cents: 1.5 },
  { card_id: 'chase-sapphire-reserve', card_name: 'Chase Sapphire Reserve', issuer: 'Chase', category: 'general', multiplier: 1, point_value_cents: 1.5 },
  
  // Chase Freedom Unlimited
  { card_id: 'chase-freedom-unlimited', card_name: 'Chase Freedom Unlimited', issuer: 'Chase', category: 'dining', multiplier: 3, point_value_cents: 1.0 },
  { card_id: 'chase-freedom-unlimited', card_name: 'Chase Freedom Unlimited', issuer: 'Chase', category: 'drugstore', multiplier: 3, point_value_cents: 1.0 },
  { card_id: 'chase-freedom-unlimited', card_name: 'Chase Freedom Unlimited', issuer: 'Chase', category: 'general', multiplier: 1.5, point_value_cents: 1.0 },
  
  // Amex Gold
  { card_id: 'amex-gold', card_name: 'American Express Gold', issuer: 'American Express', category: 'dining', multiplier: 4, point_value_cents: 1.0 },
  { card_id: 'amex-gold', card_name: 'American Express Gold', issuer: 'American Express', category: 'grocery', multiplier: 4, cap_cents: 2500000, point_value_cents: 1.0 },
  { card_id: 'amex-gold', card_name: 'American Express Gold', issuer: 'American Express', category: 'general', multiplier: 1, point_value_cents: 1.0 },
  
  // Amex Platinum
  { card_id: 'amex-platinum', card_name: 'American Express Platinum', issuer: 'American Express', category: 'travel', multiplier: 5, point_value_cents: 1.0 },
  { card_id: 'amex-platinum', card_name: 'American Express Platinum', issuer: 'American Express', category: 'general', multiplier: 1, point_value_cents: 1.0 },
  
  // Citi Double Cash
  { card_id: 'citi-double-cash', card_name: 'Citi Double Cash', issuer: 'Citi', category: 'general', multiplier: 2, point_value_cents: 1.0 },
  
  // Capital One Venture X
  { card_id: 'capital-one-venture-x', card_name: 'Capital One Venture X', issuer: 'Capital One', category: 'travel', multiplier: 10, point_value_cents: 1.0 },
  { card_id: 'capital-one-venture-x', card_name: 'Capital One Venture X', issuer: 'Capital One', category: 'general', multiplier: 2, point_value_cents: 1.0 },
  
  // Capital One SavorOne
  { card_id: 'capital-one-savor-one', card_name: 'Capital One SavorOne', issuer: 'Capital One', category: 'dining', multiplier: 3, point_value_cents: 1.0 },
  { card_id: 'capital-one-savor-one', card_name: 'Capital One SavorOne', issuer: 'Capital One', category: 'grocery', multiplier: 3, point_value_cents: 1.0 },
  { card_id: 'capital-one-savor-one', card_name: 'Capital One SavorOne', issuer: 'Capital One', category: 'streaming', multiplier: 3, point_value_cents: 1.0 },
  { card_id: 'capital-one-savor-one', card_name: 'Capital One SavorOne', issuer: 'Capital One', category: 'general', multiplier: 1, point_value_cents: 1.0 },
];

// ============= OPPORTUNITY COST ALGORITHM (Section E) =============

/**
 * Get the best reward rule for a card and category
 */
function getBestRule(cardId: string, category: TransactionCategory): CardRewardRule | null {
  // First try exact category match
  const exactMatch = REWARD_RULES.find(
    r => r.card_id === cardId && r.category === category
  );
  if (exactMatch) return exactMatch;
  
  // Fall back to general category
  return REWARD_RULES.find(
    r => r.card_id === cardId && r.category === 'general'
  ) || null;
}

/**
 * Calculate points earned for a transaction with a specific card
 */
function calculatePoints(amount: number, rule: CardRewardRule): number {
  const amountDollars = amount / 100;
  return Math.floor(amountDollars * rule.multiplier);
}

/**
 * Calculate cash value from points
 */
function calculateCashValue(points: number, pointValueCents: number): number {
  return (points * pointValueCents) / 100;
}

// ============= MISSED OPPORTUNITY SCHEMA (Section F) =============

export interface MissedOpportunity {
  transaction_id: string;
  summary: string; // 1 sentence, neutral tone
  
  what_happened: string;
  what_should_have_happened: string;
  
  cost: {
    missed_points: number;
    missed_value_usd: number;
  };
  
  why_it_matters: string;
  prevention_rule: string; // reusable heuristic
}

/**
 * Analyze a transaction for missed opportunities
 */
export function analyzeTransaction(
  transaction: Transaction,
  userCardIds: string[]
): MissedOpportunity | null {
  const usedCardRule = getBestRule(transaction.card_used.card_id, transaction.category);
  if (!usedCardRule) return null;
  
  let bestAlternativeRule: CardRewardRule | null = null;
  let bestAlternativePoints = 0;
  
  // Find the best alternative card the user owns
  for (const cardId of userCardIds) {
    if (cardId === transaction.card_used.card_id) continue;
    
    const rule = getBestRule(cardId, transaction.category);
    if (!rule) continue;
    
    const points = calculatePoints(transaction.amount, rule);
    if (points > bestAlternativePoints) {
      bestAlternativePoints = points;
      bestAlternativeRule = rule;
    }
  }
  
  if (!bestAlternativeRule) return null;
  
  const usedPoints = calculatePoints(transaction.amount, usedCardRule);
  const usedValue = calculateCashValue(usedPoints, usedCardRule.point_value_cents);
  const bestValue = calculateCashValue(bestAlternativePoints, bestAlternativeRule.point_value_cents);
  
  const missedPoints = bestAlternativePoints - usedPoints;
  const missedValue = bestValue - usedValue;
  
  // Only report if there's a meaningful difference (at least $0.10)
  if (missedValue < 0.10) return null;
  
  const amountDollars = (transaction.amount / 100).toFixed(2);
  
  return {
    transaction_id: transaction.id,
    summary: `You could have earned ${missedPoints} more points ($${missedValue.toFixed(2)}) using ${bestAlternativeRule.card_name}.`,
    
    what_happened: `Used ${transaction.card_used.card_name} for $${amountDollars} ${transaction.category} purchase at ${transaction.merchant}. Earned ${usedPoints} points (${usedCardRule.multiplier}x).`,
    
    what_should_have_happened: `${bestAlternativeRule.card_name} earns ${bestAlternativeRule.multiplier}x on ${transaction.category}. Would have earned ${bestAlternativePoints} points.`,
    
    cost: {
      missed_points: missedPoints,
      missed_value_usd: Number(missedValue.toFixed(2)),
    },
    
    why_it_matters: `Over a year of similar purchases, this category choice could cost you $${(missedValue * 12).toFixed(2)} in missed value.`,
    
    prevention_rule: `Use ${bestAlternativeRule.card_name} for ${transaction.category} purchases.`,
  };
}

// ============= AGGREGATED INSIGHTS (Section G) =============

export interface OpportunitySummary {
  period: 'monthly' | 'statement';
  
  total_missed_value_usd: number;
  
  top_3_errors: {
    category: TransactionCategory;
    missed_value_usd: number;
    explanation: string;
  }[];
  
  confidence_note: string;
}

/**
 * Aggregate missed opportunities into a summary
 */
export function summarizeOpportunities(
  opportunities: MissedOpportunity[],
  period: 'monthly' | 'statement' = 'monthly'
): OpportunitySummary {
  const totalMissed = opportunities.reduce(
    (sum, opp) => sum + opp.cost.missed_value_usd, 
    0
  );
  
  // Group by prevention rule (which contains category info)
  const byCategory = new Map<TransactionCategory, number>();
  for (const opp of opportunities) {
    // Extract category from prevention_rule
    const categoryMatch = opp.prevention_rule.match(/for (\w+) purchases/);
    if (categoryMatch) {
      const cat = categoryMatch[1] as TransactionCategory;
      byCategory.set(cat, (byCategory.get(cat) || 0) + opp.cost.missed_value_usd);
    }
  }
  
  // Sort and get top 3
  const sorted = Array.from(byCategory.entries())
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);
  
  const top3 = sorted.map(([category, missed]) => ({
    category,
    missed_value_usd: Number(missed.toFixed(2)),
    explanation: `Your biggest opportunity is in ${category} spending.`,
  }));
  
  return {
    period,
    total_missed_value_usd: Number(totalMissed.toFixed(2)),
    top_3_errors: top3,
    confidence_note: 'Most users miss some rewards. These are your biggest opportunities to improve.',
  };
}

// ============= BNPL TRAP DETECTION (Section I) =============

export interface RiskAlert {
  title: string;
  explanation: string;
  long_term_cost_estimate: string;
  safer_alternative: string;
}

/**
 * Detect potential BNPL traps and high-risk purchases
 */
export function detectRiskAlerts(
  transaction: Transaction,
  averageMonthlyDiscretionary?: number
): RiskAlert | null {
  // BNPL detection
  if (transaction.is_bnpl) {
    const amount = transaction.amount / 100;
    // Assume 10% effective cost for late/missed payments
    const potentialCost = (amount * 0.1).toFixed(2);
    
    return {
      title: 'BNPL Payment Detected',
      explanation: `This $${amount.toFixed(2)} purchase is being paid via Buy Now, Pay Later. While the stated APR may be 0%, missed payments often incur fees.`,
      long_term_cost_estimate: `If you miss a payment or pay late, expect fees of $25-35 or interest charges around $${potentialCost}.`,
      safer_alternative: 'Consider paying with a credit card you can pay in full. You\'d earn rewards and build credit history without payment fragmentation risk.',
    };
  }
  
  // Large discretionary purchase detection
  if (averageMonthlyDiscretionary) {
    const amount = transaction.amount / 100;
    const isLarge = amount > averageMonthlyDiscretionary * 1.5;
    const isDiscretionary = ['dining', 'streaming', 'online', 'other'].includes(transaction.category);
    
    if (isLarge && isDiscretionary) {
      return {
        title: 'Large Discretionary Purchase',
        explanation: `This $${amount.toFixed(2)} purchase is ${((amount / averageMonthlyDiscretionary) * 100).toFixed(0)}% of your typical monthly discretionary spending.`,
        long_term_cost_estimate: `If financed at 20% APR, carrying this balance would cost $${(amount * 0.20 / 12).toFixed(2)} in interest monthly.`,
        safer_alternative: 'If you can\'t pay this in full this month, consider waiting or splitting across multiple statement periods.',
      };
    }
  }
  
  return null;
}

// ============= BATCH ANALYSIS =============

export interface AnalysisResult {
  opportunities: MissedOpportunity[];
  summary: OpportunitySummary;
  risk_alerts: RiskAlert[];
}

/**
 * Analyze a batch of transactions
 */
export function analyzeTransactions(
  transactions: Transaction[],
  userCardIds: string[],
  averageMonthlyDiscretionary?: number
): AnalysisResult {
  const opportunities: MissedOpportunity[] = [];
  const riskAlerts: RiskAlert[] = [];
  
  for (const tx of transactions) {
    const opportunity = analyzeTransaction(tx, userCardIds);
    if (opportunity) opportunities.push(opportunity);
    
    const risk = detectRiskAlerts(tx, averageMonthlyDiscretionary);
    if (risk) riskAlerts.push(risk);
  }
  
  return {
    opportunities,
    summary: summarizeOpportunities(opportunities),
    risk_alerts: riskAlerts,
  };
}

/**
 * Get reward rules for a specific card (for external use)
 */
export function getCardRewardRules(cardId: string): CardRewardRule[] {
  return REWARD_RULES.filter(r => r.card_id === cardId);
}

/**
 * Get all available reward rules
 */
export function getAllRewardRules(): CardRewardRule[] {
  return [...REWARD_RULES];
}
