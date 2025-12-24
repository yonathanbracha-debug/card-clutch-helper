-- Database Functions
-- Execution order: 010 (after all tables and policies)

-- Function: Get active reward rules for a card
CREATE OR REPLACE FUNCTION get_active_reward_rules(p_card_id UUID)
RETURNS TABLE (
  rule_id UUID,
  category_name TEXT,
  multiplier NUMERIC,
  cap_amount_cents INTEGER,
  cap_period cap_period,
  requires_enrollment BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    crr.id AS rule_id,
    rc.name AS category_name,
    crr.multiplier,
    crr.cap_amount_cents,
    crr.cap_period,
    crr.requires_enrollment
  FROM card_reward_rules crr
  JOIN reward_categories rc ON rc.id = crr.category_id
  WHERE crr.card_id = p_card_id
    AND (crr.effective_start_date IS NULL OR crr.effective_start_date <= CURRENT_DATE)
    AND (crr.effective_end_date IS NULL OR crr.effective_end_date >= CURRENT_DATE)
  ORDER BY crr.multiplier DESC;
$$;

-- Function: Check if merchant is excluded for a card
CREATE OR REPLACE FUNCTION is_merchant_excluded(p_card_id UUID, p_merchant_domain TEXT)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM merchant_exclusions 
    WHERE card_id = p_card_id 
      AND merchant_domain = lower(p_merchant_domain)
  );
$$;

-- Function: Get merchant category with confidence
CREATE OR REPLACE FUNCTION get_merchant_category(p_domain TEXT)
RETURNS TABLE (
  category_id UUID,
  category_name TEXT,
  confidence_score NUMERIC,
  is_verified BOOLEAN,
  source merchant_source
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    rc.id AS category_id,
    rc.name AS category_name,
    m.confidence_score,
    m.verified AS is_verified,
    m.source
  FROM merchants m
  JOIN reward_categories rc ON rc.id = m.default_category_id
  WHERE m.domain = lower(p_domain)
  LIMIT 1;
$$;

-- Function: Get best card for category (excluding specified merchants)
CREATE OR REPLACE FUNCTION get_best_card_for_category(
  p_category_name TEXT,
  p_merchant_domain TEXT DEFAULT NULL,
  p_card_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  card_id UUID,
  card_name TEXT,
  issuer_name TEXT,
  multiplier NUMERIC,
  cap_amount_cents INTEGER,
  cap_period cap_period,
  annual_fee_cents INTEGER,
  is_excluded BOOLEAN,
  exclusion_reason TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked_cards AS (
    SELECT 
      cc.id AS card_id,
      cc.name AS card_name,
      i.name AS issuer_name,
      crr.multiplier,
      crr.cap_amount_cents,
      crr.cap_period,
      cc.annual_fee_cents,
      CASE 
        WHEN p_merchant_domain IS NOT NULL AND EXISTS (
          SELECT 1 FROM merchant_exclusions me 
          WHERE me.card_id = cc.id 
            AND me.merchant_domain = lower(p_merchant_domain)
        ) THEN true
        ELSE false
      END AS is_excluded,
      (
        SELECT me.reason FROM merchant_exclusions me 
        WHERE me.card_id = cc.id 
          AND me.merchant_domain = lower(p_merchant_domain)
        LIMIT 1
      ) AS exclusion_reason,
      ROW_NUMBER() OVER (
        ORDER BY 
          CASE WHEN p_merchant_domain IS NOT NULL AND EXISTS (
            SELECT 1 FROM merchant_exclusions me 
            WHERE me.card_id = cc.id 
              AND me.merchant_domain = lower(p_merchant_domain)
          ) THEN 1 ELSE 0 END,
          crr.multiplier DESC,
          CASE WHEN crr.cap_amount_cents IS NULL THEN 0 ELSE 1 END,
          cc.annual_fee_cents ASC
      ) AS rank
    FROM credit_cards cc
    JOIN issuers i ON i.id = cc.issuer_id
    JOIN card_reward_rules crr ON crr.card_id = cc.id
    JOIN reward_categories rc ON rc.id = crr.category_id
    WHERE rc.name = p_category_name
      AND cc.discontinued = false
      AND (crr.effective_start_date IS NULL OR crr.effective_start_date <= CURRENT_DATE)
      AND (crr.effective_end_date IS NULL OR crr.effective_end_date >= CURRENT_DATE)
      AND (p_card_ids IS NULL OR cc.id = ANY(p_card_ids))
  )
  SELECT 
    card_id,
    card_name,
    issuer_name,
    multiplier,
    cap_amount_cents,
    cap_period,
    annual_fee_cents,
    is_excluded,
    exclusion_reason
  FROM ranked_cards
  ORDER BY rank;
$$;

-- Comments
COMMENT ON FUNCTION get_active_reward_rules IS 'Returns all currently active reward rules for a given card';
COMMENT ON FUNCTION is_merchant_excluded IS 'Checks if a merchant is excluded from rewards for a specific card';
COMMENT ON FUNCTION get_merchant_category IS 'Returns the verified category for a known merchant';
COMMENT ON FUNCTION get_best_card_for_category IS 'Returns cards ranked by reward value for a category, respecting exclusions';
