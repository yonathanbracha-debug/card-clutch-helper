/**
 * Statement Diagnostics Engine
 * Analyzes spending patterns and identifies optimization opportunities
 */

import type { Transaction } from './opportunityCostEngine';
import { analyzeTransactions, type OpportunitySummary, type MissedOpportunity } from './opportunityCostEngine';
import { detectSubscriptions, type SubscriptionCandidate } from './subscriptionEngine';
import { BENEFIT_RULES, doesTransactionTriggerBenefit, type BenefitRule } from './benefitRules';

export type CategorySpend = {
  category: string;
  total_spend: number;
  transaction_count: number;
  top_merchants: Array<{ merchant: string; total: number }>;
};

export type DiagnosticsReport = {
  period: {
    start_date: string;
    end_date: string;
    days: number;
  };
  
  spending: {
    total: number;
    by_category: CategorySpend[];
  };
  
  rewards: {
    estimated_earned: number;
    estimated_possible: number;
    missed_value: number;
    top_misses: MissedOpportunity[];
  };
  
  subscriptions: {
    total_monthly_cost: number;
    count: number;
    candidates: SubscriptionCandidate[];
  };
  
  missed_benefits: Array<{
    benefit: BenefitRule;
    month: string;
    detected_usage: boolean;
  }>;
  
  summary: OpportunitySummary;
  
  confidence_note: string;
};

/**
 * Run full diagnostics on transaction set
 */
export function runDiagnostics(
  transactions: Transaction[],
  userCards: Array<{ issuer: string; card_name: string }>,
  dateRange?: { start: string; end: string }
): DiagnosticsReport {
  // Default to last 30 days
  const now = new Date();
  const defaultStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  
  const startDate = dateRange?.start 
    ? new Date(dateRange.start) 
    : defaultStart;
  const endDate = dateRange?.end 
    ? new Date(dateRange.end) 
    : now;
  
  // Filter transactions to date range
  const filteredTxns = transactions.filter(t => {
    const txnDate = new Date(t.date);
    return txnDate >= startDate && txnDate <= endDate;
  });

  // 1. Spending by category
  const categoryMap = new Map<string, { total: number; count: number; merchants: Map<string, number> }>();
  
  for (const txn of filteredTxns) {
    if (!categoryMap.has(txn.category)) {
      categoryMap.set(txn.category, { total: 0, count: 0, merchants: new Map() });
    }
    const cat = categoryMap.get(txn.category)!;
    cat.total += txn.amount;
    cat.count += 1;
    cat.merchants.set(txn.merchant, (cat.merchants.get(txn.merchant) || 0) + txn.amount);
  }
  
  const byCategory: CategorySpend[] = Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      total_spend: Math.round(data.total * 100) / 100,
      transaction_count: data.count,
      top_merchants: Array.from(data.merchants.entries())
        .map(([merchant, total]) => ({ merchant, total: Math.round(total * 100) / 100 }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 5),
    }))
    .sort((a, b) => b.total_spend - a.total_spend);

  const totalSpend = byCategory.reduce((sum, cat) => sum + cat.total_spend, 0);

  // 2. Opportunity cost analysis
  // Opportunity cost analysis requires user card IDs - extract from userCards
  const userCardIds = userCards.map(c => c.card_name.toLowerCase().replace(/\s+/g, '-'));
  const { opportunities, summary } = analyzeTransactions(filteredTxns, userCardIds);
  
  // 3. Subscription detection (uses full 120 days, not just date range)
  const subscriptions = detectSubscriptions(transactions);
  const subscriptionMonthly = subscriptions.reduce(
    (sum, s) => sum + s.estimated_monthly_cost, 
    0
  );

  // 4. Missed benefits detection
  const missedBenefits: DiagnosticsReport['missed_benefits'] = [];
  
  // Get user's benefit rules
  const userBenefits = BENEFIT_RULES.filter(rule =>
    userCards.some(
      card =>
        card.issuer.toLowerCase().includes(rule.issuer.toLowerCase()) &&
        card.card_name.toLowerCase().includes(rule.card_name.toLowerCase())
    )
  );

  // Check monthly benefits for current month
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const monthTxns = transactions.filter(t => new Date(t.date) >= monthStart);

  for (const benefit of userBenefits) {
    if (benefit.cadence !== 'monthly') continue;

    const hasTriggered = monthTxns.some(txn => {
      const normalized = txn.merchant.toLowerCase().replace(/[^a-z0-9 ]/g, ' ');
      return doesTransactionTriggerBenefit(normalized, txn.category, benefit);
    });

    missedBenefits.push({
      benefit,
      month: currentMonth,
      detected_usage: hasTriggered,
    });
  }

  // 5. Calculate rewards estimates (simplified)
  // This is a rough estimate - actual rewards would require exact card rules
  const avgMultiplier = 1.5; // Conservative baseline
  const estimatedEarned = Math.round(totalSpend * avgMultiplier);
  const estimatedPossible = estimatedEarned + summary.total_missed_value_usd * 100; // Convert to points
  const missedValue = summary.total_missed_value_usd;

  return {
    period: {
      start_date: startDate.toISOString().split('T')[0],
      end_date: endDate.toISOString().split('T')[0],
      days: Math.round((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)),
    },
    spending: {
      total: Math.round(totalSpend * 100) / 100,
      by_category: byCategory,
    },
    rewards: {
      estimated_earned: estimatedEarned,
      estimated_possible: estimatedPossible,
      missed_value: Math.round(missedValue * 100) / 100,
      top_misses: opportunities.slice(0, 10),
    },
    subscriptions: {
      total_monthly_cost: Math.round(subscriptionMonthly * 100) / 100,
      count: subscriptions.length,
      candidates: subscriptions,
    },
    missed_benefits: missedBenefits,
    summary,
    confidence_note: 'These estimates are based on detected patterns and conservative valuations. Actual results may vary.',
  };
}

/**
 * Generate to-dos from diagnostics
 */
export function generateDiagnosticsTodos(
  report: DiagnosticsReport
): Array<{
  type: string;
  title: string;
  description: string;
  impact_usd: number;
  source: Record<string, unknown>;
}> {
  const todos: Array<{
    type: string;
    title: string;
    description: string;
    impact_usd: number;
    source: Record<string, unknown>;
  }> = [];

  // 1. Missed benefits
  for (const mb of report.missed_benefits) {
    if (!mb.detected_usage) {
      todos.push({
        type: 'claim_benefit',
        title: `Claim your ${mb.benefit.title}`,
        description: `You hold ${mb.benefit.card_name}. We did not detect a qualifying charge this month. If you use ${mb.benefit.triggers.merchant_includes?.slice(0, 2).join(', ') || 'qualifying merchants'}, you may have $${mb.benefit.value_usd} available.`,
        impact_usd: mb.benefit.value_usd,
        source: {
          benefit_id: mb.benefit.benefit_id,
          month: mb.month,
          card_name: mb.benefit.card_name,
        },
      });
    }
  }

  // 2. Top category misses - suggest card rules
  for (const miss of report.summary.top_3_errors.slice(0, 2)) {
    if (miss.missed_value_usd >= 5) {
      todos.push({
        type: 'switch_card_rule',
        title: `Set default card for ${miss.category}`,
        description: miss.explanation,
        impact_usd: miss.missed_value_usd,
        source: {
          category: miss.category,
        },
      });
    }
  }

  return todos;
}
