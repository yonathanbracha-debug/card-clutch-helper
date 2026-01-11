# Testing Guide

Last updated: 2026-01-11

## Overview

This document describes how to run tests for the CardClutch project.

---

## Unit Tests

### Setup

The project uses Vitest for unit testing.

```bash
# Install dependencies (if not already)
bun install

# Run all tests
bun run test

# Run tests in watch mode
bun run test:watch

# Run tests with coverage
bun run test:coverage
```

### Test Files

Tests are located alongside source files or in `__tests__` directories:

```
src/lib/__tests__/askAiSchema.test.ts  # Schema validation tests
```

---

## Schema Validation Tests

### Location
`src/lib/__tests__/askAiSchema.test.ts`

### What's tested

1. **Valid payload passes** - A complete, valid response is accepted
2. **Invalid payload fails** - Missing required fields are rejected
3. **Rate limit (429) payload passes** - Error responses conform to schema
4. **Fallback response is valid** - Fallback function produces valid output

### Running

```bash
bun run test src/lib/__tests__/askAiSchema.test.ts
```

---

## RLS Verification

### Location
`supabase/tests/rls_verification.sql`

### Running

1. Open Supabase Dashboard → SQL Editor
2. Copy the contents of `rls_verification.sql`
3. Replace `YOUR_USER_UUID_HERE` with a real user ID
4. Run the queries
5. Verify results match expected values

See `docs/launch/rls-checklist.md` for detailed expected results.

---

## Integration Testing

### Edge Function Testing

Test the ask-credit-question function:

```bash
# Via curl (replace with your project URL)
curl -X POST \
  https://vtpujsezuxqbqfyjrbdc.supabase.co/functions/v1/ask-credit-question \
  -H "Content-Type: application/json" \
  -H "apikey: YOUR_ANON_KEY" \
  -d '{"question": "What is credit utilization?"}'
```

### Expected Response Shape

All responses should match the `AskAiResponseSchema`:

```json
{
  "version": "v1",
  "request_id": "uuid",
  "route": "deterministic|rag|hybrid|error",
  "answer": {
    "tl_dr": "string",
    "short": "string", 
    "detailed": "string",
    "action_items": [],
    "pitfalls": []
  },
  "confidence": {
    "score": 0.0-1.0,
    "level": "low|medium|high",
    "rationale": []
  },
  "myth": {
    "is_myth": false,
    "myth_label": null,
    "correction": null
  },
  "score_impact": {...},
  "citations": [],
  "metrics": {...},
  "error": null
}
```

---

## Rate Limit Testing

### Test IP Limit

```bash
# Run 31+ requests rapidly to trigger IP limit
for i in {1..35}; do
  curl -X POST ... -d '{"question": "test"}'
done

# 31st request should return 429
```

### Expected 429 Response

```json
{
  "version": "v1",
  "route": "error",
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded..."
  },
  "metrics": {
    "rate_limit": {
      "ip": {
        "limit": 30,
        "remaining": 0,
        "reset_unix": 1234567890
      }
    }
  }
}
```

---

## Manual Testing Checklist

### Guest Flow

- [ ] Can access /ask without login
- [ ] Calibration questions appear first
- [ ] Can skip or complete calibration
- [ ] Demo limit (3 questions) enforced
- [ ] Demo modal appears after limit

### Authenticated Flow

- [ ] Login works
- [ ] Calibration persists to database
- [ ] Questions answered correctly
- [ ] History is user-specific
- [ ] Rate limits are per-user (higher than IP)

### Error Handling

- [ ] Invalid question shows error card
- [ ] Rate limit shows appropriate message
- [ ] Network errors handled gracefully
- [ ] Schema validation catches malformed responses

---

## CI/CD

Tests should run on every PR:

```yaml
# Example GitHub Actions
- name: Run Tests
  run: bun run test
```

---

## Adding New Tests

1. Create test file: `src/lib/__tests__/[feature].test.ts`
2. Import vitest: `import { describe, it, expect } from 'vitest'`
3. Write tests following existing patterns
4. Run and verify: `bun run test`
