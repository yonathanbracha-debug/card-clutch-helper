-- ============================================
-- Rate Limiting Enhancement + RLS Hardening
-- Sprint: Security Launch Blockers 2026-01-11
-- ============================================

-- Add scope columns to rate_limits for proper IP/user separation
ALTER TABLE rate_limits 
ADD COLUMN IF NOT EXISTS scope_type text CHECK (scope_type IN ('ip', 'user')),
ADD COLUMN IF NOT EXISTS scope_key text,
ADD COLUMN IF NOT EXISTS window_size_seconds integer DEFAULT 3600;

-- Create index for efficient lookups
CREATE INDEX IF NOT EXISTS idx_rate_limits_scope_lookup 
ON rate_limits (scope_type, scope_key, window_start, window_size_seconds);

-- Ensure RLS is enabled on rate_limits (should already be but confirm)
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists and recreate with explicit deny
DROP POLICY IF EXISTS "Service role only: rate_limits" ON rate_limits;

-- Only service role can access rate_limits (edge functions use service role)
CREATE POLICY "Service role only: rate_limits"
ON rate_limits FOR ALL
TO anon, authenticated
USING (false)
WITH CHECK (false);

-- ============================================
-- Explicit ANON deny policies for sensitive tables
-- These make security audits clearer
-- ============================================

-- profiles: explicit anon deny
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname = 'Deny anon access to profiles'
  ) THEN
    CREATE POLICY "Deny anon access to profiles"
      ON profiles FOR SELECT
      TO anon
      USING (false);
  END IF;
END $$;

-- user_preferences: explicit anon deny
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_preferences' AND policyname = 'Deny anon access to user_preferences'
  ) THEN
    CREATE POLICY "Deny anon access to user_preferences"
      ON user_preferences FOR SELECT
      TO anon
      USING (false);
  END IF;
END $$;

-- rag_queries: explicit anon deny
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'rag_queries' AND policyname = 'Deny anon access to rag_queries'
  ) THEN
    CREATE POLICY "Deny anon access to rag_queries"
      ON rag_queries FOR SELECT
      TO anon
      USING (false);
  END IF;
END $$;

-- Add answer_json column to rag_queries for structured output storage
ALTER TABLE rag_queries 
ADD COLUMN IF NOT EXISTS answer_json jsonb;

-- Comment on the column for documentation
COMMENT ON COLUMN rag_queries.answer_json IS 'Structured AskAnswer JSON conforming to src/lib/askAnswerSchema.ts';

-- Add index for efficient structured answer queries
CREATE INDEX IF NOT EXISTS idx_rag_queries_answer_json_gin 
ON rag_queries USING gin (answer_json);

-- ============================================
-- Recreate rag_queries_public view to include answer_json but NOT ip_hash
-- Must DROP first since we're changing columns
-- ============================================
DROP VIEW IF EXISTS rag_queries_public;

CREATE VIEW rag_queries_public AS
SELECT 
  id,
  user_id,
  created_at,
  question,
  answer,
  answer_json,
  retrieved_chunks,
  confidence,
  include_citations,
  intent,
  latency_ms,
  model,
  error
FROM rag_queries;
-- NOTE: ip_hash is EXCLUDED from this view

-- Ensure the view is accessible
GRANT SELECT ON rag_queries_public TO authenticated;

-- ============================================
-- Comments for documentation
-- ============================================
COMMENT ON POLICY "Deny anon access to profiles" ON profiles IS 'Explicit deny for security audits';
COMMENT ON POLICY "Deny anon access to user_preferences" ON user_preferences IS 'Explicit deny for security audits';
COMMENT ON POLICY "Deny anon access to rag_queries" ON rag_queries IS 'Explicit deny for security audits';
COMMENT ON INDEX idx_rate_limits_scope_lookup IS 'Efficient lookup for rate limit checks by scope_type + scope_key';