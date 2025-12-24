-- Merchants Table
-- Known merchants with verified category assignments
-- Execution order: 006

CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  default_category_id UUID REFERENCES reward_categories(id) ON DELETE SET NULL,
  confidence_score NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  verified BOOLEAN NOT NULL DEFAULT false,
  source merchant_source NOT NULL,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT merchants_domain_lowercase CHECK (domain = lower(domain)),
  CONSTRAINT merchants_confidence_range CHECK (confidence_score >= 0 AND confidence_score <= 1),
  CONSTRAINT merchants_verified_has_date CHECK (
    (verified = false) OR (verified = true AND last_verified_at IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_merchants_domain ON merchants (domain);
CREATE INDEX idx_merchants_category_id ON merchants (default_category_id);
CREATE INDEX idx_merchants_verified ON merchants (verified) WHERE verified = true;
CREATE INDEX idx_merchants_source ON merchants (source);

-- Comments
COMMENT ON TABLE merchants IS 'Known merchants with category assignments - only verified data informs recommendations';
COMMENT ON COLUMN merchants.confidence_score IS 'Category assignment confidence (0-1) - low scores require manual review';
COMMENT ON COLUMN merchants.source IS 'How this merchant was added - affects trust level';
