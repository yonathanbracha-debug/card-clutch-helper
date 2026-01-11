// C2: Myth Detection - Deterministic pattern matching
// No ML. Dictionary-based myth classifier.

export interface CreditMyth {
  id: string;
  patterns: RegExp[];
  correction: string;
  why_it_matters: string;
  severity: 'low' | 'medium' | 'high';
  applies_to_depth: ('beginner' | 'intermediate' | 'advanced')[];
}

// Required myth IDs per spec
export const CREDIT_MYTHS: CreditMyth[] = [
  {
    id: 'MYTH_0_UTIL_IS_BEST',
    patterns: [
      /0%?\s*utilization\s*(is\s*)?(best|optimal|ideal)/i,
      /keep\s*(my\s*)?utilization\s*(at\s*)?0/i,
      /zero\s*utilization\s*(is\s*)?(good|best|better)/i,
      /should\s*(I\s*)?have\s*0\s*utilization/i,
    ],
    correction: '0% utilization is NOT optimal. Lenders want to see responsible use. 1-9% reported utilization typically scores best.',
    why_it_matters: 'Zero utilization suggests inactive accounts. Scoring models reward low but non-zero usage that demonstrates responsible borrowing behavior.',
    severity: 'medium',
    applies_to_depth: ['beginner', 'intermediate', 'advanced'],
  },
  {
    id: 'MYTH_PAY_BY_DUE_DATE_AFFECTS_UTIL',
    patterns: [
      /pay\s*(by|before)\s*(the\s*)?due\s*date\s*(to\s*)?(lower|reduce|improve)\s*(my\s*)?utilization/i,
      /due\s*date\s*(payment\s*)?(affect|impact|change)\s*(my\s*)?utilization/i,
      /paying\s*(on\s*)?due\s*date\s*(helps?|lowers?)\s*utilization/i,
    ],
    correction: 'Utilization is reported on statement CLOSE date, not due date. Pay BEFORE statement closes to lower reported utilization.',
    why_it_matters: 'Most issuers report balances to bureaus when the statement generates, not when payment is due. Paying by due date avoids interest but does not affect the utilization reported to bureaus.',
    severity: 'high',
    applies_to_depth: ['beginner', 'intermediate', 'advanced'],
  },
  {
    id: 'MYTH_CARRYING_BALANCE_BUILDS_SCORE',
    patterns: [
      /carry(ing)?\s*(a\s*)?balance\s*(to\s*)?(build|improve|help)\s*(my\s*)?(credit|score)/i,
      /need\s*(to\s*)?carry\s*(a\s*)?balance/i,
      /keep(ing)?\s*(a\s*)?balance\s*(help|build|improve)/i,
      /balance\s*(to\s*)?build\s*credit/i,
      /paying\s*interest\s*(helps?|builds?)\s*(credit|score)/i,
    ],
    correction: 'You do NOT need to carry a balance. Pay in full every month. Interest payments do not help your score.',
    why_it_matters: 'This myth costs consumers billions in unnecessary interest. Payment history (on-time) matters. Carrying a balance only increases utilization and costs you money.',
    severity: 'high',
    applies_to_depth: ['beginner', 'intermediate', 'advanced'],
  },
  {
    id: 'MYTH_CREDIT_CHECK_HURTS_ALWAYS',
    patterns: [
      /checking\s*(my\s*)?(own\s*)?credit\s*(score\s*)?(hurt|damage|lower|bad)/i,
      /soft\s*pull\s*(hurt|damage|lower|affect)\s*(my\s*)?score/i,
      /every\s*credit\s*check\s*(hurt|damage)/i,
      /checking\s*(credit|score)\s*(is\s*)?bad/i,
    ],
    correction: 'Checking your own credit is a SOFT pull. It has zero effect on your score. Only HARD inquiries (applications) can affect your score.',
    why_it_matters: 'Fear of checking credit leads to ignorance about your own financial health. Soft pulls are invisible to scoring models.',
    severity: 'medium',
    applies_to_depth: ['beginner', 'intermediate', 'advanced'],
  },
  {
    id: 'MYTH_CLOSING_DATE_IS_DUE_DATE',
    patterns: [
      /statement\s*(close|closing)\s*(date\s*)?(is\s*)?(the\s*)?(same\s*as\s*)?(due\s*date|when.*pay)/i,
      /due\s*date\s*(is\s*)?(when\s*)?(statement\s*)?(close|closes)/i,
      /close\s*date\s*(and\s*)?due\s*date\s*(are\s*)?(the\s*)?same/i,
    ],
    correction: 'Statement close date and due date are different. Close date is when your statement generates. Due date is ~21-25 days later when payment is due.',
    why_it_matters: 'Confusing these dates causes missed payment timing for utilization optimization and can lead to unnecessary interest charges.',
    severity: 'high',
    applies_to_depth: ['beginner', 'intermediate', 'advanced'],
  },
  {
    id: 'MYTH_PAYING_INTEREST_HELPS_APPROVALS',
    patterns: [
      /paying\s*interest\s*(help|improve|increase)\s*(my\s*)?(approval|chance|odds)/i,
      /interest\s*(payment|charge)\s*(show|prove)\s*(I\s*am|I\'m)\s*(responsible|good)/i,
      /bank\s*(like|want|prefer)\s*(me\s*to\s*)?pay\s*interest/i,
    ],
    correction: 'Paying interest does NOT improve approval odds. Banks profit from interest but scoring models do not reward it.',
    why_it_matters: 'This myth benefits lenders, not you. Your creditworthiness is determined by payment history, utilization, and account age—not by how much interest you pay.',
    severity: 'high',
    applies_to_depth: ['beginner', 'intermediate', 'advanced'],
  },
  {
    id: 'MYTH_BNPL_HAS_NO_CREDIT_IMPACT',
    patterns: [
      /bnpl\s*(has\s*)?(no|zero|doesn\'t|does\s*not)\s*(affect|impact|hurt)\s*(my\s*)?(credit|score)/i,
      /buy\s*now\s*pay\s*later\s*(doesn\'t|does\s*not|no)\s*(affect|impact|show)/i,
      /affirm|klarna|afterpay\s*(doesn\'t|does\s*not)\s*(report|affect|impact)/i,
      /bnpl\s*(is\s*)?(not\s*)?(on\s*)?(my\s*)?credit\s*report/i,
    ],
    correction: 'Many BNPL providers now report to credit bureaus. Missed payments CAN hurt your score. Late BNPL can go to collections.',
    why_it_matters: 'BNPL is increasingly reported to bureaus. A missed BNPL payment can result in collection accounts that severely damage credit for years.',
    severity: 'high',
    applies_to_depth: ['beginner', 'intermediate', 'advanced'],
  },
];

export type AnswerDepth = 'beginner' | 'intermediate' | 'advanced';

export interface MythDetectionResult {
  flags: string[];
  corrections: Array<{
    myth_id: string;
    correction: string;
    why_it_matters: string;
  }>;
}

/**
 * Detect myths in user question
 * Returns myth IDs and corrections for matched patterns
 */
export function detectMyths(question: string, depth: AnswerDepth): MythDetectionResult {
  const flags: string[] = [];
  const corrections: MythDetectionResult['corrections'] = [];

  for (const myth of CREDIT_MYTHS) {
    // Check if myth applies to current depth
    if (!myth.applies_to_depth.includes(depth)) continue;

    // Check all patterns
    for (const pattern of myth.patterns) {
      if (pattern.test(question)) {
        if (!flags.includes(myth.id)) {
          flags.push(myth.id);
          corrections.push({
            myth_id: myth.id,
            correction: myth.correction,
            why_it_matters: myth.why_it_matters,
          });
        }
        break; // One match per myth is enough
      }
    }
  }

  return { flags, corrections };
}

/**
 * Get myth by ID
 */
export function getMythById(id: string): CreditMyth | undefined {
  return CREDIT_MYTHS.find(m => m.id === id);
}
