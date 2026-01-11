-- =============================================================================
-- RLS VERIFICATION QUERIES
-- Run these in Supabase SQL Editor to verify Row Level Security
-- Last updated: 2026-01-11
-- =============================================================================

-- =============================================================================
-- SECTION 1: ANON VERIFICATION
-- These queries test that unauthenticated users cannot access protected data
-- =============================================================================

-- Setup: Switch to anon role
SET LOCAL ROLE anon;

-- -----------------------------------------------------------------------------
-- Test 1A: profiles table
-- Expected: 0 rows (anon should not see any profiles)
-- -----------------------------------------------------------------------------
SELECT 'profiles' AS table_name, COUNT(*) AS row_count FROM public.profiles;

-- -----------------------------------------------------------------------------
-- Test 1B: rag_queries table  
-- Expected: 0 rows (anon should not see any queries)
-- -----------------------------------------------------------------------------
SELECT 'rag_queries' AS table_name, COUNT(*) AS row_count FROM public.rag_queries;

-- -----------------------------------------------------------------------------
-- Test 1C: user_preferences table
-- Expected: 0 rows (anon should not see any preferences)
-- -----------------------------------------------------------------------------
SELECT 'user_preferences' AS table_name, COUNT(*) AS row_count FROM public.user_preferences;

-- -----------------------------------------------------------------------------
-- Test 1D: rate_limits table
-- Expected: 0 rows (service role only)
-- -----------------------------------------------------------------------------
SELECT 'rate_limits' AS table_name, COUNT(*) AS row_count FROM public.rate_limits;

-- -----------------------------------------------------------------------------
-- Test 1E: Verify rag_queries_public view does NOT expose ip_hash
-- Expected: ip_hash should NOT be in column list
-- -----------------------------------------------------------------------------
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'rag_queries_public' 
  AND table_schema = 'public'
ORDER BY ordinal_position;

-- Reset role
RESET ROLE;

-- =============================================================================
-- SECTION 2: AUTHENTICATED USER VERIFICATION
-- These queries test that authenticated users can only access their own data
-- IMPORTANT: Replace 'YOUR_USER_UUID_HERE' with an actual test user UUID
-- =============================================================================

-- Setup: Switch to authenticated role and set user context
SET LOCAL ROLE authenticated;

-- IMPORTANT: Replace this UUID with your actual test user ID
-- You can find user IDs in Authentication -> Users in the dashboard
SELECT set_config('request.jwt.claim.sub', 'YOUR_USER_UUID_HERE', true);

-- -----------------------------------------------------------------------------
-- Test 2A: profiles - user can see their own profile
-- Expected: 1 row (only the authenticated user's profile)
-- -----------------------------------------------------------------------------
SELECT 
  'profiles (own)' AS test_name,
  id, 
  email, 
  display_name,
  created_at 
FROM public.profiles 
WHERE id = current_setting('request.jwt.claim.sub', true)::uuid;

-- -----------------------------------------------------------------------------
-- Test 2B: profiles - user cannot see other profiles
-- Expected: 0 rows
-- -----------------------------------------------------------------------------
SELECT 
  'profiles (others)' AS test_name,
  COUNT(*) AS visible_count
FROM public.profiles 
WHERE id != current_setting('request.jwt.claim.sub', true)::uuid;

-- -----------------------------------------------------------------------------
-- Test 2C: rag_queries - user can see their own queries
-- Expected: Only rows belonging to authenticated user
-- -----------------------------------------------------------------------------
SELECT 
  'rag_queries (own)' AS test_name,
  id, 
  user_id, 
  question,
  -- Note: ip_hash should NEVER be selected in client-facing queries
  created_at 
FROM public.rag_queries 
WHERE user_id = current_setting('request.jwt.claim.sub', true)::uuid
ORDER BY created_at DESC
LIMIT 5;

-- -----------------------------------------------------------------------------
-- Test 2D: rag_queries - user cannot see other users' queries
-- Expected: 0 rows
-- -----------------------------------------------------------------------------
SELECT 
  'rag_queries (others)' AS test_name,
  COUNT(*) AS visible_count
FROM public.rag_queries 
WHERE user_id != current_setting('request.jwt.claim.sub', true)::uuid
  AND user_id IS NOT NULL;

-- -----------------------------------------------------------------------------
-- Test 2E: user_preferences - user can see their own preferences
-- Expected: 1 row (or 0 if no preferences set yet)
-- -----------------------------------------------------------------------------
SELECT 
  'user_preferences (own)' AS test_name,
  user_id,
  mode,
  experience_level,
  calibration_completed,
  created_at
FROM public.user_preferences 
WHERE user_id = current_setting('request.jwt.claim.sub', true)::uuid;

-- -----------------------------------------------------------------------------
-- Test 2F: user_preferences - user cannot see other users' preferences
-- Expected: 0 rows
-- -----------------------------------------------------------------------------
SELECT 
  'user_preferences (others)' AS test_name,
  COUNT(*) AS visible_count
FROM public.user_preferences 
WHERE user_id != current_setting('request.jwt.claim.sub', true)::uuid;

-- -----------------------------------------------------------------------------
-- Test 2G: Attempt INSERT with wrong user_id (should fail)
-- Expected: RLS violation error
-- -----------------------------------------------------------------------------
-- Uncomment to test (will error):
-- INSERT INTO public.user_preferences (user_id, experience_level)
-- VALUES ('00000000-0000-0000-0000-000000000001', 'beginner');

-- Reset role
RESET ROLE;

-- =============================================================================
-- SECTION 3: ADMIN VERIFICATION (optional)
-- Test that admin role can perform elevated operations
-- =============================================================================

-- Setup: Verify admin role check function exists
SELECT 
  'has_role function' AS check_name,
  CASE WHEN EXISTS (
    SELECT 1 FROM pg_proc 
    WHERE proname = 'has_role' AND pronamespace = 'public'::regnamespace
  ) THEN 'EXISTS' ELSE 'MISSING' END AS status;

-- =============================================================================
-- SUMMARY: Expected Results
-- =============================================================================
-- 
-- | Test | Expected Result |
-- |------|-----------------|
-- | 1A profiles (anon) | 0 rows |
-- | 1B rag_queries (anon) | 0 rows |
-- | 1C user_preferences (anon) | 0 rows |
-- | 1D rate_limits (anon) | 0 rows |
-- | 1E rag_queries_public columns | NO ip_hash column |
-- | 2A profiles (own) | 1 row |
-- | 2B profiles (others) | 0 rows |
-- | 2C rag_queries (own) | User's rows only |
-- | 2D rag_queries (others) | 0 rows |
-- | 2E user_preferences (own) | 1 row (or 0 if not set) |
-- | 2F user_preferences (others) | 0 rows |
-- | 2G INSERT wrong user_id | RLS error |
--
-- If ANY test fails with unexpected results, treat as LAUNCH BLOCKER.
-- =============================================================================
