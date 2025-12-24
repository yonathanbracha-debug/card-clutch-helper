-- Merchant Exclusions Table (Explicit Disqualification)
-- Spec: Section 5.5
-- Execution order: 005
--
-- Example: Amex Gold → walmart.com → grocery exclusion

CREATE TABLE merchant_exclusions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
  merchant_domain TEXT NOT NULL,
  exclusion_reason TEXT NOT NULL,
  issuer_language TEXT,
  source_url TEXT NOT NULL,
  last_verified_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT merchant_exclusions_unique_card_merchant UNIQUE (card_id, merchant_domain),
  CONSTRAINT merchant_exclusions_domain_lowercase CHECK (merchant_domain = lower(merchant_domain)),
  CONSTRAINT merchant_exclusions_domain_not_empty CHECK (length(trim(merchant_domain)) > 0),
  CONSTRAINT merchant_exclusions_reason_not_empty CHECK (length(trim(exclusion_reason)) > 0),
  CONSTRAINT merchant_exclusions_source_url_not_empty CHECK (length(trim(source_url)) > 0)
);

-- Indexes
CREATE INDEX idx_merchant_exclusions_card_id ON merchant_exclusions (card_id);
CREATE INDEX idx_merchant_exclusions_merchant_domain ON merchant_exclusions (merchant_domain);
CREATE INDEX idx_merchant_exclusions_card_domain ON merchant_exclusions (card_id, merchant_domain);

-- Comments
COMMENT ON TABLE merchant_exclusions IS 'Explicit merchant exclusions per card - prevents incorrect reward assumptions';
COMMENT ON COLUMN merchant_exclusions.merchant_domain IS 'Lowercase domain (e.g., walmart.com, costco.com, target.com)';
COMMENT ON COLUMN merchant_exclusions.exclusion_reason IS 'Why excluded (e.g., "Does not code as grocery", "Warehouse club exclusion")';
COMMENT ON COLUMN merchant_exclusions.issuer_language IS 'Direct quote from cardmember agreement for legal defensibility';
