# Card Data Source Trace

## Last Updated: 2026-01-03

## Summary

CardClutch has **THREE** sources of card data. This creates risk of inconsistency.

| Source | File | Current Role | Authority |
|--------|------|--------------|-----------|
| Supabase `credit_cards` table | DB | **Source of truth** for production | Canonical |
| `src/lib/cardCatalog.ts` | Frontend | Fallback/dev catalog | Secondary |
| `src/lib/cardData.ts` | Frontend | **DEPRECATED - HAS WRONG DATA** | Do not use |

## Critical Issue: Amex Gold Fee

| Source | Annual Fee | Status |
|--------|------------|--------|
| Supabase DB | $325 (32500 cents) | ✅ Correct |
| `cardCatalog.ts` | $325 (32500 cents) | ✅ Correct |
| `cardData.ts` (line 47) | **$250** | ❌ WRONG |

The `cardData.ts` file has incorrect data and should NOT be used.

## Files Where Card Data is Defined

### 1. Supabase Database (Source of Truth)
- **Table:** `credit_cards`
- **Fields:** `id`, `issuer_id`, `name`, `annual_fee_cents`, `network`, `reward_summary`, `image_url`, `source_url`, `last_verified_at`, `verification_status`, `is_active`, `credits_summary`, `terms_url`, `slug`
- **Hook:** `src/hooks/useCreditCards.ts`
- **Status:** ✅ Should be used everywhere

### 2. `src/lib/cardCatalog.ts` (Fallback Catalog)
- **Card count:** 50
- **Fields defined:** `id`, `name`, `issuer`, `network`, `annual_fee_cents`, `last_verified`, `rewards[]`, `exclusions[]`, `highlights[]`, `artwork{}`, `foreign_tx_fee_percent`, `credits_summary`, `learnMoreUrl`, `applyUrl`, `dataConfidence`, `needsVerification`, `baseEarning`, `valueType`, `imageUrl`
- **Amex Gold fee:** 32500 cents ✅ CORRECT
- **Status:** ✅ Acceptable as development fallback

### 3. `src/lib/cardData.ts` (DEPRECATED)
- **Card count:** ~20+
- **Fields defined:** `id`, `name`, `issuer`, `network`, `annualFee` (dollars, not cents), `rewards[]`, `rewardSummary`, `notes[]`
- **Amex Gold fee:** $250 ❌ WRONG (should be $325)
- **Status:** ⚠️ DEPRECATED - Contains incorrect data

## Files That Read Card Data

| File | Source Used | Notes |
|------|-------------|-------|
| `src/pages/Cards.tsx` | `useCreditCards()` → DB | ✅ Correct |
| `src/pages/CardDetail.tsx` | `useCreditCards()` → DB | ✅ Correct |
| `src/pages/Analyze.tsx` | `useCreditCards()` → DB | ✅ Correct |
| `src/pages/Recommend.tsx` | `useCreditCards()` → DB | ✅ Correct |
| `src/components/Hero.tsx` | `cardData.ts` (imports) | ⚠️ Uses deprecated file |
| `src/components/RecommendationResult.tsx` | `cardData.ts` (types) | ⚠️ Uses deprecated types |
| `src/lib/recommendationEngine.ts` | `cardData.ts` (imports) | ⚠️ Uses deprecated file |
| `src/lib/recommendationEngineV2.ts` | `useCreditCards` types → DB | ✅ Correct |

## What Wins at Runtime

For the **main recommendation flow** (`/analyze`, `/recommend`):
1. `recommendationEngineV2.ts` is used
2. It reads from `useCreditCards()` hook → Supabase `credit_cards` table
3. **Database is the source of truth** ✅

For the **legacy recommendation flow** (Hero component):
1. `recommendationEngine.ts` is used
2. It reads from `cardData.ts` static array
3. **WRONG DATA MAY BE SHOWN** ⚠️

## Resolution Required

1. ✅ Ensure all production paths use `recommendationEngineV2.ts` with DB data
2. ⚠️ Fix or remove `src/lib/cardData.ts` 
3. ⚠️ Update `src/components/Hero.tsx` to not use legacy engine
4. ✅ Verify Amex Gold shows $325 everywhere

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     SUPABASE DATABASE                        │
│  credit_cards table (annual_fee_cents = 32500 for Amex Gold) │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  useCreditCards() Hook                       │
│          src/hooks/useCreditCards.ts                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
          ┌───────────┴───────────┐
          ▼                       ▼
┌─────────────────────┐ ┌─────────────────────┐
│  Cards.tsx          │ │  recommendationV2   │
│  CardDetail.tsx     │ │  Analyze.tsx        │
│  Vault.tsx          │ │  Recommend.tsx      │
└─────────────────────┘ └─────────────────────┘
```
