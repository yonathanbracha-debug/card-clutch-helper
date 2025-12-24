# 🔐 CARDCLUTCH — SUPABASE BACKEND MASTER PROMPT

> **FINAL, NO SHORTCUTS**

---

## YOUR ROLE (ABSOLUTE)

You are a principal backend engineer building a financially sensitive, correctness-critical system.
Your output will directly influence real-world credit decisions.

**A single incorrect assumption** (e.g., wrong annual fee, wrong category, missing exclusion) **is considered a critical production failure.**

You must therefore design defensive data models, explicit constraints, and future-proof mechanisms.

---

## PRIMARY GOAL

Create a production-grade Supabase backend that acts as the **single source of truth** for all credit card logic used by CardClutch.

This backend must:

- ✅ Guarantee accuracy over time
- ✅ Separate facts from inference
- ✅ Allow rules-first logic
- ✅ Allow AI assistance without authority
- ✅ Be auditable, explainable, and extensible

---

## HARD CONSTRAINTS (NO EXCEPTIONS)

- PostgreSQL only (Supabase)
- Declarative schema ONLY
- Schema files must live in: `supabase/schemas/`
- No hardcoded logic in frontend
- No magic defaults
- No implied rewards
- No guessed values
- No mixing AI output with canonical truth
- Every numeric value must be justified

---

## CORE PHILOSOPHY (DO NOT VIOLATE)

> If the system is unsure, it must say "unknown", not guess.

- AI can suggest. **Rules decide.**
- Every reward is contextual.
- There is no such thing as "4x" without "where, when, and under what exclusions".

---

## DATA MODEL — EXPLICIT ENTITIES (ALL REQUIRED)

You must create each table below as its own declarative SQL file, named with execution order in mind.

### 1️⃣ `issuers`

Represents issuing banks.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `name` | TEXT | unique, exact legal name |
| `website_url` | TEXT | |
| `last_verified_at` | TIMESTAMP | NOT NULL |

**Purpose:**
- Normalize issuer ownership
- Support future issuer-specific rules

---

### 2️⃣ `credit_cards` (CANONICAL TRUTH TABLE)

**This table must never contain inferred data.**

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `issuer_id` | FK | → issuers.id |
| `name` | TEXT | exact issuer name |
| `network` | ENUM | visa, mastercard, amex, discover |
| `annual_fee_cents` | INTEGER | REQUIRED, exact |
| `fee_waived_first_year` | BOOLEAN | |
| `currency` | TEXT | default USD |
| `discontinued` | BOOLEAN | |
| `effective_start_date` | DATE | |
| `effective_end_date` | DATE | nullable |
| `last_verified_at` | TIMESTAMP | |
| `source_url` | TEXT | OFFICIAL issuer page only |

**Rules:**
- Annual fee must be correct
- Example: Amex Gold = 25000 cents
- If unknown → record must not exist

---

### 3️⃣ `reward_categories`

Normalized categories. No overlap.

Examples (non-exhaustive):
- dining
- groceries
- travel
- gas
- transit
- streaming
- entertainment
- online_retail
- general_spend

| Field | Type |
|-------|------|
| `id` | UUID |
| `name` | TEXT |
| `description` | TEXT |

---

### 4️⃣ `card_reward_rules` (MOST CRITICAL TABLE)

This table defines exact earning behavior.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `card_id` | FK | |
| `category_id` | FK | |
| `multiplier` | NUMERIC | e.g. 4.0 |
| `cap_amount_cents` | INTEGER | nullable |
| `cap_period` | ENUM | monthly, yearly, lifetime, none |
| `requires_enrollment` | BOOLEAN | |
| `statement_credit` | BOOLEAN | |
| `notes` | TEXT | |
| `effective_start_date` | DATE | |
| `effective_end_date` | DATE | |
| `source_url` | TEXT | |
| `last_verified_at` | TIMESTAMP | |

**Rules:**
- No multiplier without category
- Caps must be explicit
- Exclusions handled elsewhere
- If issuer changes policy, new row is created

---

### 5️⃣ `merchant_exclusions`

Explicit merchant exclusions per card.

| Field | Type |
|-------|------|
| `id` | UUID |
| `card_id` | FK |
| `merchant_domain` | TEXT |
| `reason` | TEXT |
| `source_url` | TEXT |
| `last_verified_at` | TIMESTAMP |

**Examples — Amex Gold grocery exclusion:**
- walmart.com
- target.com
- costco.com

---

### 6️⃣ `merchants`

Known merchants only.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | |
| `name` | TEXT | |
| `domain` | TEXT | |
| `default_category_id` | FK | |
| `confidence_score` | NUMERIC | 0–1 |
| `verified` | BOOLEAN | |
| `source` | ENUM | manual, issuer, ai, user |
| `last_verified_at` | TIMESTAMP | |

---

### 7️⃣ `merchant_category_evaluations`

Tracks AI or heuristic guesses.

| Field | Type |
|-------|------|
| `id` | UUID |
| `merchant_domain` | TEXT |
| `suggested_category_id` | FK |
| `confidence_score` | NUMERIC |
| `method` | ENUM | ai, heuristic |
| `accepted` | BOOLEAN |
| `created_at` | TIMESTAMP |

**Rules:**
- These records NEVER override canonical rules
- Used only when merchant is unknown

---

### 8️⃣ `recommendation_audits`

Explains why a card was chosen.

| Field | Type |
|-------|------|
| `id` | UUID |
| `merchant_domain` | TEXT |
| `resolved_category` | TEXT |
| `winning_card_id` | FK |
| `reasoning` | TEXT |
| `confidence_score` | NUMERIC |
| `created_at` | TIMESTAMP |

**Purpose:**
- Debugging
- Trust
- Compliance
- Future explainability

---

## RULE ENGINE (BACKEND-READY LOGIC)

The backend must support this deterministic flow:

1. Normalize merchant domain
2. If merchant known → use verified category
3. Else → consult AI suggestion table (read-only)
4. Apply exclusions FIRST
5. Apply reward rules
6. Apply caps
7. Rank by:
   - Highest effective multiplier
   - No cap > capped
   - Lower annual fee
8. If confidence < threshold → fallback flat-rate card
9. Persist audit record

---

## AI INTEGRATION RULES (VERY IMPORTANT)

**AI is advisory only.**

### AI MAY:
- Suggest merchant category
- Suggest confidence score
- Propose new merchant entries

### AI MAY NOT alter:
- Annual fees
- Multipliers
- Exclusions
- Caps
- Issuer policies

### All AI output must be:
- Stored separately
- Marked unverified
- Reviewable

---

## DATA ACCURACY STRATEGY (MANDATORY)

Every card and rule must include:
- `source_url`
- `last_verified_at`

**When data becomes stale:**
- Flag for review
- Do NOT auto-update without verification

**Preferred sources:**
- Issuer official pages
- Cardmember agreements
- Issuer reward terms PDFs

---

## FAILURE MODES (YOU MUST DESIGN FOR THESE)

- Issuer silently changes rewards
- Merchant changes MCC behavior
- Conflicting category definitions
- Partial exclusions
- Temporary promos vs permanent rewards

**Your schema must allow:**
- Versioning
- Expiration
- Overlapping rule windows

---

## DELIVERABLES REQUIRED

You must produce:
- ✅ Complete declarative SQL schema files
- ✅ Correct Postgres enums
- ✅ Indexes for performance
- ✅ Referential integrity
- ✅ Clear separation of truth vs inference

**NO:**
- ❌ Frontend code
- ❌ Seed data unless explicitly requested
- ❌ Placeholder values

---

## FINAL VALIDATION CHECKLIST (DO NOT SKIP)

Before finishing, explicitly verify:

- [ ] Amex Gold annual fee = $250 (25000 cents)
- [ ] Grocery exclusions correctly modeled
- [ ] Sapphire Preferred multipliers category-specific
- [ ] Flat-rate fallback exists
- [ ] No "4x" or "5x" exists without category

**If ANY uncertainty exists, stop and flag.**

---

## END STATE

This backend should be capable of scaling to:

- Millions of users
- Thousands of cards
- The entire internet of merchants
- Regulatory scrutiny
- Enterprise partnerships

> **This is not a demo backend.**
> **This is infrastructure.**
