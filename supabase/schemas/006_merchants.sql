-- Merchants Table (Known Merchant Registry)
-- Spec: Section 5.6
-- Execution order: 006

CREATE TABLE merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canonical_name TEXT NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  default_category_id UUID REFERENCES reward_categories(id) ON DELETE SET NULL,
  verification_status verification_status NOT NULL DEFAULT 'pending',
  verification_source verification_source NOT NULL,
  confidence_score NUMERIC(3,2) NOT NULL DEFAULT 0.00,
  last_verified_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT merchants_domain_lowercase CHECK (domain = lower(domain)),
  CONSTRAINT merchants_domain_not_empty CHECK (length(trim(domain)) > 0),
  CONSTRAINT merchants_name_not_empty CHECK (length(trim(canonical_name)) > 0),
  CONSTRAINT merchants_confidence_range CHECK (confidence_score >= 0 AND confidence_score <= 1),
  CONSTRAINT merchants_verified_has_date CHECK (
    verification_status != 'verified' OR last_verified_at IS NOT NULL
  ),
  CONSTRAINT merchants_verified_has_category CHECK (
    verification_status != 'verified' OR default_category_id IS NOT NULL
  )
);

-- Indexes
CREATE INDEX idx_merchants_domain ON merchants (domain);
CREATE INDEX idx_merchants_category_id ON merchants (default_category_id);
CREATE INDEX idx_merchants_verification_status ON merchants (verification_status);
CREATE INDEX idx_merchants_verified ON merchants (verification_status, confidence_score DESC) 
  WHERE verification_status = 'verified';
CREATE INDEX idx_merchants_pending ON merchants (created_at DESC) 
  WHERE verification_status = 'pending';

-- Comments
COMMENT ON TABLE merchants IS 'Known merchant registry - only verified merchants inform recommendations';
COMMENT ON COLUMN merchants.canonical_name IS 'Official business name of the merchant';
COMMENT ON COLUMN merchants.domain IS 'Lowercase domain - primary lookup key';
COMMENT ON COLUMN merchants.verification_status IS 'verified = human-confirmed, inferred = AI-suggested, pending = needs review';
COMMENT ON COLUMN merchants.verification_source IS 'How this merchant was added (manual, issuer, ai)';
COMMENT ON COLUMN merchants.confidence_score IS 'Category assignment confidence (0-1) - low scores require review';
