-- CardClutch Truth Engine: Verification & Effective Dating
-- Execution order: 014
-- Spec: GLOBAL_BACKEND_SPECIFICATION.md Section 3
--
-- PURPOSE: Append-only verified facts with effective dating
-- Changes happen via: expire old record + insert new record

-- Extended verification status (adds more states to base enum)
DO $$ 
BEGIN
  -- Add new values to verification_status if they don't exist
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'stale' AND enumtypid = 'verification_status'::regtype) THEN
    ALTER TYPE verification_status ADD VALUE 'stale';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'disputed' AND enumtypid = 'verification_status'::regtype) THEN
    ALTER TYPE verification_status ADD VALUE 'disputed';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'deprecated' AND enumtypid = 'verification_status'::regtype) THEN
    ALTER TYPE verification_status ADD VALUE 'deprecated';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'needs_review' AND enumtypid = 'verification_status'::regtype) THEN
    ALTER TYPE verification_status ADD VALUE 'needs_review';
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;

-- Add verification columns to credit_cards
ALTER TABLE credit_cards 
  ADD COLUMN IF NOT EXISTS verification_status verification_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Add verification columns to card_reward_rules
ALTER TABLE card_reward_rules
  ADD COLUMN IF NOT EXISTS verification_status verification_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Add verification + effective dating to merchant_exclusions
ALTER TABLE merchant_exclusions
  ADD COLUMN IF NOT EXISTS effective_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS effective_end_date DATE,
  ADD COLUMN IF NOT EXISTS verification_status verification_status NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Add effective dating to merchants
ALTER TABLE merchants
  ADD COLUMN IF NOT EXISTS effective_start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS effective_end_date DATE;

-- Add constraints for verified status requires last_verified_at
ALTER TABLE credit_cards DROP CONSTRAINT IF EXISTS credit_cards_verified_has_date;
ALTER TABLE credit_cards ADD CONSTRAINT credit_cards_verified_has_date CHECK (
  verification_status NOT IN ('verified') OR last_verified_at IS NOT NULL
);

ALTER TABLE card_reward_rules DROP CONSTRAINT IF EXISTS card_reward_rules_verified_has_date;
ALTER TABLE card_reward_rules ADD CONSTRAINT card_reward_rules_verified_has_date CHECK (
  verification_status NOT IN ('verified') OR last_verified_at IS NOT NULL
);

-- Verification Events table - audit trail for all verification changes
CREATE TABLE verification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  status_from verification_status,
  status_to verification_status NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verified_by UUID, -- Will be linked to profiles when auth is set up
  change_summary TEXT NOT NULL,
  diff_json JSONB,
  sources_used UUID[], -- Array of source IDs used for this verification
  notes TEXT,
  
  CONSTRAINT verification_events_summary_not_empty CHECK (length(trim(change_summary)) > 0)
);

-- Indexes
CREATE INDEX idx_verification_events_entity ON verification_events (entity_type, entity_id);
CREATE INDEX idx_verification_events_status ON verification_events (status_to);
CREATE INDEX idx_verification_events_date ON verification_events (verified_at DESC);
CREATE INDEX idx_verification_events_verifier ON verification_events (verified_by) WHERE verified_by IS NOT NULL;

-- View: Currently effective credit cards
CREATE OR REPLACE VIEW v_cards_current AS
SELECT *
FROM credit_cards
WHERE (effective_start_date IS NULL OR effective_start_date <= CURRENT_DATE)
  AND (effective_end_date IS NULL OR effective_end_date >= CURRENT_DATE)
  AND verification_status NOT IN ('deprecated')
  AND discontinued = false;

-- View: Currently effective reward rules
CREATE OR REPLACE VIEW v_rules_current AS
SELECT *
FROM card_reward_rules
WHERE (effective_start_date IS NULL OR effective_start_date <= CURRENT_DATE)
  AND (effective_end_date IS NULL OR effective_end_date >= CURRENT_DATE)
  AND verification_status NOT IN ('deprecated');

-- View: Currently effective exclusions
CREATE OR REPLACE VIEW v_exclusions_current AS
SELECT *
FROM merchant_exclusions
WHERE effective_start_date <= CURRENT_DATE
  AND (effective_end_date IS NULL OR effective_end_date >= CURRENT_DATE)
  AND verification_status NOT IN ('deprecated');

-- View: Currently effective merchants
CREATE OR REPLACE VIEW v_merchants_current AS
SELECT *
FROM merchants
WHERE effective_start_date <= CURRENT_DATE
  AND (effective_end_date IS NULL OR effective_end_date >= CURRENT_DATE)
  AND verification_status NOT IN ('deprecated');

-- Comments
COMMENT ON TABLE verification_events IS 'Audit trail of all verification status changes';
COMMENT ON COLUMN verification_events.sources_used IS 'Array of source IDs that justified this verification';
COMMENT ON VIEW v_cards_current IS 'Only currently active, non-deprecated credit cards';
COMMENT ON VIEW v_rules_current IS 'Only currently active, non-deprecated reward rules';
COMMENT ON VIEW v_exclusions_current IS 'Only currently active exclusions';
COMMENT ON VIEW v_merchants_current IS 'Only currently active merchants';
