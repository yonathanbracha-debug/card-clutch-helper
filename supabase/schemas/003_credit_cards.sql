-- Credit Cards Table (CANONICAL TRUTH)
-- Execution order: 003
-- 
-- CRITICAL: This is the source of truth for credit card metadata.
-- Updated to reflect actual production schema.

CREATE TABLE credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id UUID REFERENCES issuers(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  network card_network NOT NULL,
  annual_fee_cents INTEGER NOT NULL,
  reward_summary TEXT NOT NULL,
  image_url TEXT,
  terms_url TEXT,
  source_url TEXT NOT NULL,
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verification_status verification_status NOT NULL DEFAULT 'verified',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  slug TEXT,
  foreign_tx_fee_percent NUMERIC,
  credits_summary TEXT,
  
  -- Constraints
  CONSTRAINT credit_cards_annual_fee_non_negative CHECK (annual_fee_cents >= 0),
  CONSTRAINT credit_cards_name_not_empty CHECK (length(trim(name)) > 0),
  CONSTRAINT credit_cards_source_url_valid CHECK (is_valid_http_url(source_url)),
  CONSTRAINT credit_cards_terms_url_valid CHECK (is_valid_http_url(terms_url)),
  CONSTRAINT credit_cards_image_url_valid CHECK (is_valid_http_url(image_url))
);

-- Indexes
CREATE INDEX idx_credit_cards_issuer_id ON credit_cards (issuer_id);
CREATE INDEX idx_credit_cards_network ON credit_cards (network);
CREATE INDEX idx_credit_cards_is_active ON credit_cards (is_active) WHERE is_active = true;
CREATE INDEX idx_credit_cards_name ON credit_cards (name);
CREATE INDEX idx_credit_cards_slug ON credit_cards (slug);

-- Comments
COMMENT ON TABLE credit_cards IS 'CANONICAL TRUTH: Credit card records';
COMMENT ON COLUMN credit_cards.name IS 'Display name of the credit card product';
COMMENT ON COLUMN credit_cards.annual_fee_cents IS 'Annual fee in cents (e.g., Amex Gold = 32500)';
COMMENT ON COLUMN credit_cards.source_url IS 'Official issuer URL - required for audit trail';
COMMENT ON COLUMN credit_cards.terms_url IS 'Link to official card terms and conditions';
COMMENT ON COLUMN credit_cards.image_url IS 'URL to card image in storage';
COMMENT ON COLUMN credit_cards.last_verified_at IS 'Last verification against official source';
COMMENT ON COLUMN credit_cards.foreign_tx_fee_percent IS 'Foreign transaction fee percentage (NULL = unknown)';
COMMENT ON COLUMN credit_cards.credits_summary IS 'Summary of card credits/perks';
