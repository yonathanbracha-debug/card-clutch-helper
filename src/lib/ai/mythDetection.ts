/**
 * Myth Detection Engine
 * Deterministic classifier for common credit myths
 * NO ML, NO LLM - Pure pattern matching
 */

// Known myth patterns with corrections
export interface MythPattern {
  id: string;
  keywords: string[];
  phrases: string[];
  myth: string;
  correction: string;
  severity: 'low' | 'medium' | 'high';
}

export const MYTH_PATTERNS: MythPattern[] = [
  {
    id: 'zero-utilization',
    keywords: ['0%', 'zero', '0 percent', 'no balance'],
    phrases: ['utilization', 'usage', 'credit use'],
    myth: '0% utilization is best for your score',
    correction: 'Some utilization (1-9%) is actually better than 0%. Scoring models may interpret zero usage as inactivity.',
    severity: 'medium',
  },
  {
    id: 'closing-date-myth',
    keywords: ['closing date', 'statement date', 'when to pay'],
    phrases: ["doesn't matter", 'doesnt matter', 'any time', 'anytime'],
    myth: 'It doesn\'t matter when you pay as long as you pay',
    correction: 'Payment timing affects utilization reporting. Balances are typically reported on statement close, not due date. Paying before statement close can lower reported utilization.',
    severity: 'high',
  },
  {
    id: 'minimum-payment',
    keywords: ['minimum', 'min payment', 'minimum payment'],
    phrases: ['avoid interest', 'no interest', 'interest free'],
    myth: 'Paying the minimum avoids interest charges',
    correction: 'The minimum payment does NOT avoid interest. Interest accrues on unpaid balances. Pay in full each month to avoid interest.',
    severity: 'high',
  },
  {
    id: 'credit-cycling',
    keywords: ['cycling', 'cycle credit', 'reuse credit'],
    phrases: ['illegal', 'fraud', 'against the law'],
    myth: 'Credit cycling is illegal',
    correction: 'Credit cycling (paying mid-cycle to reuse available credit) is not illegal, but may trigger issuer reviews. It can indicate over-reliance on credit.',
    severity: 'low',
  },
  {
    id: 'new-card-hurts',
    keywords: ['new card', 'opening card', 'apply for card'],
    phrases: ['hurts', 'damages', 'lowers', 'bad for', 'always hurts'],
    myth: 'Opening a new card always hurts your credit long-term',
    correction: 'A new card causes a temporary dip (hard inquiry, lower average age), but long-term benefits include lower utilization and improved credit mix. The impact depends on your overall profile.',
    severity: 'medium',
  },
  {
    id: 'close-old-cards',
    keywords: ['close', 'cancel', 'closing old'],
    phrases: ['old card', 'unused card', 'don\'t use'],
    myth: 'You should close credit cards you don\'t use',
    correction: 'Closing old cards can hurt your score by reducing total credit (higher utilization) and shortening credit history. Keep no-fee cards open, even if unused.',
    severity: 'high',
  },
  {
    id: 'carry-balance',
    keywords: ['carry balance', 'keep balance', 'leave balance'],
    phrases: ['builds credit', 'helps score', 'good for credit'],
    myth: 'Carrying a balance helps build credit',
    correction: 'Carrying a balance does NOT help your score. It costs you money in interest. Pay in full each month - this still builds credit history.',
    severity: 'high',
  },
  {
    id: 'income-score',
    keywords: ['income', 'salary', 'how much you make'],
    phrases: ['affects score', 'credit score', 'part of score'],
    myth: 'Your income affects your credit score',
    correction: 'Income is NOT a factor in credit scores. FICO and VantageScore only consider credit-related factors. However, income affects approval decisions.',
    severity: 'low',
  },
  {
    id: 'checking-hurts',
    keywords: ['checking score', 'check my score', 'credit check'],
    phrases: ['hurts', 'lowers', 'damages', 'bad'],
    myth: 'Checking your own credit hurts your score',
    correction: 'Checking your own credit is a "soft pull" and has NO effect on your score. Only "hard pulls" from applications can (temporarily) lower your score.',
    severity: 'low',
  },
  {
    id: 'debit-builds',
    keywords: ['debit card', 'debit'],
    phrases: ['builds credit', 'helps score', 'credit history'],
    myth: 'Using a debit card builds credit',
    correction: 'Debit cards do NOT report to credit bureaus and have no effect on your credit score. Only credit accounts build credit history.',
    severity: 'medium',
  },
];

export interface MythDetectionResult {
  detected: boolean;
  myths: Array<{
    id: string;
    myth: string;
    correction: string;
    severity: 'low' | 'medium' | 'high';
    matchedPattern: string;
  }>;
}

/**
 * Detect myths in user query - pure deterministic matching
 */
export function detectMyths(query: string): MythDetectionResult {
  const normalizedQuery = query.toLowerCase().trim();
  const detectedMyths: MythDetectionResult['myths'] = [];
  
  for (const pattern of MYTH_PATTERNS) {
    // Check if query contains any keywords AND any phrases
    const hasKeyword = pattern.keywords.some(k => normalizedQuery.includes(k.toLowerCase()));
    const hasPhrase = pattern.phrases.some(p => normalizedQuery.includes(p.toLowerCase()));
    
    if (hasKeyword && hasPhrase) {
      detectedMyths.push({
        id: pattern.id,
        myth: pattern.myth,
        correction: pattern.correction,
        severity: pattern.severity,
        matchedPattern: `${pattern.keywords.find(k => normalizedQuery.includes(k.toLowerCase()))} + ${pattern.phrases.find(p => normalizedQuery.includes(p.toLowerCase()))}`,
      });
    }
  }
  
  return {
    detected: detectedMyths.length > 0,
    myths: detectedMyths,
  };
}

/**
 * Get all myths for educational display
 */
export function getAllMyths(): MythPattern[] {
  return [...MYTH_PATTERNS];
}

/**
 * Get myths by severity
 */
export function getMythsBySeverity(severity: 'low' | 'medium' | 'high'): MythPattern[] {
  return MYTH_PATTERNS.filter(m => m.severity === severity);
}
