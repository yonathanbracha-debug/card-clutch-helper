-- Fix Security Definer View warning
-- Recreate rag_queries_public as SECURITY INVOKER (default) view

DROP VIEW IF EXISTS rag_queries_public;

CREATE VIEW rag_queries_public 
WITH (security_invoker = true) AS
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

-- Grant access
GRANT SELECT ON rag_queries_public TO authenticated;

COMMENT ON VIEW rag_queries_public IS 'Public view of rag_queries excluding ip_hash. Uses SECURITY INVOKER so RLS applies.';