-- Database Functions (Deterministic Decision Engine)
-- Spec: Section 6
-- Execution order: 010

-- ============================================================
-- FUNCTION: Get active reward rules for a card
-- ============================================================
CREATE OR REPLACE FUNCTION get_active_reward_rules(p_card_id UUID)
RETURNS TABLE (
  rule_id UUID,
  category_slug TEXT,
  category_name TEXT,
  multiplier NUMERIC,
  reward_currency reward_currency,
  spend_cap_cents INTEGER,
  cap_period cap_period,
  requires_activation BOOLEAN,
  requires_enrollment BOOLEAN,
  is_promotion BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    crr.id AS rule_id,
    rc.slug AS category_slug,
    rc.display_name AS category_name,
    crr.multiplier,
    crr.reward_currency,
    crr.spend_cap_cents,
    crr.cap_period,
    crr.requires_activation,
    crr.requires_enrollment,
    crr.promotion AS is_promotion
  FROM card_reward_rules crr
  JOIN reward_categories rc ON rc.id = crr.category_id
  WHERE crr.card_id = p_card_id
    AND (crr.effective_start_date IS NULL OR crr.effective_start_date <= CURRENT_DATE)
    AND (crr.effective_end_date IS NULL OR crr.effective_end_date >= CURRENT_DATE)
  ORDER BY crr.multiplier DESC;
$$;

-- ============================================================
-- FUNCTION: Check if merchant is excluded for a card
-- ============================================================
CREATE OR REPLACE FUNCTION is_merchant_excluded(
  p_card_id UUID, 
  p_merchant_domain TEXT
)
RETURNS TABLE (
  is_excluded BOOLEAN,
  exclusion_reason TEXT
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    true AS is_excluded,
    me.exclusion_reason
  FROM merchant_exclusions me
  WHERE me.card_id = p_card_id 
    AND me.merchant_domain = lower(p_merchant_domain)
  UNION ALL
  SELECT 
    false AS is_excluded,
    NULL AS exclusion_reason
  WHERE NOT EXISTS (
    SELECT 1 FROM merchant_exclusions me2
    WHERE me2.card_id = p_card_id 
      AND me2.merchant_domain = lower(p_merchant_domain)
  )
  LIMIT 1;
$$;

-- ============================================================
-- FUNCTION: Get verified merchant category
-- Returns NULL if merchant is not verified (conservative approach)
-- ============================================================
CREATE OR REPLACE FUNCTION get_verified_merchant_category(p_domain TEXT)
RETURNS TABLE (
  category_id UUID,
  category_slug TEXT,
  category_name TEXT,
  confidence_score NUMERIC,
  verification_source verification_source
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    rc.id AS category_id,
    rc.slug AS category_slug,
    rc.display_name AS category_name,
    m.confidence_score,
    m.verification_source
  FROM merchants m
  JOIN reward_categories rc ON rc.id = m.default_category_id
  WHERE m.domain = lower(p_domain)
    AND m.verification_status = 'verified'
  LIMIT 1;
$$;

-- ============================================================
-- FUNCTION: Get AI inference (NON-AUTHORITATIVE)
-- Only returns if no verified category exists
-- ============================================================
CREATE OR REPLACE FUNCTION get_merchant_inference(p_domain TEXT)
RETURNS TABLE (
  category_id UUID,
  category_slug TEXT,
  confidence_score NUMERIC,
  method inference_method,
  is_human_reviewed BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    rc.id AS category_id,
    rc.slug AS category_slug,
    mci.confidence_score,
    mci.method,
    mci.reviewed_by_human AS is_human_reviewed
  FROM merchant_category_inference mci
  JOIN reward_categories rc ON rc.id = mci.suggested_category_id
  WHERE mci.merchant_domain = lower(p_domain)
    AND mci.accepted = true
  ORDER BY mci.confidence_score DESC, mci.created_at DESC
  LIMIT 1;
$$;

-- ============================================================
-- FUNCTION: Get best cards for a category (respecting exclusions)
-- Implements Spec Section 6 ranking:
-- 1. Highest effective return
-- 2. Uncapped > capped
-- 3. Lower annual fee
-- ============================================================
CREATE OR REPLACE FUNCTION get_best_cards_for_category(
  p_category_slug TEXT,
  p_merchant_domain TEXT DEFAULT NULL,
  p_user_card_ids UUID[] DEFAULT NULL
)
RETURNS TABLE (
  rank INTEGER,
  card_id UUID,
  card_name TEXT,
  issuer_name TEXT,
  multiplier NUMERIC,
  reward_currency reward_currency,
  spend_cap_cents INTEGER,
  cap_period cap_period,
  annual_fee_cents INTEGER,
  is_excluded BOOLEAN,
  exclusion_reason TEXT,
  requires_enrollment BOOLEAN,
  is_promotion BOOLEAN
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  WITH ranked_cards AS (
    SELECT 
      cc.id AS card_id,
      cc.official_product_name AS card_name,
      i.brand_name AS issuer_name,
      crr.multiplier,
      crr.reward_currency,
      crr.spend_cap_cents,
      crr.cap_period,
      cc.annual_fee_cents,
      COALESCE(
        (SELECT true FROM merchant_exclusions me 
         WHERE me.card_id = cc.id 
           AND p_merchant_domain IS NOT NULL
           AND me.merchant_domain = lower(p_merchant_domain)
         LIMIT 1),
        false
      ) AS is_excluded,
      (SELECT me.exclusion_reason FROM merchant_exclusions me 
       WHERE me.card_id = cc.id 
         AND p_merchant_domain IS NOT NULL
         AND me.merchant_domain = lower(p_merchant_domain)
       LIMIT 1) AS exclusion_reason,
      crr.requires_enrollment,
      crr.promotion AS is_promotion,
      ROW_NUMBER() OVER (
        ORDER BY 
          -- Excluded cards sort last
          CASE WHEN EXISTS (
            SELECT 1 FROM merchant_exclusions me 
            WHERE me.card_id = cc.id 
              AND p_merchant_domain IS NOT NULL
              AND me.merchant_domain = lower(p_merchant_domain)
          ) THEN 1 ELSE 0 END,
          -- Highest multiplier first
          crr.multiplier DESC,
          -- Uncapped preferred over capped
          CASE WHEN crr.spend_cap_cents IS NULL THEN 0 ELSE 1 END,
          -- Lower annual fee preferred
          cc.annual_fee_cents ASC
      ) AS rank
    FROM credit_cards cc
    JOIN issuers i ON i.id = cc.issuer_id
    JOIN card_reward_rules crr ON crr.card_id = cc.id
    JOIN reward_categories rc ON rc.id = crr.category_id
    WHERE rc.slug = p_category_slug
      AND cc.discontinued = false
      AND (crr.effective_start_date IS NULL OR crr.effective_start_date <= CURRENT_DATE)
      AND (crr.effective_end_date IS NULL OR crr.effective_end_date >= CURRENT_DATE)
      AND (p_user_card_ids IS NULL OR cc.id = ANY(p_user_card_ids))
  )
  SELECT 
    rank::INTEGER,
    card_id,
    card_name,
    issuer_name,
    multiplier,
    reward_currency,
    spend_cap_cents,
    cap_period,
    annual_fee_cents,
    is_excluded,
    exclusion_reason,
    requires_enrollment,
    is_promotion
  FROM ranked_cards
  ORDER BY rank;
$$;

-- ============================================================
-- FUNCTION: Check data staleness
-- Returns cards/rules that need re-verification
-- ============================================================
CREATE OR REPLACE FUNCTION get_stale_data(p_days_threshold INTEGER DEFAULT 90)
RETURNS TABLE (
  entity_type TEXT,
  entity_id UUID,
  entity_name TEXT,
  last_verified_at TIMESTAMPTZ,
  days_stale INTEGER
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    'credit_card' AS entity_type,
    id AS entity_id,
    official_product_name AS entity_name,
    last_verified_at,
    EXTRACT(DAY FROM (now() - last_verified_at))::INTEGER AS days_stale
  FROM credit_cards
  WHERE last_verified_at < now() - (p_days_threshold || ' days')::INTERVAL
    AND discontinued = false
  UNION ALL
  SELECT 
    'reward_rule' AS entity_type,
    crr.id AS entity_id,
    cc.official_product_name || ' - ' || rc.display_name AS entity_name,
    crr.last_verified_at,
    EXTRACT(DAY FROM (now() - crr.last_verified_at))::INTEGER AS days_stale
  FROM card_reward_rules crr
  JOIN credit_cards cc ON cc.id = crr.card_id
  JOIN reward_categories rc ON rc.id = crr.category_id
  WHERE crr.last_verified_at < now() - (p_days_threshold || ' days')::INTERVAL
    AND (crr.effective_end_date IS NULL OR crr.effective_end_date >= CURRENT_DATE)
  ORDER BY days_stale DESC;
$$;

-- Comments
COMMENT ON FUNCTION get_active_reward_rules IS 'Returns all currently active reward rules for a card';
COMMENT ON FUNCTION is_merchant_excluded IS 'Checks if merchant is excluded from rewards for a specific card';
COMMENT ON FUNCTION get_verified_merchant_category IS 'Returns ONLY verified category - NULL if not verified (conservative)';
COMMENT ON FUNCTION get_merchant_inference IS 'Returns AI inference - NON-AUTHORITATIVE, advisory only';
COMMENT ON FUNCTION get_best_cards_for_category IS 'Ranks cards by effective value, respecting exclusions (Spec Section 6)';
COMMENT ON FUNCTION get_stale_data IS 'Identifies data needing re-verification - prevents silent drift';
