-- Card Reward Rules Table (MOST CRITICAL)
-- Defines exact earning behavior per card per category
-- Execution order: 004

CREATE TABLE card_reward_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES reward_categories(id) ON DELETE RESTRICT,
  multiplier NUMERIC(4,2) NOT NULL,
  cap_amount_cents INTEGER,
  cap_period cap_period NOT NULL DEFAULT 'none',
  requires_enrollment BOOLEAN NOT NULL DEFAULT false,
  statement_credit BOOLEAN NOT NULL DEFAULT false,
  notes TEXT,
  effective_start_date DATE,
  effective_end_date DATE,
  source_url TEXT NOT NULL,
  last_verified_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT card_reward_rules_multiplier_positive CHECK (multiplier > 0),
  CONSTRAINT card_reward_rules_cap_positive CHECK (cap_amount_cents IS NULL OR cap_amount_cents > 0),
  CONSTRAINT card_reward_rules_cap_consistency CHECK (
    (cap_period = 'none' AND cap_amount_cents IS NULL) OR
    (cap_period != 'none' AND cap_amount_cents IS NOT NULL)
  ),
  CONSTRAINT card_reward_rules_valid_date_range CHECK (
    effective_end_date IS NULL OR effective_start_date IS NULL OR effective_end_date >= effective_start_date
  )
);

-- Indexes
CREATE INDEX idx_card_reward_rules_card_id ON card_reward_rules (card_id);
CREATE INDEX idx_card_reward_rules_category_id ON card_reward_rules (category_id);
CREATE INDEX idx_card_reward_rules_multiplier ON card_reward_rules (multiplier DESC);
CREATE INDEX idx_card_reward_rules_active ON card_reward_rules (card_id, category_id) 
  WHERE effective_end_date IS NULL OR effective_end_date >= CURRENT_DATE;

-- Comments
COMMENT ON TABLE card_reward_rules IS 'Exact earning rules per card/category - no multiplier without category';
COMMENT ON COLUMN card_reward_rules.multiplier IS 'Reward multiplier (e.g., 4.0 for 4x points)';
COMMENT ON COLUMN card_reward_rules.cap_amount_cents IS 'Spending cap in cents before multiplier reverts';
COMMENT ON COLUMN card_reward_rules.cap_period IS 'Period for cap reset - must match cap_amount_cents';
