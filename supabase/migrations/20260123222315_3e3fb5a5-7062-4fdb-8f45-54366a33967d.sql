-- Fix Security Issue 1: waitlist_subscribers email exposure
-- The table should only allow admins/owners to SELECT, but anyone can INSERT with valid email

-- First, drop any existing SELECT policies that might allow public access
DROP POLICY IF EXISTS "Public read: waitlist_subscribers" ON public.waitlist_subscribers;
DROP POLICY IF EXISTS "Anyone can read waitlist" ON public.waitlist_subscribers;

-- The existing policies from the useful-context show:
-- - "Admins and owners can view waitlist" (SELECT) - GOOD, keep this
-- - "Anyone can subscribe with valid email" (INSERT) - GOOD, keep this
-- These are already correct based on the schema provided, but let's ensure no stale public SELECT policies exist

-- Fix Security Issue 2: rag_queries_public view exposure
-- The view needs to be secured - currently it's a security invoker view but 
-- we need to ensure it's properly protected

-- Drop the existing view
DROP VIEW IF EXISTS public.rag_queries_public;

-- Recreate the view with security_invoker to respect RLS of underlying table
CREATE VIEW public.rag_queries_public
WITH (security_invoker = on) AS
SELECT 
  id,
  user_id,
  created_at,
  question,
  answer,
  answer_json,
  confidence,
  latency_ms,
  include_citations,
  intent,
  model,
  error,
  retrieved_chunks
  -- Explicitly excludes: ip_hash, redacted_question, redacted_answer, myth_flags, calibration_needed, calibration_questions, routing, answer_depth, answer_schema_version
FROM public.rag_queries;

-- Grant appropriate permissions on the view
GRANT SELECT ON public.rag_queries_public TO authenticated;

-- Revoke any public/anon access to the view
REVOKE ALL ON public.rag_queries_public FROM anon;
REVOKE ALL ON public.rag_queries_public FROM public;

-- Add a comment explaining the security model
COMMENT ON VIEW public.rag_queries_public IS 'Security-invoker view that respects RLS on rag_queries table. Excludes sensitive fields like ip_hash. Only authenticated users can access, and they can only see their own queries due to underlying table RLS.';