/**
 * Answer Depth Formatting - Deterministic Templates
 * Formats answers based on user's persisted answer_depth preference
 */

export type AnswerDepth = 'beginner' | 'intermediate' | 'advanced';

export interface AnswerComponents {
  conclusion: string;
  whatToDoNext: string[];
  steps?: string[];
  mechanics?: string[];
  edgeCases?: string[];
  assumptions?: string[];
  limitations?: string[];
}

export interface FormattedAnswer {
  depth: AnswerDepth;
  sections: Array<{
    type: 'conclusion' | 'actions' | 'steps' | 'mechanics' | 'edge_cases' | 'assumptions' | 'limitations';
    title: string;
    content: string | string[];
  }>;
}

/**
 * Format answer components based on depth preference
 * This is deterministic - no LLM involvement
 */
export function formatByDepth(
  components: AnswerComponents,
  depth: AnswerDepth
): FormattedAnswer {
  const sections: FormattedAnswer['sections'] = [];
  
  // Always include conclusion (1 line)
  sections.push({
    type: 'conclusion',
    title: 'Answer',
    content: components.conclusion,
  });
  
  // Always include what to do next (2-4 bullets)
  sections.push({
    type: 'actions',
    title: 'What to do next',
    content: components.whatToDoNext.slice(0, 4),
  });
  
  // Beginner: Only steps, no jargon
  if (depth === 'beginner' && components.steps) {
    sections.push({
      type: 'steps',
      title: 'Step by step',
      content: components.steps.map(simplifyJargon),
    });
  }
  
  // Intermediate: Include mechanics (statement close, utilization math)
  if (depth === 'intermediate' || depth === 'advanced') {
    if (components.steps) {
      sections.push({
        type: 'steps',
        title: 'Steps',
        content: components.steps,
      });
    }
    
    if (components.mechanics) {
      sections.push({
        type: 'mechanics',
        title: 'How it works',
        content: components.mechanics,
      });
    }
  }
  
  // Advanced: Add edge cases, assumptions, limitations
  if (depth === 'advanced') {
    if (components.edgeCases) {
      sections.push({
        type: 'edge_cases',
        title: 'Edge cases',
        content: components.edgeCases,
      });
    }
    
    if (components.assumptions) {
      sections.push({
        type: 'assumptions',
        title: 'Assumptions',
        content: components.assumptions,
      });
    }
    
    if (components.limitations) {
      sections.push({
        type: 'limitations',
        title: 'Limitations',
        content: components.limitations,
      });
    }
  }
  
  return {
    depth,
    sections,
  };
}

/**
 * Simplify jargon for beginner-level answers
 */
function simplifyJargon(text: string): string {
  const jargonMap: Record<string, string> = {
    'utilization ratio': 'how much of your credit limit you\'re using',
    'utilization': 'credit usage',
    'statement close': 'when your monthly statement is generated',
    'statement closing date': 'when your monthly statement is generated',
    'hard inquiry': 'credit check that can slightly lower your score',
    'soft inquiry': 'credit check that doesn\'t affect your score',
    'hard pull': 'credit check that can slightly lower your score',
    'soft pull': 'credit check that doesn\'t affect your score',
    'revolving credit': 'credit cards and similar accounts',
    'installment credit': 'loans with fixed payments like car or student loans',
    'derogatory marks': 'negative items like late payments or collections',
    'AAoA': 'average age of your accounts',
    'average age of accounts': 'how long you\'ve had your credit accounts on average',
    'credit mix': 'variety of credit types you have',
    'payment history': 'your record of paying on time',
  };
  
  let simplified = text;
  for (const [jargon, plain] of Object.entries(jargonMap)) {
    const regex = new RegExp(jargon, 'gi');
    simplified = simplified.replace(regex, plain);
  }
  
  return simplified;
}

/**
 * Get depth label for UI display
 */
export function getDepthLabel(depth: AnswerDepth): string {
  switch (depth) {
    case 'beginner': return 'Simple';
    case 'intermediate': return 'Standard';
    case 'advanced': return 'Detailed';
  }
}

/**
 * Get depth description for UI
 */
export function getDepthDescription(depth: AnswerDepth): string {
  switch (depth) {
    case 'beginner': return 'Clear steps, no jargon';
    case 'intermediate': return 'Includes how things work';
    case 'advanced': return 'Full details with edge cases';
  }
}
