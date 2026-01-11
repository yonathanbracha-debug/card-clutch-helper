/**
 * AskAnswer Schema - Hard Output Schema for AI Answers
 * Spec: SECURITY SPRINT 2026-01-11
 * 
 * All AI responses MUST conform to this schema.
 * Invalid responses fall back to deterministic safe response.
 */
import { z } from 'zod';

// ============================================
// ENUM TYPES
// ============================================

export const AnswerIntentSchema = z.enum(['beginner', 'intermediate', 'advanced']);
export type AnswerIntent = z.infer<typeof AnswerIntentSchema>;

export const ConfidenceLevelSchema = z.enum(['low', 'medium', 'high']);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

export const RoutingTypeSchema = z.enum(['rules', 'rag', 'hybrid', 'fallback']);
export type RoutingType = z.infer<typeof RoutingTypeSchema>;

// ============================================
// SUB-SCHEMAS
// ============================================

export const StepSchema = z.object({
  title: z.string().min(1).max(200),
  detail: z.string().min(1).max(1000),
});
export type Step = z.infer<typeof StepSchema>;

export const CitationSchema = z.object({
  title: z.string().min(1).max(300),
  url: z.string().url().optional(),
});
export type Citation = z.infer<typeof CitationSchema>;

export const MetaSchema = z.object({
  is_myth: z.boolean(),
  myth_label: z.string().optional(),
  routing: RoutingTypeSchema,
  cost_usd: z.number().nonnegative().optional(),
  tokens_in: z.number().int().nonnegative().optional(),
  tokens_out: z.number().int().nonnegative().optional(),
  retrieved_chunks: z.number().int().nonnegative().optional(),
  request_id: z.string().min(1),
});
export type Meta = z.infer<typeof MetaSchema>;

// ============================================
// MAIN SCHEMA
// ============================================

export const AskAnswerSchema = z.object({
  version: z.literal('v1'),
  topic: z.string().min(1).max(100),
  intent: AnswerIntentSchema,
  answer_top: z.string().min(1).max(1000),
  why: z.array(z.string().max(500)),
  steps: z.array(StepSchema),
  edge_cases: z.array(z.string().max(500)).optional(),
  assumptions: z.array(z.string().max(500)).optional(),
  confidence: ConfidenceLevelSchema,
  ask_back: z.array(z.string().max(300)).optional(),
  citations: z.array(CitationSchema).optional(),
  meta: MetaSchema,
});

export type AskAnswer = z.infer<typeof AskAnswerSchema>;

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate an object against AskAnswerSchema
 * Returns { success: true, data } or { success: false, error }
 */
export function validateAskAnswer(obj: unknown): 
  | { success: true; data: AskAnswer }
  | { success: false; error: z.ZodError } {
  const result = AskAnswerSchema.safeParse(obj);
  return result;
}

/**
 * Create a deterministic fallback response when validation fails
 * This ensures we NEVER return non-conforming payloads
 */
export function createFallbackAnswer(
  question: string,
  requestId: string,
  intent: AnswerIntent = 'beginner'
): AskAnswer {
  return {
    version: 'v1',
    topic: 'unknown',
    intent,
    answer_top: 'I wasn\'t able to provide a complete answer to your question. This may be due to the complexity of the topic or a temporary issue. Please try rephrasing your question or ask something more specific.',
    why: [],
    steps: [
      {
        title: 'Try a more specific question',
        detail: 'Questions about specific credit topics like utilization, payment timing, or credit scores tend to get better answers.',
      },
    ],
    edge_cases: undefined,
    assumptions: undefined,
    confidence: 'low',
    ask_back: ['Would you like to ask about credit utilization?', 'Do you have questions about payment timing?'],
    citations: undefined,
    meta: {
      is_myth: false,
      routing: 'fallback',
      request_id: requestId,
    },
  };
}

// ============================================
// PROMPT TEMPLATE FOR AI
// ============================================

/**
 * System prompt instructions for AI to return schema-compliant JSON
 */
export const SCHEMA_PROMPT_INSTRUCTIONS = `
You MUST respond with valid JSON matching this exact schema:

{
  "version": "v1",
  "topic": "<credit topic or 'mixed' or 'unknown'>",
  "intent": "<beginner|intermediate|advanced>",
  "answer_top": "<1-3 sentences, direct answer>",
  "why": ["<bullet 1>", "<bullet 2>", ...],
  "steps": [{"title": "<step title>", "detail": "<step detail>"}, ...],
  "edge_cases": ["<optional edge case>", ...],
  "assumptions": ["<optional assumption>", ...],
  "confidence": "<low|medium|high>",
  "ask_back": ["<optional follow-up question>", ...],
  "citations": [{"title": "<source title>", "url": "<optional url>"}],
  "meta": {
    "is_myth": <true|false>,
    "myth_label": "<optional myth description if is_myth=true>",
    "routing": "<rules|rag|hybrid|fallback>",
    "request_id": "<will be provided>"
  }
}

RULES:
- answer_top: Maximum 3 sentences, get to the point immediately
- why: Array of bullet points explaining the reasoning (can be empty [])
- steps: Ordered action items (can be empty [])
- confidence: "high" for universal rules, "medium" for context-dependent, "low" for uncertain
- Always include version: "v1" exactly
- If you detect a common credit myth, set is_myth: true and provide myth_label
`;

// ============================================
// TYPE GUARDS
// ============================================

export function isValidConfidenceLevel(level: string): level is ConfidenceLevel {
  return ['low', 'medium', 'high'].includes(level);
}

export function isValidRoutingType(routing: string): routing is RoutingType {
  return ['rules', 'rag', 'hybrid', 'fallback'].includes(routing);
}

export function isValidIntent(intent: string): intent is AnswerIntent {
  return ['beginner', 'intermediate', 'advanced'].includes(intent);
}
