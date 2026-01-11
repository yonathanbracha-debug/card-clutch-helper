/**
 * Credit Pathway Engine v1
 * Deterministic roadmap generation - NO ML, NO VIBES
 * 
 * Core Principle: Never recommend a card the user is unlikely to be approved for.
 * Never optimize rewards at the expense of credit health.
 */

import { CreditProfile, CreditState, deriveCreditState } from '@/hooks/useCreditProfile';

// Credit Pathway Output Schema - Section D (HARD CONTRACT)
export interface CreditPathway {
  current_stage: CreditPathwayStage;
  approval_constraints: string[];
  
  recommended_next_cards: RecommendedCard[];
  blocked_cards: BlockedCard[];
  
  timeline: PathwayTimeline;
  behavior_rules: string[];
}

export type CreditPathwayStage = 
  | 'first_card' 
  | 'early_builder' 
  | 'established_builder' 
  | 'optimizer' 
  | 'advanced_optimizer';

export interface RecommendedCard {
  card_name: string;
  issuer: string;
  reason: string;
  prerequisites: string[];
  estimated_approval_odds: 'high' | 'medium' | 'low';
}

export interface BlockedCard {
  card_name: string;
  reason_blocked: string;
  retry_after?: string;
}

export interface PathwayTimeline {
  now: string;
  next_3_6_months: string;
  next_12_months: string;
}

// Credit history type
export type CreditHistory = 'none' | 'thin' | 'established';

// Extended profile for pathway calculation
export interface PathwayProfile extends Partial<CreditProfile> {
  credit_history?: CreditHistory;
  has_derogatories?: boolean;
}

// Issuer-specific rules - Section E
const ISSUER_RULES = {
  amex: {
    name: 'American Express',
    rules: [
      'Charge cards do NOT build limit history',
      'Thin file approval ≠ readiness for optimization',
      '1 Amex card per 5 days rule',
      'Once denied, wait 90 days before reapply',
    ],
    thinFileAcceptable: true,
  },
  chase: {
    name: 'Chase',
    rules: [
      '5/24 rule: Cannot get most Chase cards if opened 5+ cards in past 24 months',
      'Need 1+ year of credit history for most cards',
      'Prefer existing banking relationship',
    ],
    thinFileAcceptable: false,
  },
  capital_one: {
    name: 'Capital One',
    rules: [
      'Buckets early behavior heavily - hard to upgrade',
      'Often approves thin file at low limits',
      'Credit limit increases can be difficult',
    ],
    thinFileAcceptable: true,
  },
  discover: {
    name: 'Discover',
    rules: [
      'Excellent for first card',
      'Student cards available with no history',
      'Graduating to better cards is straightforward',
    ],
    thinFileAcceptable: true,
  },
  citi: {
    name: 'Citi',
    rules: [
      '24 month signup bonus restriction per card family',
      'Generally needs established credit',
    ],
    thinFileAcceptable: false,
  },
} as const;

// Starter cards for those with no/thin credit
const STARTER_CARDS: RecommendedCard[] = [
  {
    card_name: 'Discover it Student',
    issuer: 'Discover',
    reason: 'Best for students with no credit history. 5% rotating categories.',
    prerequisites: ['Enrolled in college or university'],
    estimated_approval_odds: 'high',
  },
  {
    card_name: 'Discover it Secured',
    issuer: 'Discover',
    reason: 'Best secured card. $200 minimum deposit. Graduates to unsecured.',
    prerequisites: ['$200 refundable deposit', 'Bank account'],
    estimated_approval_odds: 'high',
  },
  {
    card_name: 'Capital One Platinum',
    issuer: 'Capital One',
    reason: 'No annual fee starter card. See if you pre-qualify first.',
    prerequisites: ['Check pre-qualification (no hard inquiry)'],
    estimated_approval_odds: 'medium',
  },
];

// Builder cards for those establishing credit
const BUILDER_CARDS: RecommendedCard[] = [
  {
    card_name: 'Chase Freedom Flex',
    issuer: 'Chase',
    reason: '5% rotating categories, 3% dining/drugstore. Builds Chase relationship.',
    prerequisites: ['1+ year credit history', 'No Chase denials in 30 days'],
    estimated_approval_odds: 'medium',
  },
  {
    card_name: 'Citi Double Cash',
    issuer: 'Citi',
    reason: 'Effective 2% on everything. No category tracking needed.',
    prerequisites: ['1+ year credit history', '680+ credit score'],
    estimated_approval_odds: 'medium',
  },
  {
    card_name: 'Capital One SavorOne',
    issuer: 'Capital One',
    reason: '3% dining, entertainment, grocery. No annual fee.',
    prerequisites: ['Good credit', 'Check pre-qualification first'],
    estimated_approval_odds: 'medium',
  },
];

// Premium cards for optimizers
const OPTIMIZER_CARDS: RecommendedCard[] = [
  {
    card_name: 'Chase Sapphire Preferred',
    issuer: 'Chase',
    reason: 'Entry to Ultimate Rewards ecosystem. 3x dining/travel.',
    prerequisites: ['2+ years credit history', '720+ credit score', 'Under 5/24'],
    estimated_approval_odds: 'medium',
  },
  {
    card_name: 'American Express Gold',
    issuer: 'American Express',
    reason: '4x restaurants/groceries. Excellent for food spend.',
    prerequisites: ['Good credit', 'Budget for $250 annual fee'],
    estimated_approval_odds: 'medium',
  },
];

// Advanced optimizer cards
const ADVANCED_CARDS: RecommendedCard[] = [
  {
    card_name: 'Chase Sapphire Reserve',
    issuer: 'Chase',
    reason: '3x travel/dining. $300 travel credit. Priority Pass.',
    prerequisites: ['2+ years credit history', '740+ score', 'Under 5/24', 'High income'],
    estimated_approval_odds: 'medium',
  },
  {
    card_name: 'American Express Platinum',
    issuer: 'American Express',
    reason: 'Premium travel perks. Centurion Lounges. High credits offset fee.',
    prerequisites: ['Excellent credit', 'High income', 'Heavy travel spend'],
    estimated_approval_odds: 'medium',
  },
];

// Cards blocked for specific reasons
function getBlockedCards(profile: PathwayProfile, stage: CreditPathwayStage): BlockedCard[] {
  const blocked: BlockedCard[] = [];
  
  if (profile.carry_balance) {
    blocked.push({
      card_name: 'Any Premium Card (Sapphire Reserve, Amex Platinum, etc.)',
      reason_blocked: 'Interest payments negate premium card benefits. Pay off balances first.',
      retry_after: 'After 3 consecutive months of paying in full',
    });
  }
  
  if (stage === 'first_card' || stage === 'early_builder') {
    blocked.push({
      card_name: 'Chase Sapphire Cards',
      reason_blocked: 'Chase requires 1+ year of credit history. Build more history first.',
      retry_after: '12+ months of responsible credit use',
    });
    
    blocked.push({
      card_name: 'Citi Premier / Custom Cash',
      reason_blocked: 'Citi generally requires established credit history.',
      retry_after: '12-18 months of credit history',
    });
  }
  
  if (profile.has_derogatories) {
    blocked.push({
      card_name: 'Most Premium Cards',
      reason_blocked: 'Negative marks significantly reduce approval odds for premium products.',
      retry_after: 'After negative marks age (typically 2+ years)',
    });
  }
  
  if (profile.age_bucket === '<18') {
    blocked.push({
      card_name: 'All Credit Cards',
      reason_blocked: 'Must be 18+ to open a credit card in your own name.',
      retry_after: 'When you turn 18',
    });
  }
  
  if (profile.bnpl_usage === 'often') {
    blocked.push({
      card_name: 'High-Limit Cards',
      reason_blocked: 'Frequent BNPL usage indicates credit reliance. Focus on stability first.',
      retry_after: '3+ months with no BNPL usage',
    });
  }
  
  return blocked;
}

// Generate behavior rules based on stage
function getBehaviorRules(stage: CreditPathwayStage, profile: PathwayProfile): string[] {
  const rules: string[] = [];
  
  // Universal rules
  rules.push('Always pay at least the minimum by due date');
  rules.push('Keep utilization under 30% (under 10% is optimal)');
  
  if (stage === 'first_card' || stage === 'early_builder') {
    rules.push('Do not apply for multiple cards simultaneously');
    rules.push('Wait 6+ months between applications');
    rules.push('Use the card monthly for small purchases');
    rules.push('Set up autopay for at least the minimum');
  }
  
  if (stage === 'established_builder' || stage === 'optimizer') {
    rules.push('Request credit limit increases every 6-12 months');
    rules.push('Track your 5/24 status if considering Chase cards');
    rules.push('Match card usage to bonus categories');
  }
  
  if (profile.carry_balance) {
    rules.push('PRIORITY: Pay off existing balances before optimizing rewards');
    rules.push('Consider balance transfer offers to reduce interest');
    rules.push('Do not charge new purchases while carrying a balance');
  }
  
  if (profile.bnpl_usage === 'often' || profile.bnpl_usage === 'sometimes') {
    rules.push('Reduce BNPL usage - it fragments spending and complicates budgeting');
  }
  
  return rules;
}

// Generate timeline based on stage
function getTimeline(stage: CreditPathwayStage, profile: PathwayProfile): PathwayTimeline {
  if (stage === 'first_card') {
    return {
      now: 'Apply for a secured or student card. Set up autopay.',
      next_3_6_months: 'Use card responsibly. Build payment history. Request CLI after 6 months.',
      next_12_months: 'Evaluate graduation to unsecured card. Consider second no-AF card.',
    };
  }
  
  if (stage === 'early_builder') {
    return {
      now: 'Continue responsible use. Keep utilization low.',
      next_3_6_months: 'Apply for second card if history > 6 months. Consider Chase Freedom.',
      next_12_months: 'Establish 2-3 card foundation. Begin tracking category spending.',
    };
  }
  
  if (stage === 'established_builder') {
    return {
      now: 'Request CLIs on existing cards. Check 5/24 status.',
      next_3_6_months: 'Consider first Chase card or Amex entry point.',
      next_12_months: 'Build toward premium card eligibility. Optimize category coverage.',
    };
  }
  
  if (profile.carry_balance) {
    return {
      now: 'Focus exclusively on paying down balances.',
      next_3_6_months: 'Continue payoff. Do not apply for new cards.',
      next_12_months: 'Once balances are zero, reassess pathway.',
    };
  }
  
  // optimizer or advanced_optimizer
  return {
    now: 'Optimize current portfolio. Maximize category bonuses.',
    next_3_6_months: 'Consider premium upgrades or new product lines.',
    next_12_months: 'Annual strategy: evaluate keeper vs. downgrade decisions.',
  };
}

// Map profile to pathway stage
function determineStage(profile: PathwayProfile): CreditPathwayStage {
  // Under 18 cannot have cards
  if (profile.age_bucket === '<18') {
    return 'first_card';
  }
  
  // No credit history = first card
  if (profile.credit_history === 'none') {
    return 'first_card';
  }
  
  // Thin file = early builder
  if (profile.credit_history === 'thin') {
    return 'early_builder';
  }
  
  // Balance carriers cannot be optimizers
  if (profile.carry_balance) {
    return 'established_builder';
  }
  
  // Beginners with established credit = established builder
  if (profile.experience_level === 'beginner') {
    return 'established_builder';
  }
  
  // Intermediate = optimizer
  if (profile.experience_level === 'intermediate') {
    return 'optimizer';
  }
  
  // Advanced with no risk flags = advanced optimizer
  if (profile.experience_level === 'advanced' && !profile.has_derogatories) {
    return 'advanced_optimizer';
  }
  
  return 'optimizer';
}

// Get recommended cards for stage
function getRecommendedCards(stage: CreditPathwayStage, profile: PathwayProfile): RecommendedCard[] {
  // Balance carriers get no new card recommendations
  if (profile.carry_balance) {
    return [];
  }
  
  switch (stage) {
    case 'first_card':
      return STARTER_CARDS;
    case 'early_builder':
      return [...STARTER_CARDS.slice(2), ...BUILDER_CARDS.slice(0, 2)];
    case 'established_builder':
      return BUILDER_CARDS;
    case 'optimizer':
      return [...BUILDER_CARDS.slice(1), ...OPTIMIZER_CARDS];
    case 'advanced_optimizer':
      return [...OPTIMIZER_CARDS, ...ADVANCED_CARDS];
    default:
      return STARTER_CARDS;
  }
}

// Get approval constraints
function getApprovalConstraints(profile: PathwayProfile): string[] {
  const constraints: string[] = [];
  
  if (profile.age_bucket === '<18') {
    constraints.push('Must be 18+ to apply for credit cards');
  }
  
  if (profile.age_bucket === '18-20') {
    constraints.push('Limited options under 21 - student/secured cards recommended');
  }
  
  if (profile.credit_history === 'none') {
    constraints.push('No credit history limits options to secured or student cards');
  }
  
  if (profile.credit_history === 'thin') {
    constraints.push('Thin credit file restricts approval for premium products');
  }
  
  if (profile.has_derogatories) {
    constraints.push('Negative marks reduce approval odds significantly');
  }
  
  if (profile.income_bucket === '<25k') {
    constraints.push('Income under $25k limits premium card eligibility');
  }
  
  if (profile.carry_balance) {
    constraints.push('Carrying balances disqualifies rewards optimization focus');
  }
  
  if (profile.bnpl_usage === 'often') {
    constraints.push('Frequent BNPL usage may indicate credit reliance to issuers');
  }
  
  return constraints;
}

/**
 * Generate a complete credit pathway for a user
 * This is the main export - deterministic, issuer-aware, conservative
 */
export function generateCreditPathway(profile: PathwayProfile): CreditPathway {
  const stage = determineStage(profile);
  
  return {
    current_stage: stage,
    approval_constraints: getApprovalConstraints(profile),
    recommended_next_cards: getRecommendedCards(stage, profile),
    blocked_cards: getBlockedCards(profile, stage),
    timeline: getTimeline(stage, profile),
    behavior_rules: getBehaviorRules(stage, profile),
  };
}

/**
 * Stage display names for UI
 */
export const STAGE_DISPLAY_NAMES: Record<CreditPathwayStage, string> = {
  first_card: 'First Card',
  early_builder: 'Early Builder',
  established_builder: 'Established Builder',
  optimizer: 'Optimizer',
  advanced_optimizer: 'Advanced Optimizer',
};

/**
 * Stage descriptions for UI
 */
export const STAGE_DESCRIPTIONS: Record<CreditPathwayStage, string> = {
  first_card: 'Getting started with your first credit card',
  early_builder: 'Building credit history and payment track record',
  established_builder: 'Solid foundation, ready for more options',
  optimizer: 'Maximizing rewards with strategic card selection',
  advanced_optimizer: 'Advanced strategies for experienced users',
};

/**
 * Get issuer-specific rules for display
 */
export function getIssuerRules(issuer: keyof typeof ISSUER_RULES) {
  return ISSUER_RULES[issuer];
}

/**
 * Check if a specific card recommendation is blocked
 */
export function isCardBlocked(
  cardIssuer: string, 
  profile: PathwayProfile
): { blocked: boolean; reason?: string } {
  const lowerIssuer = cardIssuer.toLowerCase();
  
  // Chase 5/24 - would need to track actual card openings
  if (lowerIssuer.includes('chase') && profile.credit_history === 'none') {
    return { blocked: true, reason: 'Chase requires established credit history' };
  }
  
  if (profile.carry_balance && cardIssuer.toLowerCase().includes('amex')) {
    return { blocked: true, reason: 'Interest payments negate Amex rewards value' };
  }
  
  return { blocked: false };
}
