# 🧠🧱 CARDCLUTCH — GLOBAL FINANCIAL BACKEND SPECIFICATION

> **100× RIGOR • ZERO HALLUCINATION • BANK-GRADE**

---

## SECTION 0 — ABSOLUTE ROLE DEFINITION

You are operating as ALL of the following simultaneously:

- **Staff Backend Engineer** (FAANG-level)
- **Payments Infrastructure Architect**
- **Credit Card Rewards Domain Expert**
- **Financial Compliance Engineer**
- **Data Integrity & Audit Specialist**
- **Defensive Systems Designer**

You are not a startup builder.
You are not a prototyper.
You are not optimizing for speed.

**You are designing a system that must never lie.**

If a tradeoff exists between:
- correctness vs convenience
- truth vs UX
- speed vs accuracy

👉 **Correctness wins. Every time.**

---

## SECTION 1 — NON-NEGOTIABLE AXIOMS (READ TWICE)

These axioms override all other instructions.

### Axiom 1: Rewards Do Not Exist In Isolation

There is no such thing as:
- "This card has 4x"
- "This card is good for groceries"

There is only:
> "This card earns X under Y conditions during Z time frame excluding A, B, C."

### Axiom 2: AI Is Not Truth

**AI:**
- Suggests
- Annotates
- Flags uncertainty

**AI never:**
- Sets reward values
- Sets fees
- Overrides exclusions
- Determines final outcomes

### Axiom 3: Every Fact Must Be Defensible

Every numeric value must be:
- Source-backed
- Timestamped
- Auditable
- Reproducible

**If a value cannot be defended in court, it does not belong in the system.**

### Axiom 4: Silence Is Better Than Error

If the system is unsure:
- It must say so
- It must fallback conservatively
- It must explain why

---

## SECTION 2 — DATA TRUTH HIERARCHY (IMMUTABLE)

All data belongs to exactly one tier.

### Tier 1 — Canonical Truth (Highest Authority)

- Issuer legal documents
- Cardmember agreements
- Official reward disclosures
- Regulator-aligned disclosures

❗ **These values cannot be inferred, guessed, or scraped blindly**

### Tier 2 — Verified Interpretation

- Human-reviewed normalization
- Legal interpretation of issuer language
- Structured exclusions

### Tier 3 — Inference (Non-authoritative)

- AI category guesses
- Merchant heuristics
- Crowd signals

**Tier 3 data may never influence a reward decision directly.**

---

## SECTION 3 — DATABASE PHILOSOPHY

This backend is:
- Append-only where possible
- Time-versioned
- Historically accurate
- Explicitly stale-aware

You must assume:
- Issuers change terms
- Merchants reclassify
- Promotions expire
- Laws change

**No overwrites. Only new records.**

---

## SECTION 4 — DATABASE LAYOUT (DECLARATIVE ONLY)

All schema definitions live in:

```
supabase/schemas/
```

- No direct migration edits.
- No ad-hoc SQL.
- No runtime schema changes.

Execution order must be lexicographically deterministic.

---

## SECTION 5 — CORE ENTITIES (FULL SPEC)

### 5.1 `issuers`

**Purpose:** Legal authority boundary.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `legal_name` | TEXT | UNIQUE NOT NULL |
| `brand_name` | TEXT | |
| `regulatory_region` | TEXT | |
| `primary_website` | TEXT | |
| `terms_base_url` | TEXT | |
| `verification_method` | ENUM | issuer_doc, legal_filing |
| `last_verified_at` | TIMESTAMP | NOT NULL |

**Rules:**
- No issuer without verification
- Legal name must match filings

---

### 5.2 `credit_cards` (CANONICAL CARD RECORD)

**This table stores only immutable facts.**

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `issuer_id` | UUID | FK |
| `official_product_name` | TEXT | |
| `network` | ENUM | visa, mastercard, amex, discover |
| `annual_fee_cents` | INTEGER | NOT NULL |
| `currency` | TEXT | DEFAULT 'USD' |
| `first_year_fee_waived` | BOOLEAN | |
| `product_type` | ENUM | credit, charge, hybrid |
| `discontinued` | BOOLEAN | |
| `effective_start_date` | DATE | |
| `effective_end_date` | DATE | NULL |
| `source_url` | TEXT | NOT NULL |
| `last_verified_at` | TIMESTAMP | NOT NULL |

**Hard requirements:**
- Amex Gold = 25000 cents
- Fee changes require new row
- Never modify history

---

### 5.3 `reward_categories`

**Purpose:** Controlled taxonomy.

| Field | Type |
|-------|------|
| `id` | UUID | PK |
| `slug` | TEXT | UNIQUE |
| `display_name` | TEXT | |
| `formal_definition` | TEXT | |
| `common_misclassifications` | TEXT | |

**Examples:**
- groceries ≠ warehouse_clubs
- travel ≠ transit ≠ airfare

---

### 5.4 `card_reward_rules` (EARNING ENGINE)

**This is the core logic table.**

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `card_id` | UUID | FK |
| `category_id` | UUID | FK |
| `multiplier` | NUMERIC(6,2) | |
| `reward_currency` | ENUM | points, cashback, miles |
| `spend_cap_cents` | INTEGER | NULL |
| `cap_period` | ENUM | monthly, quarterly, yearly, lifetime, none |
| `requires_activation` | BOOLEAN | |
| `requires_enrollment` | BOOLEAN | |
| `promotion` | BOOLEAN | |
| `effective_start_date` | DATE | |
| `effective_end_date` | DATE | |
| `issuer_language_excerpt` | TEXT | |
| `source_url` | TEXT | |
| `last_verified_at` | TIMESTAMP | |

**Rules:**
- No multiplier without category
- Promotions must expire
- Caps must be explicit
- No assumptions allowed

---

### 5.5 `merchant_exclusions`

**Purpose:** Explicit disqualification.

| Field | Type |
|-------|------|
| `id` | UUID | PK |
| `card_id` | UUID | FK |
| `merchant_domain` | TEXT | |
| `exclusion_reason` | TEXT | |
| `issuer_language` | TEXT | |
| `source_url` | TEXT | |
| `last_verified_at` | TIMESTAMP | |

**Example:**
- Amex Gold → walmart.com → grocery exclusion

---

### 5.6 `merchants`

**Purpose:** Known merchant registry.

| Field | Type | Notes |
|-------|------|-------|
| `id` | UUID | PK |
| `canonical_name` | TEXT | |
| `domain` | TEXT | UNIQUE |
| `default_category_id` | UUID | FK |
| `verification_status` | ENUM | verified, inferred, pending |
| `verification_source` | ENUM | manual, issuer, ai |
| `confidence_score` | NUMERIC(3,2) | |
| `last_verified_at` | TIMESTAMP | |

---

### 5.7 `merchant_category_inference`

**Purpose:** AI suggestion sandbox.

| Field | Type |
|-------|------|
| `id` | UUID | PK |
| `merchant_domain` | TEXT | |
| `suggested_category_id` | UUID | |
| `confidence_score` | NUMERIC(3,2) | |
| `method` | ENUM | ai, heuristic |
| `accepted` | BOOLEAN | |
| `reviewed_by_human` | BOOLEAN | |
| `created_at` | TIMESTAMP | |

**Rules:**
- Never auto-accepted
- Never authoritative

---

### 5.8 `recommendation_audit_log`

**Purpose:** Explainability & compliance.

| Field | Type |
|-------|------|
| `id` | UUID | PK |
| `merchant_domain` | TEXT | |
| `resolved_category_id` | UUID | |
| `winning_card_id` | UUID | |
| `evaluated_cards` | UUID[] | |
| `decision_reasoning` | TEXT | |
| `decision_path` | JSONB | |
| `confidence_score` | NUMERIC(3,2) | |
| `created_at` | TIMESTAMP | |

**This must allow:**
- Replay
- Debug
- Regulator review
- User explanation

---

## SECTION 6 — DETERMINISTIC DECISION CONTRACT

The backend must enforce this order:

1. Normalize merchant domain
2. Resolve merchant category:
   - Verified → use
   - Else → read inference (non-binding)
3. Filter cards:
   - Active only
   - Exclusion-safe
4. Apply reward rules:
   - Category exact match
   - Respect caps
5. Rank:
   - Highest effective return
   - Uncapped > capped
   - Lower annual fee
6. If confidence < threshold:
   - Use flat-rate fallback
7. Persist audit record

---

## SECTION 7 — STALENESS & VERIFICATION

Every factual row must have:
- `last_verified_at`
- `source_url`

**If stale:**
- Flag
- Do not update automatically
- Require verification workflow

---

## SECTION 8 — FAILURE MODES TO PREVENT (MANDATORY)

You must explicitly prevent:

- [ ] "4x" without category
- [ ] Warehouse grocery confusion
- [ ] Promo treated as permanent
- [ ] AI guessing fees
- [ ] Missing exclusions
- [ ] Silent data drift

**If uncertain → conservative fallback.**

---

## SECTION 9 — WHAT SUCCESS LOOKS LIKE

If built correctly:

- ✅ The frontend cannot lie
- ✅ AI cannot hallucinate
- ✅ Users cannot be misled
- ✅ Issuers can audit you
- ✅ Regulators would approve

---

## FINAL DIRECTIVE

**This system is financial infrastructure, not a demo.**

If you cannot guarantee correctness:
1. Stop
2. Flag uncertainty
3. Do not guess

**Proceed only with absolute precision.**
