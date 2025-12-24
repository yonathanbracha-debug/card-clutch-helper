-- Merchant Category Evaluations Table
-- Tracks AI/heuristic category suggestions (NEVER overrides canonical rules)
-- Execution order: 007

CREATE TABLE merchant_category_evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_domain TEXT NOT NULL,
  suggested_category_id UUID NOT NULL REFERENCES reward_categories(id) ON DELETE CASCADE,
  confidence_score NUMERIC(3,2) NOT NULL,
  method evaluation_method NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT false,
  reviewed_at TIMESTAMPTZ,
  reviewed_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT evaluations_domain_lowercase CHECK (merchant_domain = lower(merchant_domain)),
  CONSTRAINT evaluations_confidence_range CHECK (confidence_score >= 0 AND confidence_score <= 1),
  CONSTRAINT evaluations_accepted_reviewed CHECK (
    (accepted = false) OR (accepted = true AND reviewed_at IS NOT NULL)
  )
);

-- Indexes
CREATE INDEX idx_evaluations_merchant_domain ON merchant_category_evaluations (merchant_domain);
CREATE INDEX idx_evaluations_category_id ON merchant_category_evaluations (suggested_category_id);
CREATE INDEX idx_evaluations_pending ON merchant_category_evaluations (created_at DESC) 
  WHERE accepted = false;
CREATE INDEX idx_evaluations_method ON merchant_category_evaluations (method);

-- Comments
COMMENT ON TABLE merchant_category_evaluations IS 'AI/heuristic suggestions - NEVER overrides canonical rules, advisory only';
COMMENT ON COLUMN merchant_category_evaluations.accepted IS 'Whether a human has accepted this suggestion';
COMMENT ON COLUMN merchant_category_evaluations.method IS 'How this evaluation was generated (ai or heuristic)';
