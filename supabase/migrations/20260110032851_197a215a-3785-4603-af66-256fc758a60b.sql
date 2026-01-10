-- Fix the rag_queries INSERT policy to be service-role only (false for client-side)
DROP POLICY IF EXISTS "Service role can insert rag_queries" ON public.rag_queries;

-- Service role bypasses RLS, so this policy blocks all client inserts
-- Edge functions using service role key will still be able to insert
CREATE POLICY "Service role only: rag_queries insert"
  ON public.rag_queries FOR INSERT
  WITH CHECK (false);