-- Credit Cards Table (CANONICAL TRUTH)
-- This table must NEVER contain inferred data
-- Execution order: 003

CREATE TABLE credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  network card_network NOT NULL,
  annual_fee_cents INTEGER NOT NULL,
  fee_waived_first_year BOOLEAN NOT NULL DEFAULT false,
  currency TEXT NOT NULL DEFAULT 'USD',
  discontinued BOOLEAN NOT NULL DEFAULT false,
  effective_start_date DATE,
  effective_end_date DATE,
  last_verified_at TIMESTAMPTZ NOT NULL,
  source_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT credit_cards_annual_fee_positive CHECK (annual_fee_cents >= 0),
  CONSTRAINT credit_cards_unique_issuer_name UNIQUE (issuer_id, name),
  CONSTRAINT credit_cards_valid_date_range CHECK (
    effective_end_date IS NULL OR effective_start_date IS NULL OR effective_end_date >= effective_start_date
  )
);

-- Indexes
CREATE INDEX idx_credit_cards_issuer_id ON credit_cards (issuer_id);
CREATE INDEX idx_credit_cards_network ON credit_cards (network);
CREATE INDEX idx_credit_cards_discontinued ON credit_cards (discontinued) WHERE discontinued = false;
CREATE INDEX idx_credit_cards_name ON credit_cards (name);

-- Comments
COMMENT ON TABLE credit_cards IS 'Canonical credit card definitions - NO inferred data allowed';
COMMENT ON COLUMN credit_cards.annual_fee_cents IS 'Annual fee in cents (e.g., Amex Gold = 25000)';
COMMENT ON COLUMN credit_cards.source_url IS 'Official issuer page URL - required for verification';
COMMENT ON COLUMN credit_cards.last_verified_at IS 'Last verification timestamp - must be kept current';
