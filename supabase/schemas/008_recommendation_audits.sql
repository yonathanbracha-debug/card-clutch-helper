-- Recommendation Audits Table
-- Explains why a card was chosen (debugging, trust, compliance)
-- Execution order: 008

CREATE TABLE recommendation_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_domain TEXT NOT NULL,
  resolved_category TEXT NOT NULL,
  winning_card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL,
  reasoning TEXT NOT NULL,
  confidence_score NUMERIC(3,2) NOT NULL,
  fallback_used BOOLEAN NOT NULL DEFAULT false,
  exclusions_applied TEXT[],
  alternatives_considered JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT audits_domain_lowercase CHECK (merchant_domain = lower(merchant_domain)),
  CONSTRAINT audits_confidence_range CHECK (confidence_score >= 0 AND confidence_score <= 1)
);

-- Indexes
CREATE INDEX idx_audits_merchant_domain ON recommendation_audits (merchant_domain);
CREATE INDEX idx_audits_winning_card_id ON recommendation_audits (winning_card_id);
CREATE INDEX idx_audits_created_at ON recommendation_audits (created_at DESC);
CREATE INDEX idx_audits_fallback ON recommendation_audits (fallback_used) WHERE fallback_used = true;
CREATE INDEX idx_audits_confidence ON recommendation_audits (confidence_score);

-- Comments
COMMENT ON TABLE recommendation_audits IS 'Full audit trail for every recommendation - required for trust and compliance';
COMMENT ON COLUMN recommendation_audits.reasoning IS 'Human-readable explanation of why this card was chosen';
COMMENT ON COLUMN recommendation_audits.alternatives_considered IS 'JSON array of other cards considered with their scores';
COMMENT ON COLUMN recommendation_audits.exclusions_applied IS 'Array of exclusion reasons that affected this decision';
