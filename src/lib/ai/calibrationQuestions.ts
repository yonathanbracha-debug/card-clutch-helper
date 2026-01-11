// C3: Calibration Questions Logic
// Deterministic rules for when calibration is required

import type { CalibrationQuestion } from './answerSchema';

// Topic definitions that require specific facts
interface TopicRequirement {
  topic_id: string;
  patterns: RegExp[];
  required_facts: string[];
  questions: CalibrationQuestion[];
}

const TOPIC_REQUIREMENTS: TopicRequirement[] = [
  {
    topic_id: 'utilization_timing',
    patterns: [
      /when\s*(should\s*I\s*)?(pay|make\s*payment)\s*(to\s*)?(lower|reduce|optimize)\s*utilization/i,
      /utilization\s*(timing|when|before|after)/i,
      /statement\s*close\s*(date|when|timing)/i,
      /pay\s*before\s*statement/i,
      /optimize\s*utilization/i,
    ],
    required_facts: ['statement_close_date', 'current_balance', 'credit_limit', 'target_utilization'],
    questions: [
      {
        id: 'statement_close_date',
        prompt: 'When does your statement close? (day of month)',
        type: 'number',
        required: true,
      },
      {
        id: 'current_balance',
        prompt: 'What is your current balance?',
        type: 'currency',
        required: true,
      },
      {
        id: 'credit_limit',
        prompt: 'What is your credit limit?',
        type: 'currency',
        required: true,
      },
      {
        id: 'target_utilization',
        prompt: 'What utilization % are you targeting?',
        type: 'single_select',
        options: [
          { value: '1-5', label: '1-5% (optimal)' },
          { value: '6-10', label: '6-10% (good)' },
          { value: '11-30', label: '11-30% (acceptable)' },
          { value: 'unsure', label: 'Not sure' },
        ],
        required: true,
      },
    ],
  },
  {
    topic_id: 'bnpl_risk',
    patterns: [
      /bnpl\s*(safe|risk|danger|affect|impact)/i,
      /buy\s*now\s*pay\s*later\s*(safe|risk|good|bad)/i,
      /affirm|klarna|afterpay\s*(risk|safe|good)/i,
      /should\s*I\s*(use\s*)?bnpl/i,
    ],
    required_facts: ['bnpl_usage', 'carry_balance', 'credit_utilization'],
    questions: [
      {
        id: 'bnpl_current_usage',
        prompt: 'How often do you currently use BNPL?',
        type: 'single_select',
        options: [
          { value: 'never', label: 'Never' },
          { value: 'rarely', label: 'Rarely (1-2x/year)' },
          { value: 'sometimes', label: 'Sometimes (monthly)' },
          { value: 'often', label: 'Often (weekly)' },
        ],
        required: true,
      },
      {
        id: 'bnpl_outstanding',
        prompt: 'Do you have any outstanding BNPL balances?',
        type: 'single_select',
        options: [
          { value: 'no', label: 'No' },
          { value: 'yes_current', label: 'Yes, all current' },
          { value: 'yes_late', label: 'Yes, some late' },
        ],
        required: true,
      },
    ],
  },
  {
    topic_id: 'card_recommendation',
    patterns: [
      /which\s*card\s*(should|best|recommend)/i,
      /best\s*card\s*for/i,
      /recommend\s*(a\s*)?card/i,
      /what\s*card\s*should\s*I\s*(use|get|apply)/i,
    ],
    required_facts: ['spending_category', 'monthly_spend', 'reward_preference'],
    questions: [
      {
        id: 'spending_category',
        prompt: 'What category is this purchase?',
        type: 'single_select',
        options: [
          { value: 'dining', label: 'Dining' },
          { value: 'groceries', label: 'Groceries' },
          { value: 'travel', label: 'Travel' },
          { value: 'gas', label: 'Gas' },
          { value: 'online', label: 'Online Shopping' },
          { value: 'general', label: 'General/Other' },
        ],
        required: true,
      },
      {
        id: 'purchase_amount',
        prompt: 'Approximate purchase amount?',
        type: 'currency',
        required: false,
      },
    ],
  },
  {
    topic_id: 'balance_payoff',
    patterns: [
      /pay\s*off\s*(my\s*)?(debt|balance|card)/i,
      /debt\s*(payoff|strategy|plan)/i,
      /avalanche|snowball\s*method/i,
      /which\s*(balance|card)\s*(to\s*)?pay\s*first/i,
    ],
    required_facts: ['balances', 'aprs', 'minimum_payments'],
    questions: [
      {
        id: 'num_cards_with_balance',
        prompt: 'How many cards have a balance?',
        type: 'number',
        required: true,
      },
      {
        id: 'total_debt',
        prompt: 'Approximate total credit card debt?',
        type: 'currency',
        required: true,
      },
      {
        id: 'highest_apr',
        prompt: 'What is your highest APR?',
        type: 'single_select',
        options: [
          { value: 'under_15', label: 'Under 15%' },
          { value: '15-20', label: '15-20%' },
          { value: '20-25', label: '20-25%' },
          { value: 'over_25', label: 'Over 25%' },
          { value: 'unknown', label: 'Not sure' },
        ],
        required: true,
      },
    ],
  },
  {
    topic_id: 'credit_limit_increase',
    patterns: [
      /credit\s*limit\s*(increase|raise|higher)/i,
      /cli\s*(request|ask|get)/i,
      /increase\s*(my\s*)?limit/i,
      /ask\s*for\s*(more|higher)\s*limit/i,
    ],
    required_facts: ['current_limit', 'income', 'utilization'],
    questions: [
      {
        id: 'current_limit',
        prompt: 'What is your current credit limit?',
        type: 'currency',
        required: true,
      },
      {
        id: 'account_age_months',
        prompt: 'How long have you had this card?',
        type: 'single_select',
        options: [
          { value: 'under_6', label: 'Under 6 months' },
          { value: '6-12', label: '6-12 months' },
          { value: '1-2_years', label: '1-2 years' },
          { value: 'over_2', label: 'Over 2 years' },
        ],
        required: true,
      },
    ],
  },
];

// Standard calibration questions for first-time users
export const INITIAL_CALIBRATION_QUESTIONS: CalibrationQuestion[] = [
  {
    id: 'goal',
    prompt: 'What is your primary goal?',
    type: 'single_select',
    options: [
      { value: 'score', label: 'Build/Protect Credit Score' },
      { value: 'rewards', label: 'Maximize Rewards' },
      { value: 'both', label: 'Both' },
    ],
    required: true,
  },
  {
    id: 'carry_balance',
    prompt: 'Do you carry a balance month to month?',
    type: 'single_select',
    options: [
      { value: 'no', label: 'No, I pay in full' },
      { value: 'sometimes', label: 'Sometimes' },
      { value: 'usually', label: 'Usually' },
    ],
    required: true,
  },
  {
    id: 'knows_statement_vs_due',
    prompt: 'Do you know the difference between statement close and due date?',
    type: 'single_select',
    options: [
      { value: 'yes', label: 'Yes' },
      { value: 'no', label: 'No' },
      { value: 'unsure', label: 'Not sure' },
    ],
    required: true,
  },
  {
    id: 'bnpl_usage',
    prompt: 'How often do you use Buy Now, Pay Later (BNPL)?',
    type: 'single_select',
    options: [
      { value: 'never', label: 'Never' },
      { value: 'sometimes', label: 'Sometimes' },
      { value: 'often', label: 'Often' },
    ],
    required: true,
  },
  {
    id: 'confidence_level',
    prompt: 'How confident are you about credit decisions?',
    type: 'single_select',
    options: [
      { value: 'low', label: 'Not confident' },
      { value: 'medium', label: 'Somewhat confident' },
      { value: 'high', label: 'Very confident' },
    ],
    required: true,
  },
  {
    id: 'wants_edge_cases',
    prompt: 'Do you want answers to include edge cases and assumptions?',
    type: 'single_select',
    options: [
      { value: 'no', label: 'No, keep it simple' },
      { value: 'yes', label: 'Yes, show me everything' },
    ],
    required: true,
  },
];

export interface CalibrationContext {
  hasCalibration: boolean;
  userCalibration?: {
    knows_statement_vs_due?: boolean;
    understands_utilization?: boolean;
    carry_balance?: boolean;
    bnpl_usage?: string;
    confidence_level?: string;
    goal_score?: boolean;
    goal_rewards?: boolean;
  };
  contextProvided?: Record<string, unknown>;
}

export interface CalibrationResult {
  needed: boolean;
  questions: CalibrationQuestion[];
  topic_id?: string;
}

/**
 * Determine if calibration is needed for a question
 * Returns needed=true with questions if user context is missing required facts
 */
export function checkCalibrationNeeded(
  question: string,
  context: CalibrationContext
): CalibrationResult {
  // If user has never calibrated, require initial calibration
  if (!context.hasCalibration) {
    return {
      needed: true,
      questions: INITIAL_CALIBRATION_QUESTIONS,
      topic_id: 'initial',
    };
  }

  // Check topic-specific requirements
  for (const topic of TOPIC_REQUIREMENTS) {
    const matches = topic.patterns.some(p => p.test(question));
    if (!matches) continue;

    // Check which required facts are missing
    const missingQuestions: CalibrationQuestion[] = [];
    
    for (const q of topic.questions) {
      const factProvided = context.contextProvided?.[q.id];
      if (!factProvided && q.required) {
        missingQuestions.push(q);
      }
    }

    // Limit to 5 questions max
    if (missingQuestions.length > 0) {
      return {
        needed: true,
        questions: missingQuestions.slice(0, 5),
        topic_id: topic.topic_id,
      };
    }
  }

  return {
    needed: false,
    questions: [],
  };
}

/**
 * Map calibration answers to user preferences
 */
export function mapCalibrationToPreferences(answers: Record<string, string>): {
  answer_depth?: 'beginner' | 'intermediate' | 'advanced';
  calibration: Partial<{
    knows_statement_vs_due: boolean;
    understands_utilization: boolean;
    carry_balance: boolean;
    bnpl_usage: string;
    confidence_level: string;
    goal_score: boolean;
    goal_rewards: boolean;
  }>;
} {
  const calibration: Record<string, unknown> = {};
  let answer_depth: 'beginner' | 'intermediate' | 'advanced' | undefined;

  if (answers.goal) {
    calibration.goal_score = answers.goal === 'score' || answers.goal === 'both';
    calibration.goal_rewards = answers.goal === 'rewards' || answers.goal === 'both';
  }

  if (answers.carry_balance) {
    calibration.carry_balance = answers.carry_balance !== 'no';
  }

  if (answers.knows_statement_vs_due) {
    calibration.knows_statement_vs_due = answers.knows_statement_vs_due === 'yes';
  }

  if (answers.bnpl_usage) {
    calibration.bnpl_usage = answers.bnpl_usage;
  }

  if (answers.confidence_level) {
    calibration.confidence_level = answers.confidence_level;
  }

  // Map wants_edge_cases to depth
  if (answers.wants_edge_cases === 'yes') {
    answer_depth = 'advanced';
  } else if (answers.confidence_level === 'high') {
    answer_depth = 'intermediate';
  } else {
    answer_depth = 'beginner';
  }

  return {
    answer_depth,
    calibration: calibration as any,
  };
}
