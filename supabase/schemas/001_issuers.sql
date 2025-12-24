-- Issuers Table (Legal Authority Boundary)
-- Spec: Section 5.1
-- Execution order: 001

CREATE TABLE issuers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name TEXT NOT NULL UNIQUE,
  brand_name TEXT,
  regulatory_region TEXT,
  primary_website TEXT,
  terms_base_url TEXT,
  verification_method verification_method NOT NULL,
  last_verified_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT issuers_legal_name_not_empty CHECK (length(trim(legal_name)) > 0)
);

-- Indexes
CREATE INDEX idx_issuers_legal_name ON issuers (legal_name);
CREATE INDEX idx_issuers_brand_name ON issuers (brand_name);
CREATE INDEX idx_issuers_regulatory_region ON issuers (regulatory_region);

-- Comments
COMMENT ON TABLE issuers IS 'Legal authority boundary - represents issuing financial institutions';
COMMENT ON COLUMN issuers.legal_name IS 'Exact legal name as filed with regulators - UNIQUE, immutable';
COMMENT ON COLUMN issuers.brand_name IS 'Consumer-facing brand name if different from legal name';
COMMENT ON COLUMN issuers.terms_base_url IS 'Base URL for cardmember agreements and terms';
COMMENT ON COLUMN issuers.verification_method IS 'How this issuer was verified (issuer_doc or legal_filing)';
