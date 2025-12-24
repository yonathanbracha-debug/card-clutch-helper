-- Credit Cards Table (CANONICAL TRUTH - IMMUTABLE FACTS ONLY)
-- Spec: Section 5.2
-- Execution order: 003
-- 
-- CRITICAL: This table stores ONLY immutable facts
-- Fee changes require NEW ROW, never modify history
-- Example: Amex Gold = 25000 cents

CREATE TABLE credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id UUID NOT NULL REFERENCES issuers(id) ON DELETE RESTRICT,
  official_product_name TEXT NOT NULL,
  network card_network NOT NULL,
  annual_fee_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  first_year_fee_waived BOOLEAN NOT NULL DEFAULT false,
  product_type product_type NOT NULL DEFAULT 'credit',
  discontinued BOOLEAN NOT NULL DEFAULT false,
  effective_start_date DATE,
  effective_end_date DATE,
  source_url TEXT NOT NULL,
  last_verified_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT credit_cards_annual_fee_non_negative CHECK (annual_fee_cents >= 0),
  CONSTRAINT credit_cards_name_not_empty CHECK (length(trim(official_product_name)) > 0),
  CONSTRAINT credit_cards_source_url_not_empty CHECK (length(trim(source_url)) > 0),
  CONSTRAINT credit_cards_valid_date_range CHECK (
    effective_end_date IS NULL OR 
    effective_start_date IS NULL OR 
    effective_end_date >= effective_start_date
  ),
  CONSTRAINT credit_cards_unique_product_version UNIQUE (
    issuer_id, 
    official_product_name, 
    effective_start_date
  )
);

-- Indexes
CREATE INDEX idx_credit_cards_issuer_id ON credit_cards (issuer_id);
CREATE INDEX idx_credit_cards_network ON credit_cards (network);
CREATE INDEX idx_credit_cards_product_type ON credit_cards (product_type);
CREATE INDEX idx_credit_cards_active ON credit_cards (discontinued, effective_end_date) 
  WHERE discontinued = false AND (effective_end_date IS NULL OR effective_end_date >= CURRENT_DATE);
CREATE INDEX idx_credit_cards_name ON credit_cards (official_product_name);
CREATE INDEX idx_credit_cards_annual_fee ON credit_cards (annual_fee_cents);

-- Comments
COMMENT ON TABLE credit_cards IS 'CANONICAL TRUTH: Immutable credit card records - NO inferred data, NO modifications to history';
COMMENT ON COLUMN credit_cards.official_product_name IS 'Exact product name as listed by issuer';
COMMENT ON COLUMN credit_cards.annual_fee_cents IS 'Annual fee in cents - must be exact (e.g., Amex Gold = 25000)';
COMMENT ON COLUMN credit_cards.source_url IS 'Official issuer URL - required for audit trail';
COMMENT ON COLUMN credit_cards.last_verified_at IS 'Last verification against official source - triggers staleness alerts';
COMMENT ON COLUMN credit_cards.effective_start_date IS 'When this card version became active';
COMMENT ON COLUMN credit_cards.effective_end_date IS 'When this card version was superseded (NULL = current)';
