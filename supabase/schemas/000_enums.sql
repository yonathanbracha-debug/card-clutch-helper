-- CardClutch Enums (Bank-Grade)
-- Execution order: 000 (must run first)
-- Spec: GLOBAL_BACKEND_SPECIFICATION.md

-- Card network types
CREATE TYPE card_network AS ENUM (
  'visa',
  'mastercard',
  'amex',
  'discover'
);

-- Card product types
CREATE TYPE product_type AS ENUM (
  'credit',
  'charge',
  'hybrid'
);

-- Reward currency types
CREATE TYPE reward_currency AS ENUM (
  'points',
  'cashback',
  'miles'
);

-- Reward cap periods
CREATE TYPE cap_period AS ENUM (
  'monthly',
  'quarterly',
  'yearly',
  'lifetime',
  'none'
);

-- Issuer verification methods
CREATE TYPE verification_method AS ENUM (
  'issuer_doc',
  'legal_filing'
);

-- Merchant verification status
CREATE TYPE verification_status AS ENUM (
  'verified',
  'inferred',
  'pending'
);

-- Merchant/data source types
CREATE TYPE verification_source AS ENUM (
  'manual',
  'issuer',
  'ai'
);

-- Category inference method types
CREATE TYPE inference_method AS ENUM (
  'ai',
  'heuristic'
);
