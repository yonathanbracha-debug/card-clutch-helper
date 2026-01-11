/**
 * Ask AI Response Schema - Hard Output Schema
 * SECURITY SPRINT 2026-01-11
 * 
 * All /ask-credit-question responses MUST conform to this schema.
 * Invalid responses fall back to deterministic safe response.
 */
import { z } from 'zod';

// ============================================
// ENUM TYPES
// ============================================

export const RouteTypeSchema = z.enum(['deterministic', 'rag', 'hybrid', 'error']);
export type RouteType = z.infer<typeof RouteTypeSchema>;

export const ConfidenceLevelSchema = z.enum(['low', 'medium', 'high']);
export type ConfidenceLevel = z.infer<typeof ConfidenceLevelSchema>;

export const ScoreImpactTypeSchema = z.enum(['help', 'neutral', 'hurt', 'unknown']);
export type ScoreImpactType = z.infer<typeof ScoreImpactTypeSchema>;

// ============================================
// SUB-SCHEMAS
// ============================================

export const AnswerBlockSchema = z.object({
  tl_dr: z.string().min(1).max(500),
  short: z.string().min(1).max(2000),
  detailed: z.string().max(10000),
  action_items: z.array(z.string().max(500)),
  pitfalls: z.array(z.string().max(500)),
});
export type AnswerBlock = z.infer<typeof AnswerBlockSchema>;

export const ConfidenceBlockSchema = z.object({
  score: z.number().min(0).max(1),
  level: ConfidenceLevelSchema,
  rationale: z.array(z.string().max(300)),
});
export type ConfidenceBlock = z.infer<typeof ConfidenceBlockSchema>;

export const MythBlockSchema = z.object({
  is_myth: z.boolean(),
  myth_label: z.string().nullable(),
  correction: z.string().nullable(),
});
export type MythBlock = z.infer<typeof MythBlockSchema>;

export const ScoreImpactBlockSchema = z.object({
  short_term: ScoreImpactTypeSchema,
  long_term: ScoreImpactTypeSchema,
  notes: z.string().max(500),
});
export type ScoreImpactBlock = z.infer<typeof ScoreImpactBlockSchema>;

export const CitationSchema = z.object({
  title: z.string().min(1).max(300),
  url: z.string().nullable(),
  snippet: z.string().max(500),
});
export type Citation = z.infer<typeof CitationSchema>;

export const RateLimitInfoSchema = z.object({
  limit: z.number().int().nonnegative(),
  remaining: z.number().int().nonnegative(),
  reset_unix: z.number().int().nonnegative(),
});
export type RateLimitInfo = z.infer<typeof RateLimitInfoSchema>;

export const MetricsBlockSchema = z.object({
  latency_ms: z.number().nullable(),
  model: z.string().nullable(),
  prompt_tokens: z.number().int().nullable(),
  completion_tokens: z.number().int().nullable(),
  total_tokens: z.number().int().nullable(),
  estimated_cost_usd: z.number().nullable(),
  rate_limit: z.object({
    user: RateLimitInfoSchema.nullable(),
    ip: RateLimitInfoSchema,
  }),
});
export type MetricsBlock = z.infer<typeof MetricsBlockSchema>;

export const ErrorBlockSchema = z.object({
  code: z.string().min(1).max(50),
  message: z.string().min(1).max(500),
});
export type ErrorBlock = z.infer<typeof ErrorBlockSchema>;

// ============================================
// MAIN SCHEMA
// ============================================

export const AskAiResponseSchema = z.object({
  version: z.literal('v1'),
  request_id: z.string().min(1),
  route: RouteTypeSchema,
  answer: AnswerBlockSchema,
  confidence: ConfidenceBlockSchema,
  myth: MythBlockSchema,
  score_impact: ScoreImpactBlockSchema,
  citations: z.array(CitationSchema),
  metrics: MetricsBlockSchema,
  error: ErrorBlockSchema.nullable(),
});

export type AskAiResponse = z.infer<typeof AskAiResponseSchema>;

// ============================================
// VALIDATION HELPERS
// ============================================

/**
 * Validate a response against AskAiResponseSchema
 */
export function validateAskAiResponse(obj: unknown): 
  | { success: true; data: AskAiResponse }
  | { success: false; error: z.ZodError } {
  return AskAiResponseSchema.safeParse(obj);
}

/**
 * Create a deterministic fallback response when validation fails or an error occurs.
 * This ensures we NEVER return non-conforming payloads.
 */
export function createFallbackResponse(
  requestId: string,
  errorMessage: string = 'Unable to process request',
  errorCode: string = 'INTERNAL_ERROR',
  ipRateLimit: RateLimitInfo = { limit: 30, remaining: 29, reset_unix: Math.floor(Date.now() / 1000) + 60 },
  userRateLimit: RateLimitInfo | null = null,
): AskAiResponse {
  return {
    version: 'v1',
    request_id: requestId,
    route: 'error',
    answer: {
      tl_dr: 'I was unable to answer your question at this time.',
      short: 'There was an issue processing your request. Please try again or rephrase your question.',
      detailed: '',
      action_items: ['Try rephrasing your question', 'Ask about a specific credit topic'],
      pitfalls: [],
    },
    confidence: {
      score: 0,
      level: 'low',
      rationale: ['Unable to generate confident answer'],
    },
    myth: {
      is_myth: false,
      myth_label: null,
      correction: null,
    },
    score_impact: {
      short_term: 'unknown',
      long_term: 'unknown',
      notes: '',
    },
    citations: [],
    metrics: {
      latency_ms: null,
      model: null,
      prompt_tokens: null,
      completion_tokens: null,
      total_tokens: null,
      estimated_cost_usd: null,
      rate_limit: {
        user: userRateLimit,
        ip: ipRateLimit,
      },
    },
    error: {
      code: errorCode,
      message: errorMessage,
    },
  };
}

/**
 * Create a rate limit error response
 */
export function createRateLimitResponse(
  requestId: string,
  retryAfterSeconds: number,
  ipLimit: RateLimitInfo,
  userLimit: RateLimitInfo | null = null,
  limitType: 'ip' | 'user' = 'ip',
): AskAiResponse {
  const limitName = limitType === 'ip' ? 'IP address' : 'user account';
  return {
    version: 'v1',
    request_id: requestId,
    route: 'error',
    answer: {
      tl_dr: `Rate limit exceeded. Please wait ${retryAfterSeconds} seconds.`,
      short: `You've made too many requests from this ${limitName}. Please wait before asking another question.`,
      detailed: '',
      action_items: [`Wait ${retryAfterSeconds} seconds before trying again`],
      pitfalls: [],
    },
    confidence: {
      score: 1,
      level: 'high',
      rationale: ['Rate limit is a deterministic check'],
    },
    myth: {
      is_myth: false,
      myth_label: null,
      correction: null,
    },
    score_impact: {
      short_term: 'neutral',
      long_term: 'neutral',
      notes: '',
    },
    citations: [],
    metrics: {
      latency_ms: null,
      model: null,
      prompt_tokens: null,
      completion_tokens: null,
      total_tokens: null,
      estimated_cost_usd: null,
      rate_limit: {
        user: userLimit,
        ip: ipLimit,
      },
    },
    error: {
      code: 'RATE_LIMITED',
      message: `Rate limit exceeded. Retry after ${retryAfterSeconds} seconds.`,
    },
  };
}

/**
 * Create a successful response from deterministic content
 */
export function createDeterministicResponse(
  requestId: string,
  content: {
    answer: string;
    confidence: number;
    scoreImpact?: 'none' | 'temporary' | 'long_term' | 'unknown';
    isMyth?: boolean;
    mythLabel?: string;
    mythCorrection?: string;
  },
  latencyMs: number,
  ipLimit: RateLimitInfo,
  userLimit: RateLimitInfo | null = null,
): AskAiResponse {
  // Parse answer into sections (basic split on double newlines)
  const sections = content.answer.split('\n\n');
  const tlDr = sections[0]?.replace(/^\*\*[^*]+\*\*\s*/, '').substring(0, 500) || content.answer.substring(0, 500);
  
  // Map score impact
  const scoreImpactMap: Record<string, ScoreImpactType> = {
    'none': 'neutral',
    'temporary': 'hurt',
    'long_term': 'hurt',
    'unknown': 'unknown',
  };
  
  return {
    version: 'v1',
    request_id: requestId,
    route: 'deterministic',
    answer: {
      tl_dr: tlDr,
      short: content.answer.substring(0, 2000),
      detailed: content.answer,
      action_items: [],
      pitfalls: [],
    },
    confidence: {
      score: content.confidence,
      level: content.confidence >= 0.85 ? 'high' : content.confidence >= 0.6 ? 'medium' : 'low',
      rationale: ['Answered from verified credit knowledge base'],
    },
    myth: {
      is_myth: content.isMyth || false,
      myth_label: content.mythLabel || null,
      correction: content.mythCorrection || null,
    },
    score_impact: {
      short_term: scoreImpactMap[content.scoreImpact || 'unknown'] || 'unknown',
      long_term: scoreImpactMap[content.scoreImpact || 'unknown'] || 'unknown',
      notes: '',
    },
    citations: [],
    metrics: {
      latency_ms: latencyMs,
      model: 'deterministic_rules',
      prompt_tokens: null,
      completion_tokens: null,
      total_tokens: null,
      estimated_cost_usd: 0,
      rate_limit: {
        user: userLimit,
        ip: ipLimit,
      },
    },
    error: null,
  };
}

// ============================================
// TYPE GUARDS
// ============================================

export function isValidRoute(route: string): route is RouteType {
  return ['deterministic', 'rag', 'hybrid', 'error'].includes(route);
}

export function isValidConfidenceLevel(level: string): level is ConfidenceLevel {
  return ['low', 'medium', 'high'].includes(level);
}
