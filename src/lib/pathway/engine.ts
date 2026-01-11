/**
 * Pathway Engine v2
 * Extended pathway generation with Zod schema validation
 * Builds on existing creditPathwayEngine.ts
 */

import { CreditProfile, deriveCreditState } from '@/hooks/useCreditProfile';
import { 
  PathwayOutput, 
  CreditStage, 
  NextMove, 
  RecommendedCard, 
  TimelineMilestone,
  validatePathwayOutput 
} from './schema';

// Map internal stage to schema stage
const STAGE_MAP: Record<string, CreditStage> = {
  'starter': 'foundation',
  'first_card': 'foundation',
  'builder': 'build',
  'early_builder': 'build',
  'established_builder': 'build',
  'optimizer': 'optimize',
  'advanced_optimizer': 'scale',
  'elite': 'elite',
};

// Profile interface for pathway computation
export interface PathwayProfile {
  age_bucket?: string | null;
  income_bucket?: string | null;
  experience_level?: string;
  credit_history?: string | null;
  has_derogatories?: boolean;
  carry_balance?: boolean;
  bnpl_usage?: string | null;
  intent?: string;
  current_cards?: Array<{
    issuer: string;
    product_family: string;
    network: string;
    annual_fee: boolean;
    opened_year?: number;
  }>;
  known_constraints?: {
    chase_5_24_estimate?: number;
    willing_to_pay_af?: boolean;
    travel_frequency?: 'never' | 'sometimes' | 'often';
  };
}

/**
 * Compute credit stage from profile
 * First-match wins ruleset
 */
export function computeCreditStage(profile: PathwayProfile): {
  stage: CreditStage;
  confidence: number;
  reasons: string[];
} {
  let confidence = 80;
  const reasons: string[] = [];
  
  const cardCount = profile.current_cards?.length || 0;
  const hasAnnualFeeCard = profile.current_cards?.some(c => c.annual_fee) || false;
  const hasPremiumCard = profile.current_cards?.some(c => 
    c.product_family?.toLowerCase().includes('platinum') ||
    c.product_family?.toLowerCase().includes('reserve') ||
    c.product_family?.toLowerCase().includes('infinite')
  ) || false;
  
  // Foundation: No credit history OR no cards
  if (profile.credit_history === 'none' || cardCount === 0) {
    reasons.push('No credit history or cards detected');
    return { stage: 'foundation', confidence, reasons };
  }
  
  // Build: Thin file OR 1-2 cards AND not holding premium
  if (profile.credit_history === 'thin' || (cardCount >= 1 && cardCount <= 2 && !hasPremiumCard)) {
    reasons.push('Building credit history with limited cards');
    if (profile.credit_history === 'thin') reasons.push('Thin credit file');
    return { stage: 'build', confidence, reasons };
  }
  
  // Balance carriers cannot progress past build
  if (profile.carry_balance) {
    reasons.push('Carrying balance - focus on debt payoff');
    confidence -= 10;
    return { stage: 'build', confidence, reasons };
  }
  
  // Optimize: 3+ cards AND no balance AND established credit
  if (cardCount >= 3 && !profile.carry_balance && 
      (profile.credit_history === 'established' || profile.credit_history === '1_3y' || profile.credit_history === '3_plus')) {
    reasons.push('Established history with multiple cards');
    reasons.push('Ready for rewards optimization');
    return { stage: 'optimize', confidence, reasons };
  }
  
  // Scale: 5+ cards OR willing to pay AF AND no balance
  if ((cardCount >= 5 || profile.known_constraints?.willing_to_pay_af) && !profile.carry_balance) {
    reasons.push('Extensive card portfolio');
    if (hasAnnualFeeCard) reasons.push('Already managing annual fee cards');
    return { stage: 'scale', confidence, reasons };
  }
  
  // Elite: 7+ cards AND 3+ years history AND no balance AND no derogatories
  if (cardCount >= 7 && profile.credit_history === '3_plus' && 
      !profile.carry_balance && !profile.has_derogatories) {
    reasons.push('Advanced credit user with extensive history');
    return { stage: 'elite', confidence, reasons };
  }
  
  // Confidence adjustments
  if (profile.credit_history === 'none' && cardCount > 0) {
    confidence -= 10;
    reasons.push('Possible data inconsistency');
  }
  if (!profile.income_bucket || profile.income_bucket === 'prefer_not') {
    confidence -= 10;
  }
  
  // Default to build
  reasons.push('General credit building phase');
  return { stage: 'build', confidence, reasons };
}

/**
 * Generate immediate focus items based on stage and profile
 */
function getImmediateFocus(stage: CreditStage, profile: PathwayProfile): string[] {
  const focus: string[] = [];
  
  if (profile.carry_balance) {
    focus.push('Pay down existing balances - this is your #1 priority');
    focus.push('Set up autopay for at least minimums on all cards');
  }
  
  switch (stage) {
    case 'foundation':
      focus.push('Apply for a secured or student card');
      focus.push('Set up autopay before your first statement');
      if (!profile.carry_balance) focus.push('Use the card monthly for small purchases');
      break;
    case 'build':
      focus.push('Keep utilization under 30% (under 10% is optimal)');
      focus.push('Make every payment on time');
      focus.push('Wait 6+ months before applying for additional cards');
      break;
    case 'optimize':
      focus.push('Match spending to category bonus cards');
      focus.push('Track 5/24 status if considering Chase cards');
      focus.push('Request credit limit increases annually');
      break;
    case 'scale':
      focus.push('Evaluate annual fee value vs. benefits used');
      focus.push('Consider product changes for underused cards');
      focus.push('Build issuer relationships strategically');
      break;
    case 'elite':
      focus.push('Maximize transfer partner value');
      focus.push('Time applications for best signup bonuses');
      focus.push('Annual card portfolio review');
      break;
  }
  
  return focus.slice(0, 5);
}

/**
 * Generate next moves with conditions and rationale
 */
function getNextMoves(stage: CreditStage, profile: PathwayProfile): NextMove[] {
  const moves: NextMove[] = [];
  
  if (profile.carry_balance) {
    moves.push({
      action: 'Create a debt payoff plan using avalanche or snowball method',
      condition: 'If carrying balances on multiple cards',
      rationale: 'Interest payments negate any rewards value. Payoff is always the priority.',
      priority: 'now',
    });
  }
  
  switch (stage) {
    case 'foundation':
      moves.push({
        action: 'Apply for Discover it Secured or student card',
        condition: 'If no credit cards currently',
        rationale: 'Discover has high approval rates and graduates to unsecured automatically.',
        priority: 'now',
      });
      moves.push({
        action: 'Set up automatic full balance payment',
        condition: 'After receiving first card',
        rationale: 'Builds payment history while avoiding interest.',
        priority: 'now',
      });
      moves.push({
        action: 'Request credit limit increase',
        condition: 'After 6 months of on-time payments',
        rationale: 'Lower utilization ratio improves score.',
        priority: 'later',
      });
      break;
      
    case 'build':
      moves.push({
        action: 'Apply for second no-annual-fee card',
        condition: 'After 6+ months of history with first card',
        rationale: 'Builds credit mix and total available credit.',
        priority: 'soon',
      });
      moves.push({
        action: 'Pay statement balance before due date',
        condition: 'Every billing cycle',
        rationale: 'Maintains zero interest and builds positive history.',
        priority: 'now',
      });
      break;
      
    case 'optimize':
      moves.push({
        action: 'Evaluate category-specific cards for top spending',
        condition: 'If monthly dining/grocery spend exceeds $300',
        rationale: 'Category bonuses can yield 3-4% instead of flat 1.5-2%.',
        priority: 'soon',
      });
      if (!profile.known_constraints?.chase_5_24_estimate || profile.known_constraints.chase_5_24_estimate < 5) {
        moves.push({
          action: 'Consider Chase Sapphire Preferred for travel/dining',
          condition: 'If under 5/24 and have 1+ year history',
          rationale: 'Entry to valuable Ultimate Rewards ecosystem.',
          priority: 'soon',
        });
      }
      break;
      
    case 'scale':
    case 'elite':
      moves.push({
        action: 'Review annual fee cards for positive ROI',
        condition: 'Before annual fee posts each year',
        rationale: 'Downgrade or cancel cards where benefits used < fee paid.',
        priority: 'soon',
      });
      moves.push({
        action: 'Consider premium cards with travel perks',
        condition: 'If travel frequency justifies premium annual fees',
        rationale: 'Lounge access and credits can offset high fees for frequent travelers.',
        priority: 'later',
      });
      break;
  }
  
  return moves.slice(0, 6);
}

/**
 * Generate do-not list based on stage and profile
 */
function getDoNots(stage: CreditStage, profile: PathwayProfile): string[] {
  const doNots: string[] = [];
  
  // Universal do-nots
  doNots.push('Do not miss a payment - this has the biggest negative impact');
  doNots.push('Do not apply for multiple cards within 30 days');
  
  if (stage === 'foundation' || stage === 'build') {
    doNots.push('Do not close your oldest card');
    doNots.push('Do not max out your credit limit');
    doNots.push('Do not apply for premium cards yet - build history first');
  }
  
  if (profile.carry_balance) {
    doNots.push('Do not apply for new cards while carrying balances');
    doNots.push('Do not chase rewards - focus on debt elimination');
  }
  
  if (profile.bnpl_usage === 'often') {
    doNots.push('Do not use BNPL for discretionary purchases - it fragments spending');
  }
  
  if (stage === 'optimize' || stage === 'scale') {
    doNots.push('Do not exceed 5/24 if you want Chase cards');
    doNots.push('Do not pay annual fees for cards you don\'t use');
  }
  
  return doNots.slice(0, 6);
}

/**
 * Generate recommended cards based on stage and constraints
 */
function getRecommendedCards(stage: CreditStage, profile: PathwayProfile): RecommendedCard[] {
  const cards: RecommendedCard[] = [];
  
  // No recommendations for balance carriers
  if (profile.carry_balance) {
    return [];
  }
  
  const is524Blocked = profile.known_constraints?.chase_5_24_estimate && 
                       profile.known_constraints.chase_5_24_estimate >= 5;
  
  switch (stage) {
    case 'foundation':
      cards.push({
        name: 'Discover it Secured',
        reason: 'Best secured card - $200 deposit, graduates to unsecured.',
        timing: 'Apply now',
        confidence: 'high',
      });
      cards.push({
        name: 'Capital One Platinum Secured',
        reason: 'Alternative secured option with no deposit for some.',
        timing: 'If Discover not available',
        confidence: 'medium',
      });
      break;
      
    case 'build':
      cards.push({
        name: 'Chase Freedom Flex',
        reason: '5% rotating categories, 3% dining. Builds Chase relationship.',
        timing: 'After 12+ months of history',
        confidence: is524Blocked ? 'low' : 'medium',
      });
      cards.push({
        name: 'Citi Double Cash',
        reason: 'Effective 2% on everything. Simple flat-rate card.',
        timing: 'After 12+ months of history',
        confidence: 'medium',
      });
      break;
      
    case 'optimize':
      if (!is524Blocked) {
        cards.push({
          name: 'Chase Sapphire Preferred',
          reason: 'Entry to Ultimate Rewards. 3x dining/travel.',
          timing: 'When under 5/24 with 720+ score',
          confidence: 'medium',
        });
      }
      cards.push({
        name: 'Amex Gold',
        reason: '4x restaurants/groceries. Excellent for food spend.',
        timing: 'If dining spend exceeds $300/month',
        confidence: 'medium',
      });
      break;
      
    case 'scale':
    case 'elite':
      if (profile.known_constraints?.travel_frequency === 'often') {
        cards.push({
          name: 'Chase Sapphire Reserve',
          reason: 'Premium travel perks, $300 credit, lounge access.',
          timing: 'If travel spend justifies $550 fee',
          confidence: is524Blocked ? 'low' : 'medium',
        });
        cards.push({
          name: 'Amex Platinum',
          reason: 'Centurion lounges, 5x flights, extensive credits.',
          timing: 'For frequent travelers who can use credits',
          confidence: 'medium',
        });
      }
      break;
  }
  
  return cards.slice(0, 5);
}

/**
 * Generate timeline milestones
 */
function getTimeline(stage: CreditStage, profile: PathwayProfile): TimelineMilestone[] {
  const timeline: TimelineMilestone[] = [];
  
  if (profile.carry_balance) {
    timeline.push({
      title: 'Pay off balances',
      when: 'Priority #1',
      success_metric: 'All cards at $0 balance',
    });
  }
  
  switch (stage) {
    case 'foundation':
      timeline.push({
        title: 'Get first credit card',
        when: 'Within 30 days',
        success_metric: 'Approved for secured or student card',
      });
      timeline.push({
        title: 'Set up autopay',
        when: 'Before first statement',
        success_metric: 'Full balance autopay enabled',
      });
      timeline.push({
        title: 'Build 6 months history',
        when: 'In 6 months',
        success_metric: 'Perfect payment record',
      });
      timeline.push({
        title: 'Request credit limit increase',
        when: 'After 6 months',
        success_metric: 'Higher limit, lower utilization',
      });
      break;
      
    case 'build':
      timeline.push({
        title: 'Maintain perfect payments',
        when: 'Ongoing',
        success_metric: '100% on-time payment rate',
      });
      timeline.push({
        title: 'Consider second card',
        when: 'At 6-12 months',
        success_metric: 'Additional no-AF card approved',
      });
      timeline.push({
        title: 'Reach established credit',
        when: 'At 12-24 months',
        success_metric: 'Ready for optimizer phase',
      });
      break;
      
    case 'optimize':
    case 'scale':
    case 'elite':
      timeline.push({
        title: 'Optimize category coverage',
        when: 'Ongoing',
        success_metric: 'Top spend categories have bonus cards',
      });
      timeline.push({
        title: 'Annual fee audit',
        when: 'Before renewal',
        success_metric: 'All fees offset by benefits used',
      });
      timeline.push({
        title: 'Portfolio review',
        when: 'Every 6 months',
        success_metric: 'Strategy aligned with goals',
      });
      break;
  }
  
  return timeline.slice(0, 8);
}

/**
 * Generate behavior rules
 */
function getBehaviorRules(stage: CreditStage, profile: PathwayProfile): string[] {
  const rules: string[] = [];
  
  // Universal rules
  rules.push('Always pay at least the minimum by due date');
  rules.push('Keep utilization under 30% (under 10% is optimal)');
  
  if (stage === 'foundation' || stage === 'build') {
    rules.push('Do not apply for multiple cards simultaneously');
    rules.push('Wait 6+ months between applications');
    rules.push('Use the card monthly for small purchases');
    rules.push('Set up autopay for at least the minimum');
  }
  
  if (stage === 'optimize' || stage === 'scale' || stage === 'elite') {
    rules.push('Request credit limit increases every 6-12 months');
    rules.push('Track your 5/24 status if considering Chase cards');
    rules.push('Match card usage to bonus categories');
  }
  
  if (profile.carry_balance) {
    rules.push('PRIORITY: Pay off existing balances before optimizing rewards');
    rules.push('Do not charge new purchases while carrying a balance');
  }
  
  return rules.slice(0, 8);
}

/**
 * Build complete pathway - MAIN EXPORT
 * This is the only function external code should call
 */
export function buildPathway(profile: PathwayProfile): PathwayOutput {
  const { stage, confidence, reasons } = computeCreditStage(profile);
  
  // Calculate next review date (30 days from now)
  const nextReview = new Date();
  nextReview.setDate(nextReview.getDate() + 30);
  
  const output: PathwayOutput = {
    credit_stage: stage,
    stage_confidence: confidence,
    stage_reasons: reasons,
    immediate_focus: getImmediateFocus(stage, profile),
    next_moves: getNextMoves(stage, profile),
    do_nots: getDoNots(stage, profile),
    recommended_cards: getRecommendedCards(stage, profile),
    timeline: getTimeline(stage, profile),
    next_review_date: nextReview.toISOString().split('T')[0],
    behavior_rules: getBehaviorRules(stage, profile),
  };
  
  // Validate output against schema - throws if invalid
  return validatePathwayOutput(output);
}

/**
 * Get pathway for existing credit profile
 */
export function getPathwayFromCreditProfile(profile: Partial<CreditProfile>): PathwayOutput {
  return buildPathway({
    age_bucket: profile.age_bucket ?? undefined,
    income_bucket: profile.income_bucket ?? undefined,
    experience_level: profile.experience_level,
    credit_history: profile.credit_history ?? undefined,
    has_derogatories: profile.has_derogatories,
    carry_balance: profile.carry_balance,
    bnpl_usage: profile.bnpl_usage ?? undefined,
    intent: profile.intent,
  });
}
