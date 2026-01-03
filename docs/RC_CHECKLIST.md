# RC Build Checklist

## Last Run: 2026-01-03

## Summary

| Category | Pass | Fail | Notes |
|----------|------|------|-------|
| Data Correctness | 4 | 0 | All fee checks pass |
| Security | 4 | 0 | RLS enabled, validation in place |
| UI/UX | 3 | 0 | Cards render correctly |
| Admin | 2 | 0 | Routes protected |

---

## Data Correctness

### ✅ PASS: Amex Gold annual fee correct in database
- **Check:** `SELECT annual_fee_cents FROM credit_cards WHERE name = 'Gold Card' AND issuer_id = (SELECT id FROM issuers WHERE name = 'American Express')`
- **Result:** 32500 cents = $325/year ✅

### ✅ PASS: Amex Gold fee correct in cardCatalog.ts
- **Check:** `src/lib/cardCatalog.ts` line 76
- **Result:** `annual_fee_cents: 32500` ✅

### ✅ PASS: Amex Gold fee correct in cardData.ts (fixed)
- **Check:** `src/lib/cardData.ts` line 47
- **Result:** `annualFee: 325` ✅ (was 250, now fixed)

### ✅ PASS: Rewards display includes category context
- **Check:** Card rewards show "4x Dining" not just "4x"
- **Result:** All reward displays include category labels ✅

---

## URL Validation

### ✅ PASS: URL validation rejects dangerous schemes
- **Check:** `src/lib/urlSafety.ts` rejects `javascript:`, `data:`, `file:`, etc.
- **Result:** DANGEROUS_SCHEMES array includes all malicious schemes ✅

### ✅ PASS: URL length limit enforced
- **Check:** MAX_URL_LENGTH = 2048
- **Result:** URLs over 2048 chars are rejected ✅

### ✅ PASS: Domain extraction sanitized
- **Check:** `extractDomainSafe()` validates scheme and hostname
- **Result:** Proper validation before domain extraction ✅

---

## Security (RLS)

### ✅ PASS: RLS enabled on all user tables
- **Check:** Supabase linter
- **Result:** No linter issues found ✅

### ✅ PASS: All 15 public tables exist with RLS
- **Tables verified:**
  - profiles ✅
  - user_wallet_cards ✅
  - user_preferences ✅
  - user_roles ✅
  - recommendation_logs ✅
  - credit_cards ✅
  - card_reward_rules ✅
  - merchant_exclusions ✅
  - merchants ✅
  - issuers ✅
  - reward_categories ✅
  - waitlist_subscribers ✅
  - data_issue_reports ✅
  - security_audit_log ✅
  - analytics_events ✅

### ✅ PASS: No SECURITY DEFINER bypass
- **Check:** `has_role()` function is SECURITY DEFINER but only checks role existence
- **Result:** Function is safe - only returns boolean, no data leakage ✅

---

## Card Display

### ✅ PASS: Card images render for all cards
- **Check:** `CardImage` component generates themed visuals per issuer/network
- **Result:** All cards have consistent artwork ✅

### ✅ PASS: Card details drawer shows structured data
- **Check:** Annual fee, rewards with categories, exclusions, last verified
- **Result:** `CardDetail.tsx` displays all required fields ✅

### ✅ PASS: Annual fee displays correctly in card list
- **Check:** `annual_fee_cents / 100` calculation
- **Result:** Displays "$325/year" format correctly ✅

---

## Admin Routes

### ✅ PASS: Admin routes protected by role check
- **Check:** `/admin` requires `admin` role
- **Result:** `useIsAdmin` hook checks `user_roles` table ✅

### ✅ PASS: Admin metrics load from database
- **Check:** Dashboard queries `credit_cards`, `recommendation_logs`, etc.
- **Result:** Real data displayed ✅

---

## Landing Page

### ✅ PASS: Landing does not force signup
- **Check:** Index page renders without auth
- **Result:** Public access, demo mode available ✅

### ✅ PASS: Demo mode works without login
- **Check:** `useUnifiedWallet` provides guest wallet
- **Result:** Users can analyze URLs without account ✅

---

## Database Stats

| Metric | Count |
|--------|-------|
| Active cards | 50 |
| Reward rules | 162 |
| Tables with RLS | 15 |

---

## Files Changed in This RC Pass

| File | Change | Issue Fixed |
|------|--------|-------------|
| `src/lib/cardData.ts` | Fixed Amex Gold fee | $250 → $325 |
| `docs/TRACE_CARD_DATA.md` | Created | Documentation |
| `docs/TRACE_RECOMMENDATION_FLOW.md` | Created | Documentation |
| `docs/RC_CHECKLIST.md` | Created | This file |

---

## Known Issues (Non-blocking)

1. **Legacy engine still imported in Hero.tsx** - Only uses types, not data. Low risk.
2. **Merchant mappings hardcoded in V2 engine** - ~40 merchants. Extended registry has 500+.

---

## Verification Commands

```sql
-- Verify Amex Gold fee
SELECT name, annual_fee_cents FROM credit_cards 
WHERE name = 'Gold Card' AND is_active = true;
-- Expected: 32500

-- Count cards with images
SELECT COUNT(*) FROM credit_cards WHERE image_url IS NOT NULL;

-- Check RLS on user tables
SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('profiles', 'user_wallet_cards');
-- Expected: rowsecurity = true
```
