-- CardClutch Truth Engine: Rule Expressiveness
-- Execution order: 016
-- Spec: GLOBAL_BACKEND_SPECIFICATION.md Section 5
--
-- PURPOSE: Real rule expressiveness - not just "4x" meaningless multipliers
-- Supports: merchant-specific, brand-specific, payment method, enrollment, caps

-- Extend card_reward_rules with advanced rule capabilities
ALTER TABLE card_reward_rules
  ADD COLUMN IF NOT EXISTS rule_type rule_type NOT NULL DEFAULT 'multiplier',
  ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES merchant_brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS flat_rate NUMERIC(6,3),
  ADD COLUMN IF NOT EXISTS payment_method payment_method NOT NULL DEFAULT 'any',
  ADD COLUMN IF NOT EXISTS cap_scope rule_scope NOT NULL DEFAULT 'per_card',
  ADD COLUMN IF NOT EXISTS priority INTEGER NOT NULL DEFAULT 100,
  ADD COLUMN IF NOT EXISTS exclusion_reason TEXT,
  ADD COLUMN IF NOT EXISTS details JSONB;

-- Update multiplier column to allow NULL for non-multiplier rules
ALTER TABLE card_reward_rules 
  ALTER COLUMN multiplier DROP NOT NULL;

-- Add constraint: rule must target at least one of category/merchant/brand
ALTER TABLE card_reward_rules DROP CONSTRAINT IF EXISTS card_reward_rules_has_target;
ALTER TABLE card_reward_rules ADD CONSTRAINT card_reward_rules_has_target CHECK (
  category_id IS NOT NULL OR merchant_id IS NOT NULL OR brand_id IS NOT NULL
);

-- Add constraint: multiplier required for multiplier/cap_bonus types
ALTER TABLE card_reward_rules DROP CONSTRAINT IF EXISTS card_reward_rules_multiplier_for_type;
ALTER TABLE card_reward_rules ADD CONSTRAINT card_reward_rules_multiplier_for_type CHECK (
  rule_type NOT IN ('multiplier', 'cap_bonus') OR multiplier IS NOT NULL
);

-- Add constraint: flat_rate required for flat_rate type
ALTER TABLE card_reward_rules DROP CONSTRAINT IF EXISTS card_reward_rules_flat_rate_for_type;
ALTER TABLE card_reward_rules ADD CONSTRAINT card_reward_rules_flat_rate_for_type CHECK (
  rule_type != 'flat_rate' OR flat_rate IS NOT NULL
);

-- Update multiplier constraint to allow NULL
ALTER TABLE card_reward_rules DROP CONSTRAINT IF EXISTS card_reward_rules_multiplier_positive;
ALTER TABLE card_reward_rules ADD CONSTRAINT card_reward_rules_multiplier_positive CHECK (
  multiplier IS NULL OR multiplier > 0
);

-- New indexes for rule resolution
CREATE INDEX IF NOT EXISTS idx_card_reward_rules_merchant ON card_reward_rules (merchant_id) 
  WHERE merchant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_card_reward_rules_brand ON card_reward_rules (brand_id) 
  WHERE brand_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_card_reward_rules_priority ON card_reward_rules (priority ASC);
CREATE INDEX IF NOT EXISTS idx_card_reward_rules_payment_method ON card_reward_rules (payment_method)
  WHERE payment_method != 'any';
CREATE INDEX IF NOT EXISTS idx_card_reward_rules_rule_type ON card_reward_rules (rule_type);

-- Extend merchant_exclusions for brand and category exclusions
ALTER TABLE merchant_exclusions
  ADD COLUMN IF NOT EXISTS brand_id UUID REFERENCES merchant_brands(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES reward_categories(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL;

-- Make merchant_domain nullable since we now support brand/category exclusions
ALTER TABLE merchant_exclusions ALTER COLUMN merchant_domain DROP NOT NULL;

-- Update constraint: exclusion must target at least one thing
ALTER TABLE merchant_exclusions DROP CONSTRAINT IF EXISTS merchant_exclusions_has_target;
ALTER TABLE merchant_exclusions ADD CONSTRAINT merchant_exclusions_has_target CHECK (
  merchant_domain IS NOT NULL OR brand_id IS NOT NULL OR 
  category_id IS NOT NULL OR merchant_id IS NOT NULL
);

-- New indexes for exclusion checks
CREATE INDEX IF NOT EXISTS idx_merchant_exclusions_brand ON merchant_exclusions (brand_id)
  WHERE brand_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_merchant_exclusions_category ON merchant_exclusions (category_id)
  WHERE category_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_merchant_exclusions_merchant_id ON merchant_exclusions (merchant_id)
  WHERE merchant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_merchant_exclusions_effective ON merchant_exclusions (
  card_id, effective_start_date, effective_end_date
);

-- Function to get best rule for a card/category/merchant combination
CREATE OR REPLACE FUNCTION get_best_rule(
  p_card_id UUID,
  p_category_id UUID DEFAULT NULL,
  p_merchant_id UUID DEFAULT NULL,
  p_brand_id UUID DEFAULT NULL,
  p_payment_method payment_method DEFAULT 'any'
)
RETURNS TABLE (
  rule_id UUID,
  rule_type rule_type,
  multiplier NUMERIC(6,3),
  flat_rate NUMERIC(6,3),
  spend_cap_cents INTEGER,
  cap_period cap_period,
  requires_enrollment BOOLEAN,
  priority INTEGER
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id AS rule_id,
    r.rule_type,
    r.multiplier,
    r.flat_rate,
    r.spend_cap_cents,
    r.cap_period,
    r.requires_enrollment,
    r.priority
  FROM v_rules_current r
  WHERE r.card_id = p_card_id
    AND r.verification_status IN ('verified', 'pending')
    AND (r.payment_method = 'any' OR r.payment_method = p_payment_method)
    AND (
      -- Match by specificity: merchant > brand > category
      (r.merchant_id IS NOT NULL AND r.merchant_id = p_merchant_id)
      OR (r.brand_id IS NOT NULL AND r.brand_id = p_brand_id)
      OR (r.category_id IS NOT NULL AND r.category_id = p_category_id)
    )
  ORDER BY 
    -- Priority: lower number = more specific
    r.priority ASC,
    -- Prefer merchant-specific over brand-specific over category
    CASE WHEN r.merchant_id IS NOT NULL THEN 0
         WHEN r.brand_id IS NOT NULL THEN 1
         ELSE 2 END ASC,
    -- Prefer higher multiplier
    COALESCE(r.multiplier, 0) DESC
  LIMIT 1;
END;
$$;

-- Function to check if exclusion applies
CREATE OR REPLACE FUNCTION check_exclusion(
  p_card_id UUID,
  p_merchant_id UUID DEFAULT NULL,
  p_merchant_domain TEXT DEFAULT NULL,
  p_brand_id UUID DEFAULT NULL,
  p_category_id UUID DEFAULT NULL
)
RETURNS TABLE (
  is_excluded BOOLEAN,
  exclusion_id UUID,
  exclusion_reason TEXT
)
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true AS is_excluded,
    e.id AS exclusion_id,
    e.exclusion_reason
  FROM v_exclusions_current e
  WHERE e.card_id = p_card_id
    AND e.verification_status IN ('verified', 'pending')
    AND (
      (e.merchant_domain IS NOT NULL AND e.merchant_domain = normalize_domain(p_merchant_domain))
      OR (e.merchant_id IS NOT NULL AND e.merchant_id = p_merchant_id)
      OR (e.brand_id IS NOT NULL AND e.brand_id = p_brand_id)
      OR (e.category_id IS NOT NULL AND e.category_id = p_category_id)
    )
  LIMIT 1;
  
  -- If no rows returned, return not excluded
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::UUID, NULL::TEXT;
  END IF;
END;
$$;

-- Comments
COMMENT ON COLUMN card_reward_rules.rule_type IS 'Type of reward rule (multiplier, flat_rate, statement_credit, etc.)';
COMMENT ON COLUMN card_reward_rules.merchant_id IS 'Merchant-specific rule (highest priority)';
COMMENT ON COLUMN card_reward_rules.brand_id IS 'Brand-family rule (medium priority)';
COMMENT ON COLUMN card_reward_rules.priority IS 'Lower = more specific, wins ties (default 100)';
COMMENT ON COLUMN card_reward_rules.payment_method IS 'Rule only applies with this payment method';
COMMENT ON COLUMN card_reward_rules.details IS 'Issuer-specific nuance as JSON';
COMMENT ON FUNCTION get_best_rule IS 'Returns the best matching rule for a card/target combination';
COMMENT ON FUNCTION check_exclusion IS 'Checks if any exclusion applies to a card/merchant combination';
