# RLS Verification Checklist

Last updated: 2026-01-11

## Pre-Launch Security Verification

This checklist must be completed before production launch.

---

## Quick Verification Steps

### Step 1: Run ANON Tests

1. Open Supabase Dashboard → SQL Editor
2. Copy and run the ANON section from `supabase/tests/rls_verification.sql`
3. Verify results:

| Table | Expected | ✓/✗ |
|-------|----------|-----|
| profiles | 0 rows | [ ] |
| rag_queries | 0 rows | [ ] |
| user_preferences | 0 rows | [ ] |
| rate_limits | 0 rows | [ ] |
| rag_queries_public columns | NO ip_hash | [ ] |

**If any table returns rows to anon → LAUNCH BLOCKER**

---

### Step 2: Run AUTHED Tests

1. Get a test user UUID from Authentication → Users
2. Replace `YOUR_USER_UUID_HERE` in the AUTHED section
3. Run the AUTHED section

| Test | Expected | ✓/✗ |
|------|----------|-----|
| profiles (own) | 1 row | [ ] |
| profiles (others) | 0 rows | [ ] |
| rag_queries (own) | User's rows only | [ ] |
| rag_queries (others) | 0 rows | [ ] |
| user_preferences (own) | 0-1 rows | [ ] |
| user_preferences (others) | 0 rows | [ ] |

**If any test shows data from other users → LAUNCH BLOCKER**

---

### Step 3: Verify ip_hash Protection

```sql
-- This should NOT include ip_hash
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'rag_queries_public';
```

**If ip_hash is present → LAUNCH BLOCKER**

---

## Remediation

### If anon can read profiles:

```sql
CREATE POLICY "Deny anon access to profiles"
  ON profiles FOR SELECT TO anon USING (false);
```

### If anon can read rag_queries:

```sql
CREATE POLICY "Deny anon access to rag_queries"
  ON rag_queries FOR SELECT TO anon USING (false);
```

### If anon can read user_preferences:

```sql
CREATE POLICY "Deny anon access to user_preferences"
  ON user_preferences FOR SELECT TO anon USING (false);
```

---

## Application-Level Verification

### Test as Guest

1. Sign out of the application
2. Open browser DevTools → Network tab
3. Navigate to pages that might load data
4. Verify no sensitive data is fetched
5. [ ] Confirmed

### Test as User A

1. Sign in as User A
2. Navigate to Ask page, make a query
3. Check that only User A's history appears
4. [ ] Confirmed

### Test Cross-User Access

1. Sign in as User A, note their profile data
2. Sign in as User B
3. Verify User B cannot see User A's:
   - [ ] Profile
   - [ ] Query history
   - [ ] Preferences

---

## Sign-Off

| Item | Verified By | Date |
|------|-------------|------|
| ANON tests pass | | |
| AUTHED tests pass | | |
| ip_hash not exposed | | |
| Application tests pass | | |

**Launch Approved:** [ ] Yes / [ ] No - Issues found: _______________
