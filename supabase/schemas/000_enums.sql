-- CardClutch Enums
-- Execution order: 000 (must run first)

-- Card network types
CREATE TYPE card_network AS ENUM (
  'visa',
  'mastercard',
  'amex',
  'discover'
);

-- Reward cap periods
CREATE TYPE cap_period AS ENUM (
  'monthly',
  'yearly',
  'lifetime',
  'none'
);

-- Merchant data source types
CREATE TYPE merchant_source AS ENUM (
  'manual',
  'issuer',
  'ai',
  'user'
);

-- Category evaluation method types
CREATE TYPE evaluation_method AS ENUM (
  'ai',
  'heuristic'
);
