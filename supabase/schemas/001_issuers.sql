-- Issuers Table
-- Represents issuing banks (canonical truth)
-- Execution order: 001

CREATE TABLE issuers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  website_url TEXT,
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_issuers_name ON issuers (name);

-- Comments
COMMENT ON TABLE issuers IS 'Canonical list of credit card issuing banks';
COMMENT ON COLUMN issuers.name IS 'Exact legal name of the issuer';
COMMENT ON COLUMN issuers.last_verified_at IS 'Last time this record was verified against official sources';
