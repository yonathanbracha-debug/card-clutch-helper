# CardClutch — Product Requirements Document (PRD)

> **Product**: CardClutch  
> **Owner**: Product Team  
> **Status**: Draft  
> **Last Updated**: December 2024

---

## 1. Executive Summary

### Product Vision

**One-sentence description**: CardClutch is a privacy-first credit card recommendation engine that tells users exactly which card to use before every purchase, based on verified reward structures and known exclusions.

**Target user**: First-time credit builders, students, and reward optimizers who want to maximize credit card value without complexity.

**Key differentiator**: Bank-grade accuracy with complete transparency—every recommendation is explainable, verifiable, and honest about uncertainty. No tracking, no affiliate deals, no selling data.

**Success definition**: Users consistently use the right card for every purchase, recovering 2-5% more value annually from their existing cards.

### Strategic Alignment

| Objective | Alignment |
|-----------|-----------|
| **Business** | Build trust through accuracy → premium tier conversion → sustainable revenue |
| **User** | Eliminate reward leakage from using the wrong card |
| **Market** | Fill gap between complex spreadsheets and unreliable "best card" listicles |
| **Competitive** | No competitor combines verified data + exclusion awareness + privacy-first |

### Resource Requirements

| Resource | Requirement |
|----------|-------------|
| **Development** | 2-3 engineers, 1 designer |
| **Timeline** | V1: 4 weeks, V2: 8 weeks, V3: 12 weeks |
| **Data** | 50+ verified cards at launch, scaling to 200+ |
| **Infrastructure** | Supabase (database, auth, edge functions) |

---

## 2. Problem Statement & Opportunity

### Problem Definition

**Core problem**: Credit card holders routinely use the wrong card for purchases, leaving money on the table.

| Pain Point | Impact |
|------------|--------|
| **Confusion** | Most users don't know their own cards' reward structures |
| **Hidden exclusions** | Cards advertise "4X groceries" but exclude Costco, Walmart, Target |
| **Category complexity** | Is Uber Eats "dining" or "delivery"? Depends on the issuer |
| **No real-time guidance** | Users must memorize rules or carry cheat sheets |
| **Mistrust** | Existing "best card" sites optimize for affiliate revenue, not user outcomes |

**Evidence**:
- Average household has 3.8 credit cards (Experian 2024)
- 61% of rewards go unredeemed (Bankrate)
- Grocery exclusions affect 80%+ of premium grocery cards
- Users report frustration with "I thought I was earning 4X" surprises

### Opportunity Analysis

| Dimension | Assessment |
|-----------|------------|
| **Market size** | 191M U.S. credit card holders, 500M+ cards in circulation |
| **Target segment** | 20M+ active reward optimizers + 40M first-gen credit builders |
| **Revenue model** | Freemium → Premium ($5-10/mo for wallet sync, history, optimization tips) |
| **Competitive gap** | No tool combines verified exclusions + real-time URL detection + privacy |

### Success Criteria

#### Primary Metrics

| Metric | Target | Timeline |
|--------|--------|----------|
| **Weekly Active Users (WAU)** | 10,000 | 6 months post-launch |
| **Recommendations per user** | 5+/week | 3 months |
| **Accuracy rate** | 99%+ | Ongoing |
| **User trust score** | 4.5+/5 | Survey-based |

#### Secondary Metrics

| Metric | Target |
|--------|--------|
| Wallet completion rate | 80%+ users add 2+ cards |
| Return user rate (7-day) | 40%+ |
| Premium conversion | 5% of active users |
| NPS | 50+ |

---

## 3. User Requirements & Stories

### Primary User Personas

#### Persona 1: "The Optimizing Student" (Primary)
- **Profile**: College student with 2-3 starter cards
- **Goals**: Maximize limited budget, build credit history
- **Pain points**: Doesn't understand exclusions, forgets which card for what
- **Success criteria**: Never misses a bonus category again

#### Persona 2: "The Overwhelmed Professional" (Primary)
- **Profile**: Working adult with 4-6 cards accumulated over years
- **Goals**: Use cards correctly without becoming a hobby
- **Pain points**: Too many rules to remember, no time to research
- **Success criteria**: Quick answer at checkout without mental load

#### Persona 3: "The Points Enthusiast" (Secondary)
- **Profile**: Experienced optimizer with 8+ cards
- **Goals**: Squeeze every point, track cap utilization
- **Pain points**: Existing tools are spreadsheets or affiliate-driven
- **Success criteria**: Trusted source of verified data, no hidden agendas

### User Journey: Current vs. Future

#### Current State (Without CardClutch)
```
Shopping at Target.com
    ↓
"Which card should I use?"
    ↓
Open spreadsheet / search online
    ↓
Find conflicting information
    ↓
Guess: "Amex Gold has 4X groceries"
    ↓
Use Amex Gold
    ↓
Earn 1X (Target excluded from grocery bonus)
    ↓
Frustration, missed rewards
```

#### Future State (With CardClutch)
```
Shopping at Target.com
    ↓
Paste URL into CardClutch
    ↓
CardClutch detects: Target.com → Excluded from grocery bonuses
    ↓
Recommendation: "Use Chase Freedom Unlimited (1.5X flat rate)"
    ↓
Confidence: HIGH (verified exclusion data)
    ↓
User uses correct card
    ↓
Earns maximum available rewards
```

### Core User Stories

#### Epic 1: Card Wallet Management

| Story | Acceptance Criteria |
|-------|---------------------|
| As a user, I want to add my credit cards to a wallet so the system knows what I have | - Search/select from 50+ cards<br>- Visual card thumbnails<br>- Persist across sessions<br>- Minimum 2 cards required for recommendations |
| As a user, I want to remove cards I no longer use | - One-click remove<br>- Confirmation dialog<br>- Immediate effect on recommendations |
| As a user, I want to mark a card as "don't recommend" temporarily | - Toggle switch per card<br>- Excluded from recommendations<br>- Still visible in wallet |

#### Epic 2: Purchase Recommendations

| Story | Acceptance Criteria |
|-------|---------------------|
| As a user, I want to paste a URL and get a card recommendation | - Accepts any URL format<br>- Extracts domain automatically<br>- Returns recommendation in <1 second |
| As a user, I want to see why a specific card was recommended | - Clear explanation text<br>- Category detected<br>- Multiplier shown<br>- Exclusions mentioned if applicable |
| As a user, I want to see confidence level for recommendations | - HIGH: Verified merchant data<br>- MEDIUM: Inferred category<br>- LOW: Unknown merchant, fallback |
| As a user, I want to see alternative cards ranked | - All wallet cards shown<br>- Ordered by effective return<br>- Exclusion warnings on affected cards |

#### Epic 3: Onboarding

| Story | Acceptance Criteria |
|-------|---------------------|
| As a new user, I want a guided onboarding so I know how to use the app | - 3-step wizard<br>- Progress indicator<br>- Can resume if abandoned<br>- Completed flag persisted |
| As a new user, I want to choose my goal (optimize vs. protect) | - Clear explanation of each mode<br>- Saved to preferences<br>- Affects recommendation tone |
| As a new user, I want to try a sample recommendation | - Pre-filled Amazon URL<br>- Interactive demo<br>- "See it work" moment |

#### Epic 4: Authentication

| Story | Acceptance Criteria |
|-------|---------------------|
| As a user, I want to sign in with email magic link | - Enter email only<br>- Receive link<br>- One-click login<br>- Session persists |
| As a user, I want my wallet saved when I return | - Wallet synced to account<br>- Load on sign-in<br>- No data loss |

---

## 4. Functional Requirements

### Core Features (Must Have — V1)

#### F1: Card Wallet
| Requirement | Specification |
|-------------|---------------|
| Card selection | Searchable dropdown with 50+ cards |
| Card display | Thumbnail, name, issuer, annual fee, reward summary |
| Persistence | Saved to user_cards table, synced on login |
| Minimum cards | Require 2+ cards for recommendations |
| Utilization status | Track low/medium/high usage per card |

#### F2: URL-Based Recommendation
| Requirement | Specification |
|-------------|---------------|
| URL input | Single text field, auto-clean URLs |
| Domain extraction | Normalize www, subdomains, paths |
| Merchant lookup | Check merchants table first |
| Category inference | Fallback to domain pattern matching |
| Recommendation logic | See [Decision Contract](#decision-contract) |
| Response time | <500ms for known merchants |

#### F3: Exclusion Handling
| Requirement | Specification |
|-------------|---------------|
| Exclusion database | merchant_exclusions table |
| Display | Clear warning when exclusion applies |
| Fallback | Auto-recommend next best non-excluded card |
| Verification | All exclusions must have source_url |

#### F4: Confidence Scoring
| Requirement | Specification |
|-------------|---------------|
| HIGH | Merchant verified, category confirmed |
| MEDIUM | Merchant unknown, category inferred from domain |
| LOW | Unknown merchant, using general fallback |
| Display | Visual indicator (badge/meter) |

#### F5: Authentication
| Requirement | Specification |
|-------------|---------------|
| Method | Email magic link only (no passwords) |
| Provider | Supabase Auth |
| Session | Persistent, 30-day refresh |
| Protected routes | /vault, /recommend (require login) |
| Public routes | /, /about, /roadmap, /cards, /cards/:id |

### Secondary Features (Should Have — V2)

#### F6: Browser Extension
| Requirement | Specification |
|-------------|---------------|
| Platforms | Chrome, Firefox, Edge |
| Detection | Auto-detect merchant on checkout pages |
| Display | Non-intrusive popup overlay |
| Privacy | No page content sent to servers |

#### F7: Recommendation History
| Requirement | Specification |
|-------------|---------------|
| Storage | recommendation_audit_log table |
| Display | Recent 10 recommendations on dashboard |
| Replay | Click to see full reasoning |

### Future Features (Could Have — V3)

#### F8: Sign-Up Bonus Tracking
- Track bonus progress per card
- Alert when close to meeting spend
- Opt-in only

#### F9: Annual Fee Analysis
- Calculate effective value of each card
- Suggest downgrades/upgrades
- Consider user spending patterns

---

## 5. Technical Requirements

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (React)                      │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │  Wallet  │ │ Recommend│ │   Cards  │ │   Auth   │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     Supabase (Backend)                       │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │
│  │   Auth   │ │ Database │ │   RLS    │ │  Edge Fn │       │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘       │
└─────────────────────────────────────────────────────────────┘
```

### Database Schema

#### Canonical Truth Tables (Read-Only)
| Table | Purpose | RLS |
|-------|---------|-----|
| issuers | Card issuer registry | Public read |
| reward_categories | Reward category taxonomy | Public read |
| credit_cards | Card product definitions | Public read |
| card_reward_rules | Reward earning rules | Public read |
| merchant_exclusions | Known exclusions | Public read |
| merchants | Verified merchant registry | Public read |

#### User Tables (Private)
| Table | Purpose | RLS |
|-------|---------|-----|
| profiles | User account metadata | Owner only |
| user_preferences | Mode, onboarding state | Owner only |
| user_cards | User's card wallet | Owner only |
| recommendation_audit_log | Recommendation history | Owner only |

### Decision Contract

The recommendation engine MUST follow this deterministic order:

1. **Normalize** merchant domain
2. **Resolve** merchant category:
   - Verified merchant → use stored category
   - Unknown → infer from domain patterns
3. **Filter** cards:
   - Only user's active cards
   - Check exclusions per card
4. **Apply** reward rules:
   - Match category exactly
   - Respect spending caps
5. **Rank** by:
   - Highest effective multiplier
   - Uncapped > capped
   - Lower annual fee as tiebreaker
6. **Flag** if confidence < threshold:
   - Use flat-rate fallback
   - Indicate uncertainty
7. **Persist** audit record

### Performance Requirements

| Metric | Target |
|--------|--------|
| Time to first recommendation | <500ms |
| Page load (LCP) | <2.5s |
| API response time | <200ms (p95) |
| Database query time | <50ms |
| Concurrent users | 1,000+ |

### Security Requirements

| Requirement | Implementation |
|-------------|----------------|
| Row-Level Security | All tables, no exceptions |
| Authentication | Supabase Auth, magic link |
| Data isolation | Users can only access own data |
| No tracking | No analytics on URLs or purchases |
| Client-side processing | Recommendation logic in browser |
| Source verification | All reward data has source_url |

---

## 6. User Experience Requirements

### Design Principles

1. **Clarity over cleverness**: Every recommendation must be instantly understandable
2. **Honest uncertainty**: Never pretend to know more than we do
3. **Privacy as a feature**: Make data protection visible and reassuring
4. **Progressive disclosure**: Simple answer first, details available on demand

### Key Screens

#### Home Page
- Hero: "Know the right card before you pay"
- CTA: "Get a Recommendation" / "Build My Wallet"
- How It Works: 3-step visual
- Privacy Promise: No tracking, client-side, no data sales

#### Vault (Card Wallet)
- Searchable card selector
- Visual card grid with thumbnails
- Annual fee and reward summary per card
- "Add Card" command palette

#### Recommend
- Large URL input field
- Prominent result card with recommendation
- Confidence indicator
- Alternative cards list with exclusion warnings
- Explanation text

#### Onboarding Modal
- Step 1: Choose mode (Optimize/Protect)
- Step 2: Add 2+ cards (searchable dropdown)
- Step 3: Try sample recommendation
- Progress indicator (1/3, 2/3, 3/3)
- Cannot dismiss until complete

### Accessibility Requirements

| Requirement | Standard |
|-------------|----------|
| WCAG compliance | AA minimum |
| Keyboard navigation | Full support |
| Screen reader | Semantic HTML, ARIA labels |
| Color contrast | 4.5:1 minimum |
| Focus indicators | Visible on all interactive elements |

---

## 7. Non-Functional Requirements

### Security

| Requirement | Specification |
|-------------|---------------|
| Authentication | Email magic link (Supabase Auth) |
| Authorization | RLS policies on all tables |
| Data encryption | TLS in transit, encrypted at rest |
| Session management | 30-day refresh tokens |
| Input validation | Sanitize all user inputs |

### Reliability

| Requirement | Target |
|-------------|--------|
| Uptime | 99.9% |
| Error rate | <0.1% of requests |
| Data backup | Daily |
| Disaster recovery | <4 hour RTO |

### Scalability

| Requirement | Specification |
|-------------|---------------|
| User growth | Support 10x growth without architecture changes |
| Data volume | 10M+ recommendations/month capacity |
| Geographic | Edge functions for low latency |

---

## 8. Success Metrics & Analytics

### Key Performance Indicators

| KPI | Definition | Target | Measurement |
|-----|------------|--------|-------------|
| **WAU** | Weekly active users | 10K (6mo) | Supabase Auth |
| **Recommendations/user** | Avg recommendations per active user per week | 5+ | recommendation_audit_log |
| **Wallet completion** | % users with 2+ cards | 80% | user_cards count |
| **7-day retention** | % users returning within 7 days | 40% | Session tracking |
| **Accuracy** | % recommendations with no user-reported errors | 99% | Feedback form |

### What We Will NOT Track

- Individual URLs or purchases
- Spending patterns
- Card usage frequency
- Personal financial data
- Third-party analytics (no GA, no Mixpanel)

---

## 9. Implementation Plan

### Phase 1: Foundation (V1) — Weeks 1-4

| Week | Deliverable |
|------|-------------|
| 1 | Database schema, RLS policies, auth setup |
| 2 | Card wallet UI, card data seeding |
| 3 | Recommendation engine, URL detection |
| 4 | Onboarding flow, polish, launch |

**V1 Scope**:
- 50+ verified cards
- URL-based recommendations
- Exclusion handling
- Magic link auth
- Onboarding wizard

### Phase 2: Extension (V2) — Weeks 5-12

| Week | Deliverable |
|------|-------------|
| 5-6 | Browser extension architecture |
| 7-8 | Chrome extension MVP |
| 9-10 | Firefox/Edge ports |
| 11-12 | Recommendation history, testing |

**V2 Scope**:
- Browser extension (Chrome, Firefox, Edge)
- Auto-detect merchant at checkout
- Recommendation history view
- 100+ verified cards

### Phase 3: Insights (V3) — Weeks 13-24

| Week | Deliverable |
|------|-------------|
| 13-16 | Sign-up bonus tracking (opt-in) |
| 17-20 | Annual fee value analysis |
| 21-24 | Premium tier, monetization |

**V3 Scope**:
- Bonus progress tracking
- Fee optimization suggestions
- Premium subscription ($5-10/mo)
- 200+ verified cards

---

## 10. Risk Assessment & Mitigation

### Technical Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Data accuracy | Medium | High | Source verification, regular audits |
| Merchant detection failures | Medium | Medium | Graceful fallback, confidence indicators |
| Performance issues | Low | Medium | Edge functions, caching, lazy loading |
| Auth complexity | Low | High | Use Supabase managed auth |

### Business Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| User trust erosion | Low | Critical | Transparency, no affiliate deals |
| Issuer terms changes | High | Medium | Staleness detection, verification dates |
| Competition | Medium | Medium | Focus on accuracy differentiator |
| Monetization challenges | Medium | High | Freemium model, validated premium features |

### Data Risks

| Risk | Probability | Impact | Mitigation |
|------|-------------|--------|------------|
| Stale reward data | High | High | Verification dates, staleness alerts |
| Missing exclusions | Medium | High | Conservative defaults, user feedback loop |
| Category misclassification | Medium | Medium | Confidence scoring, manual verification |

---

## Appendix A: Card Data Verification Standards

Every card in the system MUST have:

| Field | Requirement |
|-------|-------------|
| Official product name | Matches issuer materials |
| Annual fee | In cents, verified against terms |
| Reward categories | Explicit list, not inferred |
| Multipliers | Numeric, verified against disclosures |
| Exclusions | Explicit list with source URLs |
| Spending caps | Amount and period, if applicable |
| Conditions | Activation, enrollment, portal requirements |
| Last verified date | Within 90 days |
| Source URL | Direct link to issuer terms |

---

## Appendix B: Glossary

| Term | Definition |
|------|------------|
| **Multiplier** | Reward earning rate (e.g., 4X = 4 points per dollar) |
| **Exclusion** | Merchant or category specifically excluded from bonus |
| **Cap** | Maximum spend eligible for bonus rate |
| **Confidence** | System certainty in merchant categorization |
| **Wallet** | User's collection of cards in the app |
| **Canonical truth** | Verified data from issuer documents |
| **Inference** | Unverified guess based on patterns |

---

## Quality Checklist

- [x] Problem is clearly defined with evidence
- [x] Solution aligns with user needs and business goals
- [x] Requirements are specific and measurable
- [x] Acceptance criteria are testable
- [x] Technical feasibility is validated
- [x] Success metrics are defined and trackable
- [x] Risks are identified with mitigation plans
- [ ] Stakeholder alignment is confirmed (pending review)

---

**Document History**

| Version | Date | Author | Changes |
|---------|------|--------|---------|
| 0.1 | Dec 2024 | Product Team | Initial draft |
