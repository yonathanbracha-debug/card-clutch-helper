-- Card Reward Rules Table (EARNING ENGINE - CORE LOGIC)
-- Spec: Section 5.4
-- Execution order: 004
--
-- CRITICAL RULES:
-- - No multiplier without category
-- - Promotions MUST have end date
-- - Caps must be explicit
-- - No assumptions allowed

CREATE TABLE card_reward_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES reward_categories(id) ON DELETE RESTRICT,
  multiplier NUMERIC(6,2) NOT NULL,
  reward_currency reward_currency NOT NULL,
  spend_cap_cents INTEGER,
  cap_period cap_period NOT NULL DEFAULT 'none',
  requires_activation BOOLEAN NOT NULL DEFAULT false,
  requires_enrollment BOOLEAN NOT NULL DEFAULT false,
  promotion BOOLEAN NOT NULL DEFAULT false,
  effective_start_date DATE,
  effective_end_date DATE,
  issuer_language_excerpt TEXT,
  source_url TEXT NOT NULL,
  last_verified_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT card_reward_rules_multiplier_positive CHECK (multiplier > 0),
  CONSTRAINT card_reward_rules_cap_positive CHECK (spend_cap_cents IS NULL OR spend_cap_cents > 0),
  CONSTRAINT card_reward_rules_cap_consistency CHECK (
    (cap_period = 'none' AND spend_cap_cents IS NULL) OR
    (cap_period != 'none' AND spend_cap_cents IS NOT NULL)
  ),
  CONSTRAINT card_reward_rules_promotion_has_end_date CHECK (
    promotion = false OR effective_end_date IS NOT NULL
  ),
  CONSTRAINT card_reward_rules_valid_date_range CHECK (
    effective_end_date IS NULL OR 
    effective_start_date IS NULL OR 
    effective_end_date >= effective_start_date
  ),
  CONSTRAINT card_reward_rules_source_url_not_empty CHECK (length(trim(source_url)) > 0)
);

-- Indexes
CREATE INDEX idx_card_reward_rules_card_id ON card_reward_rules (card_id);
CREATE INDEX idx_card_reward_rules_category_id ON card_reward_rules (category_id);
CREATE INDEX idx_card_reward_rules_multiplier ON card_reward_rules (multiplier DESC);
CREATE INDEX idx_card_reward_rules_promotion ON card_reward_rules (promotion) WHERE promotion = true;
CREATE INDEX idx_card_reward_rules_active ON card_reward_rules (card_id, category_id) 
  WHERE (effective_end_date IS NULL OR effective_end_date >= CURRENT_DATE);
CREATE INDEX idx_card_reward_rules_reward_currency ON card_reward_rules (reward_currency);

-- Comments
COMMENT ON TABLE card_reward_rules IS 'EARNING ENGINE: Exact reward rules per card/category - no multiplier without category';
COMMENT ON COLUMN card_reward_rules.multiplier IS 'Reward multiplier (e.g., 4.00 for 4x) - always requires category context';
COMMENT ON COLUMN card_reward_rules.reward_currency IS 'What the multiplier earns (points, cashback, miles)';
COMMENT ON COLUMN card_reward_rules.spend_cap_cents IS 'Maximum spend before multiplier reverts - NULL means uncapped';
COMMENT ON COLUMN card_reward_rules.cap_period IS 'When cap resets - must match spend_cap_cents presence';
COMMENT ON COLUMN card_reward_rules.promotion IS 'If true, effective_end_date is REQUIRED';
COMMENT ON COLUMN card_reward_rules.issuer_language_excerpt IS 'Direct quote from cardmember agreement for audit';
