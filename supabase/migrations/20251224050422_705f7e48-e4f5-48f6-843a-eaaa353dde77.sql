-- Security Hardening: Convert SECURITY DEFINER functions to INVOKER where safe
-- This migration removes unnecessary elevated privileges from database functions

-- ============================================================
-- DROP and recreate functions WITHOUT SECURITY DEFINER
-- These functions only read public data (cards, categories, merchants)
-- and don't need elevated privileges
-- ============================================================

-- 1. get_active_reward_rules - reads from card_reward_rules and reward_categories (public read)
DROP FUNCTION IF EXISTS get_active_reward_rules(UUID);
CREATE OR REPLACE FUNCTION get_active_reward_rules(p_card_id UUID)
RETURNS TABLE (
  rule_id UUID,
  category_slug TEXT,
  category_name TEXT,
  multiplier NUMERIC,
  cap_cents INTEGER,
  cap_period TEXT,
  description TEXT,
  notes TEXT
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 
    crr.id AS rule_id,
    rc.slug AS category_slug,
    rc.display_name AS category_name,
    crr.multiplier,
    crr.cap_cents,
    crr.cap_period,
    crr.description,
    crr.notes
  FROM card_reward_rules crr
  JOIN reward_categories rc ON rc.id = crr.category_id
  WHERE crr.card_id = p_card_id
  ORDER BY crr.multiplier DESC;
$$;

-- 2. is_merchant_excluded - reads from merchant_exclusions (public read)
DROP FUNCTION IF EXISTS is_merchant_excluded(UUID, TEXT);
CREATE OR REPLACE FUNCTION is_merchant_excluded(
  p_card_id UUID, 
  p_merchant_pattern TEXT
)
RETURNS TABLE (
  is_excluded BOOLEAN,
  exclusion_reason TEXT
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 
    true AS is_excluded,
    me.reason AS exclusion_reason
  FROM merchant_exclusions me
  WHERE me.card_id = p_card_id 
    AND lower(p_merchant_pattern) LIKE '%' || lower(me.merchant_pattern) || '%'
  UNION ALL
  SELECT 
    false AS is_excluded,
    NULL AS exclusion_reason
  WHERE NOT EXISTS (
    SELECT 1 FROM merchant_exclusions me2
    WHERE me2.card_id = p_card_id 
      AND lower(p_merchant_pattern) LIKE '%' || lower(me2.merchant_pattern) || '%'
  )
  LIMIT 1;
$$;

-- 3. get_verified_merchant_category - reads from merchants (public read for verified)
DROP FUNCTION IF EXISTS get_verified_merchant_category(TEXT);
CREATE OR REPLACE FUNCTION get_verified_merchant_category(p_domain TEXT)
RETURNS TABLE (
  category_id UUID,
  category_slug TEXT,
  category_name TEXT
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  SELECT 
    rc.id AS category_id,
    rc.slug AS category_slug,
    rc.display_name AS category_name
  FROM merchants m
  JOIN reward_categories rc ON rc.id = m.category_id
  WHERE m.domain = lower(p_domain)
    AND m.verification_status = 'verified'
  LIMIT 1;
$$;

-- 4. get_best_cards_for_category - reads public card data only
DROP FUNCTION IF EXISTS get_best_cards_for_category(TEXT, TEXT, UUID[]);
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
  cap_cents INTEGER,
  cap_period TEXT,
  annual_fee_cents INTEGER,
  is_excluded BOOLEAN,
  exclusion_reason TEXT
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH ranked_cards AS (
    SELECT 
      cc.id AS card_id,
      cc.name AS card_name,
      i.name AS issuer_name,
      crr.multiplier,
      crr.cap_cents,
      crr.cap_period,
      cc.annual_fee_cents,
      COALESCE(
        (SELECT true FROM merchant_exclusions me 
         WHERE me.card_id = cc.id 
           AND p_merchant_domain IS NOT NULL
           AND lower(p_merchant_domain) LIKE '%' || lower(me.merchant_pattern) || '%'
         LIMIT 1),
        false
      ) AS is_excluded,
      (SELECT me.reason FROM merchant_exclusions me 
       WHERE me.card_id = cc.id 
         AND p_merchant_domain IS NOT NULL
         AND lower(p_merchant_domain) LIKE '%' || lower(me.merchant_pattern) || '%'
       LIMIT 1) AS exclusion_reason,
      ROW_NUMBER() OVER (
        ORDER BY 
          -- Excluded cards sort last
          CASE WHEN EXISTS (
            SELECT 1 FROM merchant_exclusions me 
            WHERE me.card_id = cc.id 
              AND p_merchant_domain IS NOT NULL
              AND lower(p_merchant_domain) LIKE '%' || lower(me.merchant_pattern) || '%'
          ) THEN 1 ELSE 0 END,
          -- Highest multiplier first
          crr.multiplier DESC,
          -- Uncapped preferred over capped
          CASE WHEN crr.cap_cents IS NULL THEN 0 ELSE 1 END,
          -- Lower annual fee preferred
          cc.annual_fee_cents ASC
      ) AS rank
    FROM credit_cards cc
    JOIN issuers i ON i.id = cc.issuer_id
    JOIN card_reward_rules crr ON crr.card_id = cc.id
    JOIN reward_categories rc ON rc.id = crr.category_id
    WHERE rc.slug = p_category_slug
      AND cc.is_active = true
      AND (p_user_card_ids IS NULL OR cc.id = ANY(p_user_card_ids))
  )
  SELECT 
    rank::INTEGER,
    card_id,
    card_name,
    issuer_name,
    multiplier,
    cap_cents,
    cap_period,
    annual_fee_cents,
    is_excluded,
    exclusion_reason
  FROM ranked_cards
  ORDER BY rank;
$$;

-- 5. get_stale_data - reads public card data (admin utility but safe)
DROP FUNCTION IF EXISTS get_stale_data(INTEGER);
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
SET search_path = public
AS $$
  SELECT 
    'credit_card' AS entity_type,
    id AS entity_id,
    name AS entity_name,
    last_verified_at,
    EXTRACT(DAY FROM (now() - last_verified_at))::INTEGER AS days_stale
  FROM credit_cards
  WHERE last_verified_at < now() - (p_days_threshold || ' days')::INTERVAL
    AND is_active = true
  ORDER BY days_stale DESC;
$$;

-- ============================================================
-- Comments for documentation
-- ============================================================
COMMENT ON FUNCTION get_active_reward_rules IS 'Returns active reward rules for a card - INVOKER rights, relies on RLS';
COMMENT ON FUNCTION is_merchant_excluded IS 'Checks if merchant is excluded - INVOKER rights, relies on RLS';
COMMENT ON FUNCTION get_verified_merchant_category IS 'Returns verified category - INVOKER rights, relies on RLS';
COMMENT ON FUNCTION get_best_cards_for_category IS 'Ranks cards by value - INVOKER rights, relies on RLS';
COMMENT ON FUNCTION get_stale_data IS 'Admin utility for stale data - INVOKER rights';

-- ============================================================
-- Add URL validation constraints to recommendation_logs table
-- ============================================================
ALTER TABLE recommendation_logs
  ADD CONSTRAINT chk_url_length CHECK (length(url) <= 2048),
  ADD CONSTRAINT chk_url_scheme CHECK (url ~ '^https?://'),
  ADD CONSTRAINT chk_domain_length CHECK (domain IS NULL OR length(domain) <= 255);

-- ============================================================
-- Note: handle_new_user() MUST remain SECURITY DEFINER
-- It's a trigger that inserts into profiles/user_preferences
-- for NEW.id from auth.users - this is the correct pattern
-- ============================================================