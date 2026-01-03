# Recommendation Flow Trace

## Last Updated: 2026-01-03

## Summary

There are **TWO** recommendation engines in the codebase:

| Engine | File | Status | Data Source |
|--------|------|--------|-------------|
| V1 (Legacy) | `src/lib/recommendationEngine.ts` | ⚠️ Deprecated | `cardData.ts` (static) |
| V2 (Current) | `src/lib/recommendationEngineV2.ts` | ✅ Active | Supabase DB |

## Main Recommendation Flow (V2)

### Input
- URL string from user input
- Selected card IDs from wallet

### Step 1: URL Validation
- File: `src/lib/urlSafety.ts`
- Function: `validateUrl(url)`
- Rejects: `javascript:`, `data:`, empty, too long (>2048)
- Normalizes: domain extraction

### Step 2: Domain Extraction
- File: `src/lib/recommendationEngineV2.ts`
- Function: `extractDomain(url)` → uses `validateUrl()`
- Returns: sanitized domain or null

### Step 3: Merchant Lookup
- File: `src/lib/recommendationEngineV2.ts`
- Data: `merchantMappings[]` (hardcoded array, ~40 merchants)
- Lookup: `merchantMappings.find(m => domain.includes(m.domain))`

### Step 4: Category Inference
If merchant found:
- Use `merchant.category`
- Confidence: `high`

If merchant NOT found:
- Call `inferCategoryFromDomain(domain)`
- Uses regex patterns (dining, groceries, travel, etc.)
- Confidence: `medium` or `low`

### Step 5: Card Analysis
For each user card:
1. Get card rules from `card_reward_rules` table
2. Get exclusions from `merchant_exclusions` table
3. Calculate effective multiplier via `getCardMultiplierFromRules()`
4. Check for exclusions (warehouse clubs, specific merchants)
5. Apply fallback logic (flights→travel, hotels→travel, etc.)

### Step 6: Ranking
Sort cards by:
1. Non-excluded first
2. Highest multiplier
3. Lowest annual fee (tiebreaker)

### Step 7: Output
```typescript
interface Recommendation {
  card: CreditCardDB;          // Recommended card
  merchant: MerchantMapping;   // Detected merchant
  category: MerchantCategory;  // groceries, dining, etc.
  categoryLabel: string;       // "Groceries"
  multiplier: number;          // 4
  reason: string;              // Explanation
  confidence: 'high' | 'medium' | 'low';
  alternatives: CardAnalysis[]; // Other cards ranked
}
```

## Fallback Behavior When Unknown

1. **Domain not in merchant mappings:**
   - Inference via regex patterns on domain name
   - Example: `pizzahut.com` → "pizza" pattern → `dining`
   - Confidence: `medium`

2. **No pattern match:**
   - Category: `general`
   - Confidence: `low`
   - Recommendation: Highest base-rate card

3. **URL validation fails:**
   - Return `null` (no recommendation)
   - UI shows error message

## Files Involved

| File | Purpose |
|------|---------|
| `src/lib/urlSafety.ts` | URL validation & sanitization |
| `src/lib/recommendationEngineV2.ts` | Main recommendation logic |
| `src/hooks/useCreditCards.ts` | Fetch cards from DB |
| `src/hooks/useCardRewardRules.ts` | Fetch reward rules from DB |
| `src/hooks/useMerchantExclusions.ts` | Fetch exclusions from DB |
| `src/lib/merchantIntelligence.ts` | Advanced merchant resolution (AI fallback) |
| `src/lib/merchantRegistry.ts` | Extended merchant registry (500+ domains) |
| `src/lib/merchantHeuristics.ts` | URL pattern heuristics |

## Merchant Intelligence System

### Resolution Hierarchy
1. **Approved Overrides** (`src/lib/merchantOverrides.ts`) - Admin-approved mappings
2. **Curated Registry** (`src/lib/merchantRegistry.ts`) - 500+ hardcoded domains
3. **Heuristic Fallback** (`src/lib/merchantHeuristics.ts`) - URL patterns
4. **AI Fallback** (`src/lib/ai/merchantClassifier.ts`) - Only for unknown domains

### AI Usage
- Called ONLY when domain is unknown AND heuristics confidence is low
- Results go to review queue (not auto-applied)
- Pending suggestions shown to admin for approval

## Security Considerations

1. **URL Validation:** Rejects dangerous schemes (javascript:, data:, file:, etc.)
2. **Domain Normalization:** Strips www., extracts hostname
3. **No Raw HTML:** All merchant names sanitized before display
4. **RLS on DB tables:** Users can only read public card data

## Performance

- Merchant lookup: O(n) over ~40 mappings (could be optimized to Map)
- Card analysis: O(cards × rules × exclusions)
- Typical latency: <100ms client-side
