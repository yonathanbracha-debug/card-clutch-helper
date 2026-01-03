# Sprint: Trust + Metrics + Demo Conversion

## What Changed

### Part A: Schema Drift Fix
- Updated `supabase/schemas/003_credit_cards.sql` to match actual DB schema
- Created `docs/SCHEMA_HEALTH.md` documentation for preventing future drift

### Part B: Demo Mode (3 Free Analyses)
- Created `src/hooks/useDemoGate.ts` - manages demo analysis count in localStorage
- Created `src/components/DemoLimitModal.tsx` - modal shown when limit reached
- Updated `src/pages/Analyze.tsx` to integrate demo gating with banners and modal
- Demo users get 3 free analyses before being prompted to sign up

### Part C: Analytics Events + Founder Funnel
- Added `anon_id` column to `analytics_events` table for anonymous visitor tracking
- Created `src/hooks/usePageView.ts` for route-based page view tracking
- Updated `src/hooks/useAnalytics.ts` to include anon_id in all events
- Updated `src/components/admin/AdminDashboard.tsx` with:
  - Visitor counts (unique anon_id + user_id)
  - Demo analysis counts
  - Conversion funnel visualization
  - Data trust section showing cards missing critical fields

### Part D: Remove Hardcoded Claims
- Updated `src/components/CardInfoDrawer.tsx`:
  - Now shows actual foreign_tx_fee_percent from DB or "Not provided"
  - Links to terms_url when data is missing
  - Shows verified/unverified status clearly

### Part E: URL Health Check Edge Function
- Created `supabase/functions/url-health-check/index.ts` for server-side URL validation
- Added `card_url_health` table to store health check results
- Updated `src/components/admin/AdminUrlHealthChecker.tsx` to use edge function
- Admin can now check if card URLs are broken/redirecting

## How to Manually Test

### Demo Gating
1. Log out of any account
2. Go to `/analyze`
3. Analyze 3 different URLs - should see remaining count banner after each
4. Try to analyze a 4th URL - should see modal prompting signup
5. Click "Not now" - modal closes but analysis remains disabled
6. Sign in - should have unlimited analyses

### Analytics Events
1. Open browser console
2. Navigate between pages - check for page_view events in network tab
3. Run analyses - check for analyze_started, analyze_success events
4. Check `/admin` dashboard for:
   - Visitor count in last 7 days
   - Demo analyses count
   - Funnel metrics

### Admin Dashboard Numbers
1. Go to `/admin` as admin user
2. Verify KPI cards show correct numbers:
   - Total Users (from profiles table)
   - WAU (unique user_ids in analytics_events, last 7 days)
   - Total Recommendations
   - Data Health Score
3. Check "Data Trust" section shows cards missing:
   - image_url
   - terms_url
   - source_url
   - verified_at (stale data)

### URL Health Check
1. Go to `/admin` → URL Health tab
2. Click "Run Health Check" (uses edge function)
3. Wait for results to populate
4. Should see status for each card URL (ok/redirect/broken)
5. Broken URLs should show at top with error details

### Card Drawer Data Integrity
1. Go to `/cards`
2. Click on any card to open drawer
3. Verify:
   - Annual fee shows correctly
   - Foreign transaction fee shows actual value or "Not provided (see issuer terms)"
   - No hardcoded claims like "No foreign transaction fees"
   - Links to official terms when data missing

## Known Limitations

1. **Edge Function Rate Limits**: URL health checks are rate-limited; large catalogs may need batching
2. **Anon ID Persistence**: anon_id resets if user clears localStorage
3. **Conversion Funnel**: signup_completed event requires auth state change detection
4. **Demo Reset**: Only available in DEV mode via console

## Acceptance Checklist

- [x] Demo: 3 analyses then gate works
- [x] Analytics: events written with anon_id
- [x] Admin dashboard: funnel visible + correct date filtering
- [x] Card drawer: no hardcoded fee/perk claims
- [x] Schema: schemas reflect final DB state
- [x] URL health: edge function + results stored + admin UI displays
