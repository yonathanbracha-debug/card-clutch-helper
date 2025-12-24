-- Recommendation Audit Log (EXPLAINABILITY & COMPLIANCE)
-- Spec: Section 5.8
-- Execution order: 008
--
-- PURPOSE:
-- - Replay any decision
-- - Debug issues
-- - Regulator review
-- - User explanation

CREATE TABLE recommendation_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_domain TEXT NOT NULL,
  resolved_category_id UUID REFERENCES reward_categories(id) ON DELETE SET NULL,
  resolved_category_slug TEXT,
  winning_card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL,
  evaluated_cards UUID[] NOT NULL DEFAULT '{}',
  excluded_cards UUID[] NOT NULL DEFAULT '{}',
  decision_reasoning TEXT NOT NULL,
  decision_path JSONB NOT NULL,
  confidence_score NUMERIC(3,2) NOT NULL,
  fallback_used BOOLEAN NOT NULL DEFAULT false,
  fallback_reason TEXT,
  user_card_ids UUID[],
  request_metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT audit_domain_lowercase CHECK (merchant_domain = lower(merchant_domain)),
  CONSTRAINT audit_domain_not_empty CHECK (length(trim(merchant_domain)) > 0),
  CONSTRAINT audit_confidence_range CHECK (confidence_score >= 0 AND confidence_score <= 1),
  CONSTRAINT audit_reasoning_not_empty CHECK (length(trim(decision_reasoning)) > 0),
  CONSTRAINT audit_fallback_has_reason CHECK (
    fallback_used = false OR fallback_reason IS NOT NULL
  )
);

-- Indexes
CREATE INDEX idx_audit_merchant_domain ON recommendation_audit_log (merchant_domain);
CREATE INDEX idx_audit_winning_card_id ON recommendation_audit_log (winning_card_id);
CREATE INDEX idx_audit_resolved_category ON recommendation_audit_log (resolved_category_id);
CREATE INDEX idx_audit_created_at ON recommendation_audit_log (created_at DESC);
CREATE INDEX idx_audit_fallback ON recommendation_audit_log (fallback_used, created_at DESC) 
  WHERE fallback_used = true;
CREATE INDEX idx_audit_confidence ON recommendation_audit_log (confidence_score);
CREATE INDEX idx_audit_decision_path ON recommendation_audit_log USING GIN (decision_path);

-- Comments
COMMENT ON TABLE recommendation_audit_log IS 'COMPLIANCE: Full audit trail for every recommendation - enables replay, debug, regulator review';
COMMENT ON COLUMN recommendation_audit_log.decision_reasoning IS 'Human-readable explanation of why this card was chosen';
COMMENT ON COLUMN recommendation_audit_log.decision_path IS 'JSON detailing each step of the decision algorithm';
COMMENT ON COLUMN recommendation_audit_log.evaluated_cards IS 'All cards that were considered for this recommendation';
COMMENT ON COLUMN recommendation_audit_log.excluded_cards IS 'Cards excluded due to merchant exclusions';
COMMENT ON COLUMN recommendation_audit_log.fallback_used IS 'True if confidence was too low and fallback card was used';
COMMENT ON COLUMN recommendation_audit_log.request_metadata IS 'Optional: user agent, session info for forensics';
