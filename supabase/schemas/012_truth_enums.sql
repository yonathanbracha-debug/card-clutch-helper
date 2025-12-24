-- CardClutch Truth Engine: Extended Enums
-- Execution order: 012
-- Spec: GLOBAL_BACKEND_SPECIFICATION.md Section 1
--
-- IMPORTANT: These extend the base enums in 000_enums.sql
-- Do NOT rename or drop existing enums

-- Source type for provenance tracking
CREATE TYPE source_type AS ENUM (
  'issuer_terms',
  'issuer_pricing', 
  'issuer_rewards',
  'issuer_faq',
  'network_rules',
  'partner_terms',
  'third_party_reference',
  'manual_note'
);

-- Entity type for polymorphic references
CREATE TYPE entity_type AS ENUM (
  'issuer',
  'card',
  'merchant',
  'rule',
  'exclusion',
  'category',
  'domain',
  'alias',
  'brand'
);

-- Change action for audit log
CREATE TYPE change_action AS ENUM (
  'insert',
  'expire',
  'verify',
  'approve',
  'deprecate',
  'dispute',
  'reject'
);

-- Domain match type for merchant resolution
CREATE TYPE match_type AS ENUM (
  'exact',
  'suffix',
  'contains',
  'regex'
);

-- Rule type for reward expressiveness
CREATE TYPE rule_type AS ENUM (
  'multiplier',
  'flat_rate',
  'cap_bonus',
  'statement_credit',
  'portal_bonus',
  'intro_offer',
  'rotating_category'
);

-- Extended cap period (adds transaction-level and daily)
CREATE TYPE cap_period_extended AS ENUM (
  'per_transaction',
  'daily',
  'monthly',
  'quarterly',
  'yearly',
  'lifetime',
  'none'
);

-- Payment method restrictions
CREATE TYPE payment_method AS ENUM (
  'any',
  'apple_pay',
  'google_pay',
  'paypal',
  'issuer_wallet',
  'online_only',
  'in_store_only'
);

-- Rule scope for cap tracking
CREATE TYPE rule_scope AS ENUM (
  'per_card',
  'per_account',
  'per_user'
);

-- Confidence level for recommendations
CREATE TYPE confidence_level AS ENUM (
  'high',
  'medium',
  'low',
  'unknown'
);

-- Comments
COMMENT ON TYPE source_type IS 'Classification of source documents for provenance';
COMMENT ON TYPE entity_type IS 'Entity types for polymorphic entity_sources';
COMMENT ON TYPE change_action IS 'Actions tracked in canonical_change_log';
COMMENT ON TYPE match_type IS 'How merchant domains are matched';
COMMENT ON TYPE rule_type IS 'Types of reward rules beyond simple multipliers';
COMMENT ON TYPE payment_method IS 'Payment method restrictions on rules';
COMMENT ON TYPE rule_scope IS 'Scope at which caps are tracked';
