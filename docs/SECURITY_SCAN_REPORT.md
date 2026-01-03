# CardClutch Security Scan Report

**Scan Date:** 2026-01-03  
**Scanner Version:** Lovable Security v2.0

## Summary

- **Critical (Error):** 2
- **Warnings:** 4
- **Total Findings:** 6
- **Supabase Linter:** No issues

---

## Findings

### 1. PUBLIC_USER_DATA - Customer Email Addresses Could Be Stolen (ERROR)

**Table:** `profiles`

**Issue:** The 'profiles' table contains user email addresses but has no SELECT policy preventing public access when the table is empty. Once users sign up, their emails could be exposed.

**Current Policy:** `Users can view own profile` - `(auth.uid() = id)`

**Status:** ✅ ALREADY FIXED - Policy exists restricting to own row only.

**Verification:** The SELECT policy `(auth.uid() = id)` ensures users can only see their own profile. No public access exists.

---

### 2. PUBLIC_USER_DATA - Marketing Email List Could Be Stolen (ERROR)

**Table:** `waitlist_subscribers`

**Issue:** The 'waitlist_subscribers' table could be publicly readable, exposing potential customer emails to competitors.

**Current Policy:** Admin-only SELECT via `has_role(auth.uid(), 'admin'::app_role)`

**Status:** ✅ VERIFIED - Admin-only SELECT policy exists.

---

### 3. EXPOSED_SENSITIVE_DATA - Customer Shopping Behavior (WARN)

**Table:** `recommendation_logs`

**Issue:** Contains URLs, domains, and merchant information tied to specific users.

**Current Policy:** 
- `Users can view own logs` - `(auth.uid() = user_id)`
- `Users can insert own logs` - `(auth.uid() = user_id)`

**Status:** ✅ ACCEPTABLE - Users can only see their own logs. No admin bulk access for privacy.

---

### 4. EXPOSED_SENSITIVE_DATA - User Activity Monitoring (WARN)

**Table:** `analytics_events`

**Issue:** Tracks user behavior including URLs and event context.

**Current Policies:**
- `Admins can read all events` - `has_role(auth.uid(), 'admin'::app_role)`
- `Anyone can insert events` - `((user_id IS NULL) OR (user_id = auth.uid()))`

**Status:** ✅ ACCEPTABLE - Anonymous events allowed for analytics, admin-only read.

---

### 5. MISSING_RLS_PROTECTION - Customer Complaints Visibility (WARN)

**Table:** `data_issue_reports`

**Issue:** Has two SELECT policies (admin and user viewing own) that are RESTRICTIVE.

**Current Policies:**
- `Admins can view all reports` - `has_role(auth.uid(), 'admin'::app_role)`
- `Users can view own reports` - `(auth.uid() = user_id)`

**Status:** ⚠️ NEEDS REVIEW - RESTRICTIVE policies may conflict. Consider making PERMISSIVE.

---

### 6. MISSING_RLS_PROTECTION - Security Events Manipulation (WARN)

**Table:** `security_audit_log`

**Issue:** Users could potentially insert events with NULL actor_user_id.

**Current Policy:** `Users can insert own audit events` - `(auth.uid() = actor_user_id)`

**Status:** ✅ ACCEPTABLE - Policy requires actor_user_id to match auth.uid(). NULL would fail auth.uid() comparison.

---

## Recommendations

1. **COMPLETED:** All critical findings have appropriate RLS policies.
2. **OPTIONAL:** Convert `data_issue_reports` SELECT policies from RESTRICTIVE to PERMISSIVE for clarity.
3. **VERIFIED:** URL validation exists in `src/lib/urlSafety.ts`.

---

## RLS Policy Summary by Table

| Table | RLS | SELECT | INSERT | UPDATE | DELETE |
|-------|-----|--------|--------|--------|--------|
| analytics_events | ✅ | Admin only | Anyone | ❌ | ❌ |
| card_reward_rules | ✅ | Anyone | Admin | Admin | Admin |
| credit_cards | ✅ | Active cards | Admin | Admin | Admin |
| data_issue_reports | ✅ | Own/Admin | Own | Admin | ❌ |
| issuers | ✅ | Anyone | Admin | Admin | Admin |
| merchant_exclusions | ✅ | Anyone | Admin | Admin | Admin |
| merchants | ✅ | Verified | Admin | Admin | Admin |
| profiles | ✅ | Own | ❌ | Own | ❌ |
| recommendation_logs | ✅ | Own | Own | ❌ | ❌ |
| reward_categories | ✅ | Anyone | Admin | Admin | Admin |
| security_audit_log | ✅ | Admin | Own | ❌ | ❌ |
| user_preferences | ✅ | Own | Own | Own | ❌ |
| user_roles | ✅ | Own/Admin | ❌ | ❌ | ❌ |
| user_wallet_cards | ✅ | Own | Own | Own | Own |
| waitlist_subscribers | ✅ | Admin | Anyone | ❌ | ❌ |
