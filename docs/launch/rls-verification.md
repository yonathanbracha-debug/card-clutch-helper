# RLS Verification Guide

Last updated: 2026-01-11

This document provides SQL queries to verify Row Level Security (RLS) policies for critical tables before launch.

## 1. Leaked Password Protection (Console Step)

### Enable via Supabase Dashboard:

**Primary Path:**
1. Go to https://supabase.com/dashboard/project/vtpujsezuxqbqfyjrbdc
2. Navigate to **Authentication** (left sidebar)
3. Click **Settings** (or **Providers** → gear icon)
4. Scroll to **Password security** section
5. Toggle **Enable leaked password protection** to ON
6. Click **Save**

**Alternate Path (if UI differs):**
1. Go to **Project Settings** → **Auth** tab
2. Look for **Security** section
3. Find **Leaked password protection** toggle
4. Enable and save

**Verification:** Try signing up with a known leaked password like "password123" — it should be rejected.

---

## 2. RLS Verification Queries

### A. ANON Verification (No Authentication)

These queries simulate requests from unauthenticated users (anon role).

#### profiles — Anon cannot select any rows

```sql
-- Run as anon role
SET ROLE anon;
SET request.jwt.claim.sub = '';

SELECT COUNT(*) FROM profiles;
-- Expected: 0 rows (empty result) or permission denied error
-- If fails (returns rows): Add explicit deny policy for anon

RESET ROLE;
```

**Expected Result:** 0 rows or permission denied  
**If it fails:** Anon can read profiles — this is a security vulnerability  
**Remediation:**
```sql
CREATE POLICY "Deny anon access to profiles"
  ON profiles FOR SELECT
  TO anon
  USING (false);
```

#### rag_queries — Anon cannot select any rows

```sql
-- Run as anon role
SET ROLE anon;
SET request.jwt.claim.sub = '';

SELECT id, question, answer FROM rag_queries LIMIT 5;
-- Expected: 0 rows or permission denied

RESET ROLE;
```

**Expected Result:** 0 rows or permission denied  
**If it fails:** Anon can read rag_queries — security vulnerability  
**Note:** The `rag_queries_public` view exists for admin dashboards but excludes `ip_hash`

#### user_preferences — Anon cannot select any rows

```sql
-- Run as anon role
SET ROLE anon;
SET request.jwt.claim.sub = '';

SELECT * FROM user_preferences LIMIT 5;
-- Expected: 0 rows or permission denied

RESET ROLE;
```

**Expected Result:** 0 rows or permission denied  
**If it fails:** Add explicit deny policy  
**Remediation:**
```sql
CREATE POLICY "Deny anon access to user_preferences"
  ON user_preferences FOR SELECT
  TO anon
  USING (false);
```

#### rate_limits — Verify service role only

```sql
-- Run as anon role
SET ROLE anon;
SET request.jwt.claim.sub = '';

SELECT * FROM rate_limits LIMIT 1;
-- Expected: permission denied

RESET ROLE;
```

**Expected Result:** Permission denied (policy: "Service role only: rate_limits")

---

### B. AUTH Verification (Authenticated User Context)

These queries verify that authenticated users can only access their own data.

**How to run these tests:**
1. Use the Supabase SQL Editor with a test user JWT, OR
2. Use the application with console logging to verify queries, OR
3. Run from edge function with service role and manually set auth context

#### profiles — User can only select own row

```sql
-- Simulate authenticated user with specific UUID
-- Replace 'USER_UUID_HERE' with actual test user ID
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "USER_UUID_HERE", "role": "authenticated"}';

-- Should return only the user's own profile
SELECT * FROM profiles WHERE id = 'USER_UUID_HERE';
-- Expected: 1 row (own profile)

-- Should return 0 rows for other users
SELECT * FROM profiles WHERE id != 'USER_UUID_HERE';
-- Expected: 0 rows

RESET ROLE;
```

**Expected:** User sees only their own profile  
**Policies in place:**
- `Profiles: authenticated can select own` — `(auth.uid() = id)`

#### rag_queries — User can only select own rows, ip_hash never exposed

```sql
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "USER_UUID_HERE", "role": "authenticated"}';

-- Should only see own queries
SELECT id, question, answer, user_id FROM rag_queries 
WHERE user_id = 'USER_UUID_HERE' LIMIT 5;
-- Expected: User's own queries only

-- Verify ip_hash is NOT exposed in user-facing selects
-- The rag_queries_public view excludes ip_hash
SELECT column_name FROM information_schema.columns 
WHERE table_name = 'rag_queries_public';
-- Should NOT include ip_hash

RESET ROLE;
```

**Expected:** User sees only own rows; ip_hash excluded from public view  
**Policies:**
- `Users can read own rag_queries` — `((auth.uid() = user_id) OR is_admin_or_owner(auth.uid()))`

#### user_preferences — User can only access own preferences

```sql
SET ROLE authenticated;
SET request.jwt.claims = '{"sub": "USER_UUID_HERE", "role": "authenticated"}';

-- Should return only user's own preferences
SELECT * FROM user_preferences WHERE user_id = 'USER_UUID_HERE';
-- Expected: 1 row

-- Should not be able to see others
SELECT * FROM user_preferences WHERE user_id != 'USER_UUID_HERE';
-- Expected: 0 rows

-- Verify INSERT respects user_id check
INSERT INTO user_preferences (user_id, experience_level)
VALUES ('DIFFERENT_USER_UUID', 'beginner');
-- Expected: Error (RLS violation)

RESET ROLE;
```

**Expected:** User can only CRUD their own preferences  
**Policies:**
- `User preferences: authenticated can select own`
- `User preferences: authenticated can insert own`
- `User preferences: authenticated can update own`

---

### C. Hardening Recommendations

#### Explicit Deny Policies for Anon

Add these policies if not already present to make anon denial explicit:

```sql
-- Explicit deny for profiles (anon)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'profiles' AND policyname LIKE '%anon%deny%'
  ) THEN
    CREATE POLICY "Deny anon access to profiles"
      ON profiles FOR SELECT
      TO anon
      USING (false);
  END IF;
END $$;

-- Explicit deny for user_preferences (anon)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'user_preferences' AND policyname LIKE '%anon%deny%'
  ) THEN
    CREATE POLICY "Deny anon access to user_preferences"
      ON user_preferences FOR SELECT
      TO anon
      USING (false);
  END IF;
END $$;

-- Explicit deny for rag_queries (anon) 
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'rag_queries' AND policyname LIKE '%anon%deny%'
  ) THEN
    CREATE POLICY "Deny anon access to rag_queries"
      ON rag_queries FOR SELECT
      TO anon
      USING (false);
  END IF;
END $$;
```

---

## 3. Verification Checklist

| Table | Anon SELECT | Auth SELECT own | Auth SELECT others | ip_hash hidden |
|-------|-------------|-----------------|--------------------|-----------------| 
| profiles | ❌ Denied | ✅ Yes | ❌ No | N/A |
| rag_queries | ❌ Denied | ✅ Yes | ❌ No | ✅ Via view |
| user_preferences | ❌ Denied | ✅ Yes | ❌ No | N/A |
| rate_limits | ❌ Denied | ❌ Denied | ❌ Denied | N/A |

---

## 4. ip_hash Protection

The `ip_hash` column in `rag_queries` stores hashed client IPs for rate limiting.

**Protection measures:**
1. `rag_queries_public` view excludes `ip_hash` — use this view for client-facing queries
2. Edge functions use service role and do NOT return ip_hash to clients
3. RLS policy prevents anon access to base table

**Frontend rule:** NEVER use `SELECT *` on `rag_queries`. Always use explicit column lists or the `rag_queries_public` view.

---

## 5. Running Verification

### Via Supabase Dashboard SQL Editor:
1. Open SQL Editor in dashboard
2. Run each query block above
3. Verify expected results

### Via Application Testing:
1. Sign out → try to fetch profiles via API → should fail
2. Sign in as User A → fetch preferences → should only see User A's data
3. Try to fetch User B's profile → should return empty

### Automated Test Script (optional):
Create a test edge function that runs these checks and returns pass/fail status.
