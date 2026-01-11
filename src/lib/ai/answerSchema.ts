import { z } from 'zod';

// C4: Hard output schema - frontend expects consistency
export const SCHEMA_VERSION = 1;

// Calibration question types
export const CalibrationQuestionSchema = z.object({
  id: z.string(),
  prompt: z.string(),
  type: z.enum(['single_select', 'number', 'date', 'currency', 'free_text']),
  options: z.array(z.object({
    value: z.string(),
    label: z.string(),
  })).optional(),
  required: z.boolean(),
});

// Myth correction schema
export const MythCorrectionSchema = z.object({
  myth_id: z.string(),
  correction: z.string(),
  why_it_matters: z.string(),
});

// Step schema
export const StepSchema = z.object({
  title: z.string(),
  action: z.string(),
  rationale: z.string(),
});

// Mechanics schema
export const MechanicsSchema = z.object({
  title: z.string(),
  explanation: z.string(),
});

// Edge case schema
export const EdgeCaseSchema = z.object({
  title: z.string(),
  risk: z.enum(['low', 'medium', 'high']),
  detail: z.string(),
});

// Followup schema
export const FollowupSchema = z.object({
  prompt: z.string(),
  reason: z.string(),
});

// Routing metadata schema
export const RoutingSchema = z.object({
  mode: z.enum(['deterministic', 'rag', 'hybrid']),
  deterministic_topics_hit: z.array(z.string()),
  rag_chunks_count: z.number(),
  model: z.string(),
  latency_ms: z.number(),
  tokens_in: z.number(),
  tokens_out: z.number(),
  cost_usd: z.number(),
});

// Top line schema
export const TopLineSchema = z.object({
  verdict: z.string(),
  confidence: z.enum(['low', 'medium', 'high']),
  one_sentence: z.string(),
});

// Full answer schema
export const AnswerSchema = z.object({
  schema_version: z.literal(SCHEMA_VERSION),
  request_id: z.string(),
  answer_depth: z.enum(['beginner', 'intermediate', 'advanced']),
  routing: RoutingSchema,
  calibration: z.object({
    needed: z.boolean(),
    questions: z.array(CalibrationQuestionSchema),
  }),
  myth_detection: z.object({
    flags: z.array(z.string()),
    corrections: z.array(MythCorrectionSchema),
  }),
  top_line: TopLineSchema,
  steps: z.array(StepSchema),
  mechanics: z.array(MechanicsSchema),
  edge_cases: z.array(EdgeCaseSchema),
  assumptions: z.array(z.string()),
  disclaimers: z.array(z.string()),
  followups: z.array(FollowupSchema),
});

export type AnswerResponse = z.infer<typeof AnswerSchema>;
export type AnswerDepth = 'beginner' | 'intermediate' | 'advanced';
export type CalibrationQuestion = z.infer<typeof CalibrationQuestionSchema>;
export type MythCorrection = z.infer<typeof MythCorrectionSchema>;
export type Step = z.infer<typeof StepSchema>;
export type Mechanics = z.infer<typeof MechanicsSchema>;
export type EdgeCase = z.infer<typeof EdgeCaseSchema>;
export type Followup = z.infer<typeof FollowupSchema>;
export type Routing = z.infer<typeof RoutingSchema>;

// Empty response factory for calibration-needed state
export function createCalibrationNeededResponse(
  requestId: string,
  depth: AnswerDepth,
  questions: CalibrationQuestion[],
  routing: Partial<Routing>
): AnswerResponse {
  return {
    schema_version: SCHEMA_VERSION,
    request_id: requestId,
    answer_depth: depth,
    routing: {
      mode: 'deterministic',
      deterministic_topics_hit: [],
      rag_chunks_count: 0,
      model: 'none',
      latency_ms: routing.latency_ms ?? 0,
      tokens_in: 0,
      tokens_out: 0,
      cost_usd: 0,
    },
    calibration: {
      needed: true,
      questions,
    },
    myth_detection: {
      flags: [],
      corrections: [],
    },
    top_line: {
      verdict: 'Need 2-5 details to answer precisely',
      confidence: 'low',
      one_sentence: 'Please answer a few quick questions so I can give you accurate, personalized guidance.',
    },
    steps: [],
    mechanics: [],
    edge_cases: [],
    assumptions: [],
    disclaimers: [],
    followups: questions.map(q => ({
      prompt: q.prompt,
      reason: 'Required for accurate answer',
    })),
  };
}

// Empty response factory
export function createEmptyResponse(requestId: string, depth: AnswerDepth): AnswerResponse {
  return {
    schema_version: SCHEMA_VERSION,
    request_id: requestId,
    answer_depth: depth,
    routing: {
      mode: 'deterministic',
      deterministic_topics_hit: [],
      rag_chunks_count: 0,
      model: 'none',
      latency_ms: 0,
      tokens_in: 0,
      tokens_out: 0,
      cost_usd: 0,
    },
    calibration: {
      needed: false,
      questions: [],
    },
    myth_detection: {
      flags: [],
      corrections: [],
    },
    top_line: {
      verdict: '',
      confidence: 'medium',
      one_sentence: '',
    },
    steps: [],
    mechanics: [],
    edge_cases: [],
    assumptions: [],
    disclaimers: [],
    followups: [],
  };
}
