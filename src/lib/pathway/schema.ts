/**
 * Pathway Output Schema - Hard Contract
 * All pathway engine outputs MUST pass this schema
 */

import { z } from 'zod';

// Schema version for future migrations
export const PATHWAY_SCHEMA_VERSION = 1;

// Credit stages
export const CreditStageSchema = z.enum([
  'foundation',
  'build', 
  'optimize',
  'scale',
  'elite'
]);

// Priority levels for next moves
export const PrioritySchema = z.enum(['now', 'soon', 'later']);

// Confidence levels for card recommendations
export const CardConfidenceSchema = z.enum(['low', 'medium', 'high']);

// Next move schema
export const NextMoveSchema = z.object({
  action: z.string().min(8),
  condition: z.string().min(6),
  rationale: z.string().min(12),
  priority: PrioritySchema,
});

// Recommended card schema
export const RecommendedCardSchema = z.object({
  name: z.string(),
  reason: z.string(),
  timing: z.string(),
  confidence: CardConfidenceSchema,
});

// Timeline milestone schema
export const TimelineMilestoneSchema = z.object({
  title: z.string(),
  when: z.string(), // e.g., "in 30 days", "after 3 statements"
  success_metric: z.string(),
});

// Main pathway output schema
export const PathwayOutputSchema = z.object({
  credit_stage: CreditStageSchema,
  stage_confidence: z.number().min(0).max(100),
  stage_reasons: z.array(z.string()).min(1),
  
  immediate_focus: z.array(z.string()).min(2).max(5),
  
  next_moves: z.array(NextMoveSchema).min(2).max(6),
  
  do_nots: z.array(z.string()).min(2).max(6),
  
  recommended_cards: z.array(RecommendedCardSchema).max(5),
  
  timeline: z.array(TimelineMilestoneSchema).min(3).max(8),
  
  next_review_date: z.string(), // ISO date
  
  behavior_rules: z.array(z.string()).min(2).max(8),
});

// Type inference
export type CreditStage = z.infer<typeof CreditStageSchema>;
export type Priority = z.infer<typeof PrioritySchema>;
export type CardConfidence = z.infer<typeof CardConfidenceSchema>;
export type NextMove = z.infer<typeof NextMoveSchema>;
export type RecommendedCard = z.infer<typeof RecommendedCardSchema>;
export type TimelineMilestone = z.infer<typeof TimelineMilestoneSchema>;
export type PathwayOutput = z.infer<typeof PathwayOutputSchema>;

/**
 * Validate pathway output against schema
 * Throws if invalid - this is intentional for contract enforcement
 */
export function validatePathwayOutput(output: unknown): PathwayOutput {
  const result = PathwayOutputSchema.safeParse(output);
  
  if (!result.success) {
    console.error('Pathway output validation failed:', result.error.errors);
    throw new Error(`Pathway output validation failed: ${result.error.errors.map(e => e.message).join(', ')}`);
  }
  
  return result.data;
}

/**
 * Safe validation that returns null instead of throwing
 */
export function safeValidatePathwayOutput(output: unknown): PathwayOutput | null {
  const result = PathwayOutputSchema.safeParse(output);
  return result.success ? result.data : null;
}

// Stage display names
export const STAGE_DISPLAY_NAMES: Record<CreditStage, string> = {
  foundation: 'Foundation',
  build: 'Build',
  optimize: 'Optimize',
  scale: 'Scale',
  elite: 'Elite',
};

// Stage descriptions
export const STAGE_DESCRIPTIONS: Record<CreditStage, string> = {
  foundation: 'Establishing your credit foundation with your first card',
  build: 'Building credit history and responsible usage patterns',
  optimize: 'Maximizing rewards with strategic card selection',
  scale: 'Expanding your portfolio for advanced optimization',
  elite: 'Premium strategies for experienced credit users',
};
