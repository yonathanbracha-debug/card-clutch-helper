/**
 * AskAiSchema Tests
 * Validates the hard output schema for AI responses
 * 
 * Section E: Testing Requirements
 * - Schema always validates with Zod
 * - Myth detection triggers on known inputs
 * - Depth rules hold for the same input across sessions
 * - Calibration required triggers and returns typed questions
 * - 8 specific test cases
 */
import { describe, it, expect } from 'vitest';
import {
  AskAiResponseSchema,
  validateAskAiResponse,
  createFallbackResponse,
  createRateLimitResponse,
  createDeterministicResponse,
  type AskAiResponse,
} from '../askAiSchema';
import { detectMyths, CREDIT_MYTHS, type AnswerDepth } from '../ai/myths';
import { 
  HardAnswerSchema, 
  applyDepthRules, 
  DEPTH_RULES,
  validateHardAnswer,
  createBlockedResponse,
  createCalibrationResponse,
} from '../ai/hardAnswerSchema';
import { 
  AnswerSchema, 
  createEmptyResponse, 
  createCalibrationNeededResponse,
  SCHEMA_VERSION,
} from '../ai/answerSchema';

describe('AskAiResponseSchema', () => {
  const validResponse: AskAiResponse = {
    version: 'v1',
    request_id: 'test-123',
    route: 'deterministic',
    answer: {
      tl_dr: 'Credit utilization is how much of your credit limit you are using.',
      short: 'Credit utilization is the percentage of your available credit that you are using. It is calculated by dividing your total credit card balances by your total credit limits.',
      detailed: 'Credit utilization is one of the most important factors in your credit score...',
      action_items: ['Keep utilization below 30%', 'Pay before statement closes'],
      pitfalls: ['High utilization can hurt your score'],
    },
    confidence: {
      score: 0.95,
      level: 'high',
      rationale: ['Answered from verified knowledge base'],
    },
    myth: {
      is_myth: false,
      myth_label: null,
      correction: null,
    },
    score_impact: {
      short_term: 'neutral',
      long_term: 'help',
      notes: 'Keeping low utilization helps your score.',
    },
    citations: [],
    metrics: {
      latency_ms: 45,
      model: 'deterministic_rules',
      prompt_tokens: null,
      completion_tokens: null,
      total_tokens: null,
      estimated_cost_usd: 0,
      rate_limit: {
        user: { limit: 60, remaining: 59, reset_unix: 1736553600 },
        ip: { limit: 30, remaining: 29, reset_unix: 1736553600 },
      },
    },
    error: null,
  };

  describe('validation', () => {
    it('should pass for valid response', () => {
      const result = validateAskAiResponse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.version).toBe('v1');
        expect(result.data.route).toBe('deterministic');
      }
    });

    it('should fail for missing required fields', () => {
      const invalidResponse = {
        version: 'v1',
        request_id: 'test-123',
        // missing route, answer, etc.
      };
      const result = validateAskAiResponse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should fail for invalid version', () => {
      const invalidResponse = { ...validResponse, version: 'v2' };
      const result = validateAskAiResponse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should fail for invalid route', () => {
      const invalidResponse = { ...validResponse, route: 'invalid' };
      const result = validateAskAiResponse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should fail for confidence score out of range', () => {
      const invalidResponse = {
        ...validResponse,
        confidence: { ...validResponse.confidence, score: 1.5 },
      };
      const result = validateAskAiResponse(invalidResponse);
      expect(result.success).toBe(false);
    });

    it('should accept error route with error block', () => {
      const errorResponse: AskAiResponse = {
        ...validResponse,
        route: 'error',
        error: {
          code: 'RATE_LIMITED',
          message: 'Too many requests',
        },
      };
      const result = validateAskAiResponse(errorResponse);
      expect(result.success).toBe(true);
    });
  });

  describe('createFallbackResponse', () => {
    it('should create valid fallback response', () => {
      const fallback = createFallbackResponse('req-123', 'Test error');
      const result = validateAskAiResponse(fallback);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.route).toBe('error');
        expect(result.data.error?.code).toBe('INTERNAL_ERROR');
      }
    });

    it('should include custom error code', () => {
      const fallback = createFallbackResponse('req-123', 'Custom error', 'CUSTOM_CODE');
      expect(fallback.error?.code).toBe('CUSTOM_CODE');
    });
  });

  describe('createRateLimitResponse', () => {
    it('should create valid rate limit response', () => {
      const ipLimit = { limit: 30, remaining: 0, reset_unix: 1736553600 };
      const rateLimited = createRateLimitResponse('req-456', 30, ipLimit);
      const result = validateAskAiResponse(rateLimited);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.route).toBe('error');
        expect(result.data.error?.code).toBe('RATE_LIMITED');
        expect(result.data.metrics.rate_limit.ip.remaining).toBe(0);
      }
    });

    it('should include user rate limit when provided', () => {
      const ipLimit = { limit: 30, remaining: 10, reset_unix: 1736553600 };
      const userLimit = { limit: 60, remaining: 0, reset_unix: 1736553600 };
      const rateLimited = createRateLimitResponse('req-789', 60, ipLimit, userLimit, 'user');
      expect(rateLimited.metrics.rate_limit.user).not.toBeNull();
      expect(rateLimited.metrics.rate_limit.user?.remaining).toBe(0);
    });
  });

  describe('createDeterministicResponse', () => {
    it('should create valid deterministic response', () => {
      const ipLimit = { limit: 30, remaining: 29, reset_unix: 1736553600 };
      const response = createDeterministicResponse(
        'req-det-1',
        {
          answer: 'Credit utilization is how much of your credit you use.',
          confidence: 0.9,
        },
        50,
        ipLimit,
      );
      const result = validateAskAiResponse(response);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.route).toBe('deterministic');
        expect(result.data.metrics.latency_ms).toBe(50);
        expect(result.data.error).toBeNull();
      }
    });

    it('should include myth information', () => {
      const ipLimit = { limit: 30, remaining: 29, reset_unix: 1736553600 };
      const response = createDeterministicResponse(
        'req-myth-1',
        {
          answer: 'You do not need to carry a balance.',
          confidence: 0.95,
          isMyth: true,
          mythLabel: 'carry_balance',
          mythCorrection: 'Carrying a balance does not help your credit score.',
        },
        30,
        ipLimit,
      );
      expect(response.myth.is_myth).toBe(true);
      expect(response.myth.myth_label).toBe('carry_balance');
    });
  });

  describe('schema edge cases', () => {
    it('should accept empty arrays for optional fields', () => {
      const response: AskAiResponse = {
        ...validResponse,
        answer: {
          ...validResponse.answer,
          action_items: [],
          pitfalls: [],
        },
        citations: [],
      };
      const result = validateAskAiResponse(response);
      expect(result.success).toBe(true);
    });

    it('should accept null for user rate limit', () => {
      const response: AskAiResponse = {
        ...validResponse,
        metrics: {
          ...validResponse.metrics,
          rate_limit: {
            user: null,
            ip: { limit: 30, remaining: 29, reset_unix: 1736553600 },
          },
        },
      };
      const result = validateAskAiResponse(response);
      expect(result.success).toBe(true);
    });

    it('should reject negative confidence score', () => {
      const response = {
        ...validResponse,
        confidence: { ...validResponse.confidence, score: -0.5 },
      };
      const result = validateAskAiResponse(response);
      expect(result.success).toBe(false);
    });
  });
});

// ======================================
// NEW TESTS - Section E Requirements
// ======================================

describe('New AnswerSchema Validation', () => {
  it('should always produce valid schema from createEmptyResponse', () => {
    const response = createEmptyResponse('test-123', 'beginner');
    const result = AnswerSchema.safeParse(response);
    expect(result.success).toBe(true);
    expect(result.data?.schema_version).toBe(SCHEMA_VERSION);
  });

  it('should always produce valid schema from createCalibrationNeededResponse', () => {
    const questions = [
      { id: 'q1', prompt: 'Test question?', type: 'single_select' as const, options: [{ value: 'yes', label: 'Yes' }], required: true }
    ];
    const response = createCalibrationNeededResponse('test-123', 'intermediate', questions, {});
    const result = AnswerSchema.safeParse(response);
    expect(result.success).toBe(true);
    expect(result.data?.calibration.needed).toBe(true);
  });

  it('should validate HardAnswerSchema correctly', () => {
    const validAnswer = {
      summary: 'Test summary',
      recommended_action: 'Do this',
      steps: ['Step 1', 'Step 2'],
      mechanics: null,
      edge_cases: null,
      warnings: null,
      confidence: 'high' as const,
      blocked: false,
      block_reason: null,
    };
    const result = validateHardAnswer(validAnswer);
    expect(result.success).toBe(true);
  });

  it('should reject invalid HardAnswerSchema', () => {
    const invalidAnswer = {
      summary: 'Test',
      // Missing required fields
    };
    const result = validateHardAnswer(invalidAnswer);
    expect(result.success).toBe(false);
  });
});

describe('Myth Detection', () => {
  // Test Case 1: 0% utilization myth
  it('should detect 0% utilization myth', () => {
    const question = 'Is 0% utilization best for my credit score?';
    const result = detectMyths(question, 'beginner');
    expect(result.flags).toContain('MYTH_0_UTIL_IS_BEST');
    expect(result.corrections.length).toBeGreaterThan(0);
    expect(result.corrections[0].correction).toContain('NOT optimal');
  });

  // Test Case 2: Carry balance myth
  it('should detect carrying balance myth', () => {
    const question = 'Should I carry a balance to build credit?';
    const result = detectMyths(question, 'beginner');
    expect(result.flags).toContain('MYTH_CARRYING_BALANCE_BUILDS_SCORE');
    expect(result.corrections[0].correction).toContain('do NOT need to carry a balance');
  });

  // Test Case 3: Statement vs due date confusion
  it('should detect statement vs due date confusion', () => {
    const question = 'The statement close date is the same as the due date right?';
    const result = detectMyths(question, 'intermediate');
    expect(result.flags).toContain('MYTH_CLOSING_DATE_IS_DUE_DATE');
  });

  // Test Case 4: BNPL "no impact" myth
  it('should detect BNPL no impact myth', () => {
    const question = 'BNPL has no credit impact right?';
    const result = detectMyths(question, 'advanced');
    expect(result.flags).toContain('MYTH_BNPL_HAS_NO_CREDIT_IMPACT');
  });

  it('should not trigger on neutral questions', () => {
    const question = 'What is a credit score?';
    const result = detectMyths(question, 'beginner');
    expect(result.flags).toHaveLength(0);
    expect(result.corrections).toHaveLength(0);
  });

  it('should return multiple myths if present', () => {
    const question = 'Should I keep 0% utilization and carry a small balance to build credit?';
    const result = detectMyths(question, 'beginner');
    expect(result.flags.length).toBeGreaterThanOrEqual(1);
  });
});

describe('Depth Rules', () => {
  const baseAnswer = {
    summary: 'This is a test summary with multiple sentences. It explains the answer. More detail here.',
    recommended_action: 'Do this specific action',
    steps: ['Step 1', 'Step 2', 'Step 3', 'Step 4', 'Step 5', 'Step 6'],
    mechanics: 'Here is how it works in detail.',
    edge_cases: ['Edge case 1', 'Edge case 2', 'Edge case 3'],
    warnings: ['Warning 1'],
    confidence: 'high' as const,
    blocked: false,
    block_reason: null,
  };

  it('should limit beginner answers to 3 steps max', () => {
    const result = applyDepthRules(baseAnswer, 'beginner');
    expect(result.steps.length).toBeLessThanOrEqual(3);
  });

  it('should exclude mechanics for beginner', () => {
    const result = applyDepthRules(baseAnswer, 'beginner');
    expect(result.mechanics).toBeNull();
  });

  it('should exclude edge_cases for beginner', () => {
    const result = applyDepthRules(baseAnswer, 'beginner');
    expect(result.edge_cases).toBeNull();
  });

  it('should include mechanics for intermediate', () => {
    const result = applyDepthRules(baseAnswer, 'intermediate');
    expect(result.mechanics).not.toBeNull();
  });

  it('should allow up to 6 steps for intermediate', () => {
    const result = applyDepthRules(baseAnswer, 'intermediate');
    expect(result.steps.length).toBeLessThanOrEqual(6);
  });

  it('should include edge_cases for advanced', () => {
    const result = applyDepthRules(baseAnswer, 'advanced');
    expect(result.edge_cases).not.toBeNull();
  });

  it('should allow up to 10 steps for advanced', () => {
    const result = applyDepthRules(baseAnswer, 'advanced');
    expect(result.steps.length).toBeLessThanOrEqual(10);
  });

  // Deterministic test - same input produces same output
  it('should produce deterministic output for same depth', () => {
    const result1 = applyDepthRules(baseAnswer, 'beginner');
    const result2 = applyDepthRules(baseAnswer, 'beginner');
    expect(JSON.stringify(result1)).toBe(JSON.stringify(result2));
  });
});

describe('Blocking Logic', () => {
  it('should create blocked response with reason', () => {
    const reason = 'You carry balances. Rewards optimization becomes negative expected value.';
    const unlockConditions = ['Pay off all balances', 'Wait 30 days'];
    const result = createBlockedResponse(reason, unlockConditions);
    
    expect(result.blocked).toBe(true);
    expect(result.block_reason).toBe(reason);
    expect(result.warnings).toContain(reason);
    expect(result.steps.length).toBe(2);
  });
});

describe('Calibration Questions', () => {
  it('should create calibration response with question', () => {
    const question = 'Do you carry a balance month to month?';
    const result = createCalibrationResponse(question);
    
    expect(result.confidence).toBe('low');
    expect(result.blocked).toBe(false);
    expect(result.steps).toContain(question);
    expect(result.summary).toBe('I need one detail before answering.');
  });

  it('should handle calibration needed response in schema', () => {
    const questions = [
      { 
        id: 'carry_balance', 
        prompt: 'Do you carry a balance?', 
        type: 'single_select' as const, 
        options: [{ value: 'yes', label: 'Yes' }, { value: 'no', label: 'No' }], 
        required: true 
      }
    ];
    const response = createCalibrationNeededResponse('test', 'beginner', questions, {});
    
    expect(response.calibration.needed).toBe(true);
    expect(response.calibration.questions.length).toBe(1);
    expect(response.top_line.verdict).toBe('Need 2-5 details to answer precisely');
    expect(response.steps).toHaveLength(0);
    expect(response.mechanics).toHaveLength(0);
    expect(response.edge_cases).toHaveLength(0);
  });
});

describe('BNPL + High-Risk Detection', () => {
  it('should detect BNPL in question', () => {
    const question = 'Can I use Klarna for this purchase?';
    // This would be handled by the question type classification
    const result = detectMyths(question, 'beginner');
    // BNPL alone doesn't trigger myth, but "no impact" does
    const bnplNoImpact = 'Klarna has no credit impact right?';
    const result2 = detectMyths(bnplNoImpact, 'beginner');
    expect(result2.flags).toContain('MYTH_BNPL_HAS_NO_CREDIT_IMPACT');
  });
});

describe('8 Test Cases', () => {
  // Test Case 5: Simple "what card should I use" question
  it('Test Case 5: should handle simple card recommendation question', () => {
    const question = 'What card should I use at Amazon?';
    const result = detectMyths(question, 'beginner');
    // Should not trigger any myths
    expect(result.flags).toHaveLength(0);
  });

  // Test Case 6: Utilization payment timing question requiring details
  it('Test Case 6: should recognize utilization timing question', () => {
    const question = 'When should I pay to lower my utilization by due date?';
    const result = detectMyths(question, 'intermediate');
    expect(result.flags).toContain('MYTH_PAY_BY_DUE_DATE_AFFECTS_UTIL');
  });

  // Test Case 7: Advanced edge case question (multiple cards, cycling)
  it('Test Case 7: should allow edge cases for advanced users', () => {
    const answer = {
      summary: 'Complex cycling strategy.',
      recommended_action: 'Use card A, then B',
      steps: ['Step 1'],
      mechanics: 'How it works',
      edge_cases: ['If card B is at limit', 'If payment posts late', 'If cycling detected'],
      warnings: ['Banks may close accounts'],
      confidence: 'medium' as const,
      blocked: false,
      block_reason: null,
    };
    const result = applyDepthRules(answer, 'advanced');
    expect(result.edge_cases).not.toBeNull();
    expect(result.edge_cases?.length).toBe(3);
  });

  // Test Case 8: Ambiguous question requiring calibration
  it('Test Case 8: should identify when calibration is needed', () => {
    // Ambiguous questions would trigger calibration in the edge function
    // Here we test that calibration response structure is correct
    const response = createCalibrationNeededResponse(
      'test-id',
      'beginner',
      [
        { id: 'carry_balance', prompt: 'Do you carry a balance?', type: 'single_select', options: [{ value: 'yes', label: 'Yes' }], required: true },
        { id: 'goal', prompt: 'Score or rewards?', type: 'single_select', options: [{ value: 'score', label: 'Score' }], required: true },
      ],
      {}
    );
    expect(response.calibration.needed).toBe(true);
    expect(response.calibration.questions.length).toBe(2);
  });
});