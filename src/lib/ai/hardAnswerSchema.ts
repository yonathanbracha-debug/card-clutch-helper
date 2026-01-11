/**
 * Hard Answer Schema - Section 2
 * Non-negotiable JSON schema for all AI responses
 * Frontend renders strictly in this order
 */
import { z } from 'zod';

export const HARD_SCHEMA_VERSION = 2;

// Confidence levels
export const ConfidenceLevelSchema = z.enum(['high', 'medium', 'low']);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

// Question types for classification
export const QuestionTypeSchema = z.enum(['myth', 'procedure', 'optimization', 'risk', 'education']);
export type QuestionType = z.infer<typeof QuestionTypeSchema>;

// The hard answer schema - Section 2
export const HardAnswerSchema = z.object({
  summary: z.string().describe('Main answer, 1-2 sentences'),
  recommended_action: z.string().nullable().describe('What to do next'),
  steps: z.array(z.string()).describe('Ordered action steps'),
  mechanics: z.string().nullable().describe('How it works (intermediate+)'),
  edge_cases: z.array(z.string()).nullable().describe('Exceptions (advanced only)'),
  warnings: z.array(z.string()).nullable().describe('Critical warnings'),
  confidence: ConfidenceLevelSchema,
  blocked: z.boolean().describe('Whether this action is blocked by credit_state'),
  block_reason: z.string().nullable().describe('Why blocked'),
});

export type HardAnswer = z.infer<typeof HardAnswerSchema>;

// Error response
export const ErrorResponseSchema = z.object({
  error: z.literal('INVALID_OUTPUT_SCHEMA'),
});

// Depth-specific field rules - Section 3
export interface DepthRules {
  summary: { maxSentences: number };
  recommended_action: boolean;
  steps: { max: number };
  mechanics: boolean;
  edge_cases: boolean;
  warnings: 'severe_only' | 'allowed' | 'required';
  tone: string;
}

export const DEPTH_RULES: Record<'beginner' | 'intermediate' | 'advanced', DepthRules> = {
  beginner: {
    summary: { maxSentences: 2 },
    recommended_action: true,
    steps: { max: 3 },
    mechanics: false,
    edge_cases: false,
    warnings: 'severe_only',
    tone: 'instructional, concrete',
  },
  intermediate: {
    summary: { maxSentences: 3 },
    recommended_action: true,
    steps: { max: 6 },
    mechanics: true,
    edge_cases: false, // optional, max 2
    warnings: 'allowed',
    tone: 'explanatory',
  },
  advanced: {
    summary: { maxSentences: 4 },
    recommended_action: true,
    steps: { max: 10 },
    mechanics: true,
    edge_cases: true,
    warnings: 'required',
    tone: 'comprehensive, includes limitations',
  },
};

// Mandatory myth list - Section 4
export const MANDATORY_MYTHS = [
  '0% utilization is best',
  'Paying early hurts score',
  'More cards always help',
  'Closing cards is neutral',
  'Carrying balance builds credit',
  'BNPL is harmless',
  'Minimum payment avoids interest impact',
] as const;

// Apply depth rules to an answer
export function applyDepthRules(
  answer: Partial<HardAnswer>,
  depth: 'beginner' | 'intermediate' | 'advanced'
): HardAnswer {
  const rules = DEPTH_RULES[depth];
  
  return {
    summary: answer.summary || '',
    recommended_action: rules.recommended_action ? (answer.recommended_action || null) : null,
    steps: (answer.steps || []).slice(0, rules.steps.max),
    mechanics: rules.mechanics ? (answer.mechanics || null) : null,
    edge_cases: rules.edge_cases ? (answer.edge_cases || null) : null,
    warnings: answer.warnings || null,
    confidence: answer.confidence || 'medium',
    blocked: answer.blocked || false,
    block_reason: answer.block_reason || null,
  };
}

// Create a blocked response - Section 6
export function createBlockedResponse(
  reason: string,
  unlockConditions: string[]
): HardAnswer {
  return {
    summary: 'This recommendation is blocked based on your credit profile.',
    recommended_action: null,
    steps: unlockConditions.map(c => `To unlock: ${c}`),
    mechanics: null,
    edge_cases: null,
    warnings: [reason],
    confidence: 'high',
    blocked: true,
    block_reason: reason,
  };
}

// Create a calibration response - Section 5
export function createCalibrationResponse(question: string): HardAnswer {
  return {
    summary: 'I need one detail before answering.',
    recommended_action: null,
    steps: [question],
    mechanics: null,
    edge_cases: null,
    warnings: null,
    confidence: 'low',
    blocked: false,
    block_reason: null,
  };
}

// Validate answer matches schema
export function validateHardAnswer(obj: unknown): { success: boolean; data?: HardAnswer; error?: string } {
  const result = HardAnswerSchema.safeParse(obj);
  if (result.success) {
    return { success: true, data: result.data };
  }
  return { success: false, error: result.error.message };
}
