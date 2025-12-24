-- Merchant Category Inference Table (AI SUGGESTION SANDBOX)
-- Spec: Section 5.7
-- Execution order: 007
--
-- CRITICAL RULES:
-- - NEVER auto-accepted
-- - NEVER authoritative
-- - Advisory ONLY

CREATE TABLE merchant_category_inference (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_domain TEXT NOT NULL,
  suggested_category_id UUID NOT NULL REFERENCES reward_categories(id) ON DELETE CASCADE,
  confidence_score NUMERIC(3,2) NOT NULL,
  method inference_method NOT NULL,
  accepted BOOLEAN NOT NULL DEFAULT false,
  reviewed_by_human BOOLEAN NOT NULL DEFAULT false,
  reviewer_notes TEXT,
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT inference_domain_lowercase CHECK (merchant_domain = lower(merchant_domain)),
  CONSTRAINT inference_domain_not_empty CHECK (length(trim(merchant_domain)) > 0),
  CONSTRAINT inference_confidence_range CHECK (confidence_score >= 0 AND confidence_score <= 1),
  CONSTRAINT inference_accepted_requires_review CHECK (
    accepted = false OR reviewed_by_human = true
  ),
  CONSTRAINT inference_reviewed_has_timestamp CHECK (
    reviewed_by_human = false OR reviewed_at IS NOT NULL
  )
);

-- Indexes
CREATE INDEX idx_inference_merchant_domain ON merchant_category_inference (merchant_domain);
CREATE INDEX idx_inference_category_id ON merchant_category_inference (suggested_category_id);
CREATE INDEX idx_inference_pending_review ON merchant_category_inference (created_at DESC) 
  WHERE reviewed_by_human = false;
CREATE INDEX idx_inference_accepted ON merchant_category_inference (merchant_domain, accepted) 
  WHERE accepted = true;
CREATE INDEX idx_inference_method ON merchant_category_inference (method);
CREATE INDEX idx_inference_confidence ON merchant_category_inference (confidence_score DESC);

-- Comments
COMMENT ON TABLE merchant_category_inference IS 'AI SANDBOX: Category suggestions - NEVER authoritative, NEVER auto-accepted';
COMMENT ON COLUMN merchant_category_inference.accepted IS 'Can ONLY be true if reviewed_by_human = true';
COMMENT ON COLUMN merchant_category_inference.reviewed_by_human IS 'Has a human verified this suggestion?';
COMMENT ON COLUMN merchant_category_inference.method IS 'How generated (ai or heuristic) - for bias tracking';
