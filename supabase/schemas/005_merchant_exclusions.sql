-- Merchant Exclusions Table
-- Explicit merchant exclusions per card (e.g., Amex Gold excludes Walmart for groceries)
-- Execution order: 005

CREATE TABLE merchant_exclusions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
  merchant_domain TEXT NOT NULL,
  reason TEXT NOT NULL,
  source_url TEXT NOT NULL,
  last_verified_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT merchant_exclusions_unique_card_merchant UNIQUE (card_id, merchant_domain),
  CONSTRAINT merchant_exclusions_domain_lowercase CHECK (merchant_domain = lower(merchant_domain))
);

-- Indexes
CREATE INDEX idx_merchant_exclusions_card_id ON merchant_exclusions (card_id);
CREATE INDEX idx_merchant_exclusions_merchant_domain ON merchant_exclusions (merchant_domain);

-- Comments
COMMENT ON TABLE merchant_exclusions IS 'Explicit merchant exclusions per card - prevents incorrect reward assumptions';
COMMENT ON COLUMN merchant_exclusions.merchant_domain IS 'Lowercase domain (e.g., walmart.com, costco.com)';
COMMENT ON COLUMN merchant_exclusions.reason IS 'Why this merchant is excluded (e.g., "Does not code as grocery")';
