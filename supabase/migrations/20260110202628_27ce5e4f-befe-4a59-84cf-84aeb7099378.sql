-- Fix SECURITY DEFINER view issue
-- Drop and recreate view with SECURITY INVOKER to respect RLS of querying user

DROP VIEW IF EXISTS public.rag_queries_public;

CREATE VIEW public.rag_queries_public 
WITH (security_invoker = true)
AS
SELECT
  id,
  user_id,
  created_at,
  question,
  answer,
  retrieved_chunks,
  confidence,
  include_citations,
  intent,
  latency_ms,
  model,
  error
FROM public.rag_queries;

-- Grant access to the view (RLS on base table applies via security_invoker)
GRANT SELECT ON public.rag_queries_public TO anon, authenticated;