# RC Build Checklist

## Last Run: 2026-01-03 (Updated)

## Summary

| Category | Pass | Fail | Notes |
|----------|------|------|-------|
| Data Correctness | 4 | 0 | All fee checks pass |
| Security | 5 | 0 | RLS enabled, storage policies added |
| UI/UX | 5 | 0 | Cards render with images, details drawer complete |
| Admin | 3 | 0 | Routes protected, image upload works |
| Data Flow | 2 | 0 | Single source of truth established |

---

## Data Flow (Single Source of Truth)

### ✅ PASS: Deprecated engine imports removed from Hero.tsx
- **Check:** `src/components/Hero.tsx` imports
- **Result:** Now imports from `recommendationEngineV2.ts` ✅

### ✅ PASS: RecommendationResult uses DB-backed types
- **Check:** `src/components/RecommendationResult.tsx` imports
- **Result:** Uses `CreditCardDB` types with `issuer_name`, `annual_fee_cents` ✅

---

## Data Correctness

### ✅ PASS: Amex Gold annual fee correct in database
- **Check:** `SELECT annual_fee_cents FROM credit_cards WHERE name = 'Gold Card'`
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

### ✅ PASS: Storage bucket RLS policies
- **Check:** `card-images` bucket has admin-only upload policies
- **Result:** Public read, admin-only write ✅

---

## Card Display & Images

### ✅ PASS: Card images render from DB when available
- **Check:** `CardImage` component uses `imageUrl` prop from `credit_cards.image_url`
- **Result:** DB images shown with CardArtwork fallback ✅

### ✅ PASS: CardArtwork fallback is premium themed
- **Check:** Issuer-specific gradients and patterns in `CardArtwork.tsx`
- **Result:** All cards have consistent premium fallback artwork ✅

### ✅ PASS: Card details drawer shows full rules
- **Check:** Annual fee, rewards with categories, caps, exclusions, last verified
- **Result:** `CardInfoDrawer.tsx` displays all required fields ✅

### ✅ PASS: Annual fee displays correctly in card list
- **Check:** `annual_fee_cents / 100` calculation
- **Result:** Displays "$325/year" format correctly ✅

### ✅ PASS: Card image passes through all components
- **Check:** Image URL passed from DB → useCreditCards → CardImage → CardThumbnail
- **Result:** All card display components support `imageUrl` prop ✅

---

## Admin Routes

### ✅ PASS: Admin routes protected by role check
- **Check:** `/admin` requires `admin` role
- **Result:** `useIsAdmin` hook checks `user_roles` table ✅

### ✅ PASS: Admin metrics load from database
- **Check:** Dashboard queries `credit_cards`, `recommendation_logs`, etc.
- **Result:** Real data displayed ✅

### ✅ PASS: Admin card image upload works
- **Check:** `AdminCardManager` uploads to `card-images` bucket
- **Result:** PNG/JPG/WebP upload with 5MB limit ✅

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
| `src/lib/types.ts` | Created | Shared types for single source of truth |
| `src/components/Hero.tsx` | Updated import | Use V2 engine |
| `src/components/RecommendationResult.tsx` | Updated import + DB fields | Use V2 engine + DB types |
| `src/components/CardImage.tsx` | Remove cardCatalog import | Self-contained type |
| `src/components/CardThumbnail.tsx` | Remove cardCatalog import | Self-contained type |
| `src/components/admin/AdminCardManager.tsx` | Add image upload | Admin can upload card images |
| `src/pages/Cards.tsx` | Pass imageUrl | Show DB images |
| `src/pages/Index.tsx` | Pass imageUrl | Show DB images |
| `src/pages/Analyze.tsx` | Pass imageUrl | Show DB images |
| `src/components/CardInfoDrawer.tsx` | Pass imageUrl | Show DB images |
| `src/components/vault/CardVaultSheet.tsx` | Pass imageUrl | Show DB images |
| `src/components/vault/SelectedCardChips.tsx` | Pass imageUrl | Show DB images |
| `docs/RC_CHECKLIST.md` | Updated | Added new checks |

---

## Known Issues (Non-blocking)

1. **cardData.ts still exists** - Only used as fallback reference, not in production data path
2. **Merchant mappings in V2 engine** - ~40 merchants inline. Extended registry has 500+

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
