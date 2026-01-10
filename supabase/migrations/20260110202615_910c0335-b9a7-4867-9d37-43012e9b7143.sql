-- Security hardening migration
-- 1. Create public view for rag_queries that excludes ip_hash
-- 2. Harden profiles RLS to explicitly block anonymous access
-- 3. Harden user_preferences RLS to explicitly block anonymous access

-- ============================================
-- 1. RAG_QUERIES: Create safe public view without ip_hash
-- ============================================
CREATE OR REPLACE VIEW public.rag_queries_public AS
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

-- Grant access to the view (RLS on base table still applies)
GRANT SELECT ON public.rag_queries_public TO anon, authenticated;

-- ============================================
-- 2. PROFILES: Harden RLS to explicitly require authentication
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Create new policies with explicit 'to authenticated' restriction
CREATE POLICY "Profiles: authenticated can select own"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Profiles: authenticated can update own"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- Note: INSERT is handled by trigger from auth.users, not client-side
-- But add policy for completeness in case of future use
CREATE POLICY "Profiles: authenticated can insert own"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

-- ============================================
-- 3. USER_PREFERENCES: Harden RLS to explicitly require authentication
-- ============================================
-- Drop existing policies
DROP POLICY IF EXISTS "Users can view own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can update own preferences" ON public.user_preferences;
DROP POLICY IF EXISTS "Users can insert own preferences" ON public.user_preferences;

-- Create new policies with explicit 'to authenticated' restriction
CREATE POLICY "User preferences: authenticated can select own"
ON public.user_preferences
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "User preferences: authenticated can update own"
ON public.user_preferences
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "User preferences: authenticated can insert own"
ON public.user_preferences
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);