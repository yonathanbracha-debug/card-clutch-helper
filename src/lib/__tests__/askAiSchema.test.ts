/**
 * AskAiSchema Tests
 * Validates the hard output schema for AI responses
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
