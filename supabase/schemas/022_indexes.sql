-- CardClutch Truth Engine: Performance Indexes
-- Execution order: 022
-- Spec: GLOBAL_BACKEND_SPECIFICATION.md Section 11
--
-- PURPOSE: Indexes optimized for actual query patterns
-- Every index must have a clear use case

-- ============================================
-- MERCHANT RESOLUTION INDEXES
-- ============================================

-- Fast domain lookup (most common query)
CREATE INDEX IF NOT EXISTS idx_merchant_domains_lookup 
  ON merchant_domains (domain_normalized, match_type, confidence DESC);

-- Suffix matching optimization
CREATE INDEX IF NOT EXISTS idx_merchant_domains_suffix 
  ON merchant_domains (domain_normalized text_pattern_ops) 
  WHERE match_type = 'suffix';

-- Alias lookup
CREATE INDEX IF NOT EXISTS idx_merchant_aliases_lookup 
  ON merchant_aliases (alias_normalized);

-- ============================================
-- RULE RESOLUTION INDEXES
-- ============================================

-- Main rule lookup: card + category + effective dates
CREATE INDEX IF NOT EXISTS idx_rules_card_category_effective 
  ON card_reward_rules (
    card_id, 
    category_id, 
    effective_start_date, 
    effective_end_date
  )
  WHERE verification_status NOT IN ('deprecated');

-- Merchant-specific rules (high priority)
CREATE INDEX IF NOT EXISTS idx_rules_merchant_specific 
  ON card_reward_rules (card_id, merchant_id)
  WHERE merchant_id IS NOT NULL AND verification_status NOT IN ('deprecated');

-- Brand-specific rules
CREATE INDEX IF NOT EXISTS idx_rules_brand_specific 
  ON card_reward_rules (card_id, brand_id)
  WHERE brand_id IS NOT NULL AND verification_status NOT IN ('deprecated');

-- Rule type filtering
CREATE INDEX IF NOT EXISTS idx_rules_by_type_card 
  ON card_reward_rules (card_id, rule_type)
  WHERE verification_status NOT IN ('deprecated');

-- ============================================
-- EXCLUSION CHECK INDEXES
-- ============================================

-- Domain-based exclusions
CREATE INDEX IF NOT EXISTS idx_exclusions_domain_check 
  ON merchant_exclusions (card_id, merchant_domain)
  WHERE merchant_domain IS NOT NULL 
    AND verification_status NOT IN ('deprecated');

-- Merchant ID exclusions
CREATE INDEX IF NOT EXISTS idx_exclusions_merchant_check 
  ON merchant_exclusions (card_id, merchant_id)
  WHERE merchant_id IS NOT NULL 
    AND verification_status NOT IN ('deprecated');

-- Brand exclusions
CREATE INDEX IF NOT EXISTS idx_exclusions_brand_check 
  ON merchant_exclusions (card_id, brand_id)
  WHERE brand_id IS NOT NULL 
    AND verification_status NOT IN ('deprecated');

-- Category exclusions
CREATE INDEX IF NOT EXISTS idx_exclusions_category_check 
  ON merchant_exclusions (card_id, category_id)
  WHERE category_id IS NOT NULL 
    AND verification_status NOT IN ('deprecated');

-- ============================================
-- USER DATA INDEXES
-- ============================================

-- User's active cards (for recommendation)
CREATE INDEX IF NOT EXISTS idx_user_cards_active 
  ON user_cards (user_id, card_id)
  WHERE do_not_recommend = false;

-- User overrides lookup
CREATE INDEX IF NOT EXISTS idx_user_overrides_lookup 
  ON user_merchant_overrides (user_id, domain_normalized);

-- Search history by user (recent first)
CREATE INDEX IF NOT EXISTS idx_search_history_user_recent 
  ON user_search_history (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

-- Search history by domain (for analytics)
CREATE INDEX IF NOT EXISTS idx_search_history_domain 
  ON user_search_history (domain_normalized, created_at DESC);

-- Search history by merchant (for usage tracking)
CREATE INDEX IF NOT EXISTS idx_search_history_merchant 
  ON user_search_history (resolved_merchant_id, created_at DESC)
  WHERE resolved_merchant_id IS NOT NULL;

-- ============================================
-- SOURCE/PROVENANCE INDEXES
-- ============================================

-- Entity sources lookup (for verification checks)
CREATE INDEX IF NOT EXISTS idx_entity_sources_lookup 
  ON entity_sources (entity_type, entity_id);

-- Sources by card (for card detail view)
CREATE INDEX IF NOT EXISTS idx_sources_by_card 
  ON sources (card_id, source_type)
  WHERE card_id IS NOT NULL;

-- Authoritative sources
CREATE INDEX IF NOT EXISTS idx_sources_authoritative 
  ON sources (card_id, issuer_id)
  WHERE is_authoritative = true;

-- ============================================
-- AUDIT INDEXES
-- ============================================

-- Recommendation audit by date
CREATE INDEX IF NOT EXISTS idx_recommendation_audit_date 
  ON recommendation_audit_log (created_at DESC);

-- Recommendation audit by merchant (for usage tracking)
CREATE INDEX IF NOT EXISTS idx_recommendation_audit_merchant 
  ON recommendation_audit_log (merchant_domain, created_at DESC);

-- Canonical change log by entity
CREATE INDEX IF NOT EXISTS idx_change_log_entity 
  ON canonical_change_log (entity_type, entity_id, created_at DESC);

-- Canonical change log by action
CREATE INDEX IF NOT EXISTS idx_change_log_action 
  ON canonical_change_log (action, created_at DESC);

-- Verification events by entity
CREATE INDEX IF NOT EXISTS idx_verification_events_entity_lookup 
  ON verification_events (entity_type, entity_id, verified_at DESC);

-- ============================================
-- STALENESS/OPS INDEXES
-- ============================================

-- Cards needing verification
CREATE INDEX IF NOT EXISTS idx_cards_stale 
  ON credit_cards (last_verified_at, verification_status)
  WHERE discontinued = false 
    AND (verification_status IN ('pending', 'stale', 'needs_review') 
         OR last_verified_at < now() - INTERVAL '180 days');

-- Rules needing verification
CREATE INDEX IF NOT EXISTS idx_rules_stale 
  ON card_reward_rules (last_verified_at, verification_status)
  WHERE verification_status IN ('pending', 'stale', 'needs_review')
    OR last_verified_at < now() - INTERVAL '180 days';

-- Verification schedule pending items
CREATE INDEX IF NOT EXISTS idx_verification_schedule_pending 
  ON verification_schedule (scheduled_for, priority)
  WHERE status = 'pending';

-- ============================================
-- FULL TEXT SEARCH (if needed)
-- ============================================

-- Card name search
CREATE INDEX IF NOT EXISTS idx_cards_name_trgm 
  ON credit_cards USING gin (official_product_name gin_trgm_ops);

-- Merchant name search
CREATE INDEX IF NOT EXISTS idx_merchants_name_trgm 
  ON merchants USING gin (canonical_name gin_trgm_ops);

-- Note: gin_trgm_ops requires pg_trgm extension
-- Run: CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Comments
COMMENT ON INDEX idx_merchant_domains_lookup IS 'Primary index for merchant resolution';
COMMENT ON INDEX idx_rules_card_category_effective IS 'Main index for rule lookup';
COMMENT ON INDEX idx_user_cards_active IS 'Fast lookup of user wallet for recommendations';
COMMENT ON INDEX idx_cards_stale IS 'Identifies cards needing verification';
