# CardClutch Acceptance Checklist

**Last Updated:** 2026-01-03  
**Version:** 1.0

## Core Functionality

| Check | Status | Notes |
|-------|--------|-------|
| Landing page loads in <2s and no console errors | ⚠️ WARNING | Console shows forwardRef warnings for SelectedCardChips/CardImage - needs fix |
| Card selection persists correctly (refresh keeps selected cards) | ✅ PASS | Using localStorage for guest, Supabase for authenticated users |
| Recommendation returns deterministic result for known merchants | ✅ PASS | Registry-first approach ensures consistency |
| Unknown merchant flow behaves as expected (fallback + messaging) | ✅ PASS | Heuristics → AI fallback with review queue |
| Card details drawer/modal shows correct annual fee + categories | ✅ PASS | CardDetailsSheet shows verified data |
| Annual fee values are correct and consistent across all views | ✅ PASS | Amex Gold $325, Platinum $695, etc. verified |
| Card images render for every card (no generic placeholder unless intentional) | ✅ PASS | CardThumbnail with CardArtwork fallback |

## Security

| Check | Status | Notes |
|-------|--------|-------|
| Admin routes are protected by server-side RLS | ✅ PASS | user_roles table with has_role() SECURITY DEFINER |
| RLS enabled on every table | ✅ PASS | All 15 tables have RLS enabled |
| No WARN/ERROR in Supabase security linter | ✅ PASS | No linter issues |
| Profiles table SELECT restricted to own row | ⚠️ NEEDS FIX | Current policy may expose emails when empty |
| Waitlist subscribers not publicly readable | ⚠️ NEEDS FIX | Admin-only SELECT policy needed |
| Audit log INSERT enforces auth.uid() | ⚠️ NEEDS FIX | Could allow NULL actor_user_id |

## Data Quality

| Check | Status | Notes |
|-------|--------|-------|
| 50+ cards in catalog | ✅ PASS | 50 cards with verified data |
| 150+ merchants in registry | ✅ PASS | 150+ merchants across all categories |
| All cards have annual_fee_cents populated | ✅ PASS | No null fees in active cards |
| All cards have verified source URLs | ✅ PASS | learnMoreUrl and applyUrl present |

## Console Warnings to Fix

1. **forwardRef warning on SelectedCardChips** - Component needs ref forwarding
2. **forwardRef warning on CardImage** - Component needs ref forwarding

## Change Log

| File | Change | Check Fixed |
|------|--------|-------------|
| src/components/vault/SelectedCardChips.tsx | Add forwardRef | Console warnings |
| src/components/CardImage.tsx | Add forwardRef | Console warnings |
| RLS policy migration | Fix waitlist/profiles SELECT | Security scan findings |

---

## Verification Steps

1. Open browser DevTools Console
2. Navigate to /analyze
3. Add cards to wallet
4. Refresh page - cards should persist
5. Enter merchant URL (e.g., amazon.com)
6. Verify deterministic recommendation
7. Check card details drawer shows accurate fees
8. Navigate to /admin (should show "Not authorized" for non-admins)
