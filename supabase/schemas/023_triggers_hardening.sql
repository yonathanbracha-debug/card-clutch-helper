-- CardClutch Truth Engine: Trigger Hardening
-- Execution order: 023
-- Spec: GLOBAL_BACKEND_SPECIFICATION.md Section 12
--
-- PURPOSE: Enforce data integrity rules that can't be expressed as constraints
-- Block unauthorized modifications, enforce verification requirements

-- ============================================
-- IMMUTABILITY TRIGGERS (Verified data can't change)
-- ============================================

-- Block updates to verified credit card critical fields
CREATE OR REPLACE FUNCTION block_verified_card_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  -- If currently verified, only allow specific changes
  IF OLD.verification_status = 'verified' THEN
    -- Check for changes to immutable fields
    IF NEW.annual_fee_cents != OLD.annual_fee_cents
       OR NEW.official_product_name != OLD.official_product_name
       OR NEW.network != OLD.network
       OR NEW.issuer_id != OLD.issuer_id
       OR NEW.product_type != OLD.product_type
    THEN
      RAISE EXCEPTION 'Cannot modify verified card fields. Create a new version instead. Card: %', OLD.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_block_verified_card_changes ON credit_cards;
CREATE TRIGGER tr_block_verified_card_changes
  BEFORE UPDATE ON credit_cards
  FOR EACH ROW
  EXECUTE FUNCTION block_verified_card_changes();

-- Block updates to verified reward rules
CREATE OR REPLACE FUNCTION block_verified_rule_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.verification_status = 'verified' THEN
    IF NEW.multiplier != OLD.multiplier
       OR NEW.category_id IS DISTINCT FROM OLD.category_id
       OR NEW.reward_currency != OLD.reward_currency
       OR NEW.spend_cap_cents IS DISTINCT FROM OLD.spend_cap_cents
       OR NEW.cap_period != OLD.cap_period
       OR NEW.rule_type != OLD.rule_type
    THEN
      RAISE EXCEPTION 'Cannot modify verified rule fields. Create a new version instead. Rule: %', OLD.id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_block_verified_rule_changes ON card_reward_rules;
CREATE TRIGGER tr_block_verified_rule_changes
  BEFORE UPDATE ON card_reward_rules
  FOR EACH ROW
  EXECUTE FUNCTION block_verified_rule_changes();

-- ============================================
-- VERIFICATION ENFORCEMENT TRIGGERS
-- ============================================

-- Require sources before marking as verified
CREATE OR REPLACE FUNCTION enforce_sources_on_verify()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  source_count INTEGER;
  v_entity_type entity_type;
BEGIN
  -- Only check when transitioning TO verified status
  IF NEW.verification_status = 'verified' 
     AND (OLD.verification_status IS NULL OR OLD.verification_status != 'verified') 
  THEN
    -- Determine entity type from table name
    v_entity_type := CASE TG_TABLE_NAME
      WHEN 'credit_cards' THEN 'card'::entity_type
      WHEN 'card_reward_rules' THEN 'rule'::entity_type
      WHEN 'merchant_exclusions' THEN 'exclusion'::entity_type
      WHEN 'merchants' THEN 'merchant'::entity_type
      ELSE NULL
    END;
    
    IF v_entity_type IS NOT NULL THEN
      SELECT COUNT(*) INTO source_count
      FROM entity_sources
      WHERE entity_type = v_entity_type
        AND entity_id = NEW.id;
        
      IF source_count = 0 THEN
        RAISE EXCEPTION 'Cannot verify % without at least one source. ID: %', TG_TABLE_NAME, NEW.id;
      END IF;
    END IF;
    
    -- Ensure last_verified_at is set
    NEW.last_verified_at := COALESCE(NEW.last_verified_at, now());
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply to all verifiable tables
DROP TRIGGER IF EXISTS tr_enforce_sources_cards ON credit_cards;
CREATE TRIGGER tr_enforce_sources_cards
  BEFORE UPDATE ON credit_cards
  FOR EACH ROW
  EXECUTE FUNCTION enforce_sources_on_verify();

DROP TRIGGER IF EXISTS tr_enforce_sources_rules ON card_reward_rules;
CREATE TRIGGER tr_enforce_sources_rules
  BEFORE UPDATE ON card_reward_rules
  FOR EACH ROW
  EXECUTE FUNCTION enforce_sources_on_verify();

DROP TRIGGER IF EXISTS tr_enforce_sources_merchants ON merchants;
CREATE TRIGGER tr_enforce_sources_merchants
  BEFORE UPDATE ON merchants
  FOR EACH ROW
  EXECUTE FUNCTION enforce_sources_on_verify();

DROP TRIGGER IF EXISTS tr_enforce_sources_exclusions ON merchant_exclusions;
CREATE TRIGGER tr_enforce_sources_exclusions
  BEFORE UPDATE ON merchant_exclusions
  FOR EACH ROW
  EXECUTE FUNCTION enforce_sources_on_verify();

-- ============================================
-- AUDIT LOGGING TRIGGERS
-- ============================================

-- Log verification status changes
CREATE OR REPLACE FUNCTION log_verification_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_entity_type entity_type;
BEGIN
  -- Only log on status change
  IF NEW.verification_status IS DISTINCT FROM OLD.verification_status THEN
    v_entity_type := CASE TG_TABLE_NAME
      WHEN 'credit_cards' THEN 'card'::entity_type
      WHEN 'card_reward_rules' THEN 'rule'::entity_type
      WHEN 'merchant_exclusions' THEN 'exclusion'::entity_type
      WHEN 'merchants' THEN 'merchant'::entity_type
      ELSE 'card'::entity_type
    END;
    
    -- Insert verification event
    INSERT INTO verification_events (
      entity_type,
      entity_id,
      status_from,
      status_to,
      change_summary,
      diff_json
    ) VALUES (
      v_entity_type,
      NEW.id,
      OLD.verification_status,
      NEW.verification_status,
      format('Status changed from %s to %s', 
             COALESCE(OLD.verification_status::TEXT, 'NULL'), 
             NEW.verification_status::TEXT),
      jsonb_build_object(
        'field', 'verification_status',
        'old', OLD.verification_status,
        'new', NEW.verification_status
      )
    );
    
    -- Insert canonical change log
    INSERT INTO canonical_change_log (
      entity_type,
      entity_id,
      action,
      metadata,
      change_summary
    ) VALUES (
      v_entity_type,
      NEW.id,
      CASE NEW.verification_status
        WHEN 'verified' THEN 'verify'::change_action
        WHEN 'deprecated' THEN 'deprecate'::change_action
        WHEN 'disputed' THEN 'dispute'::change_action
        ELSE 'expire'::change_action
      END,
      jsonb_build_object(
        'status_from', OLD.verification_status,
        'status_to', NEW.verification_status,
        'table', TG_TABLE_NAME
      ),
      format('%s verification status: %s → %s', TG_TABLE_NAME, OLD.verification_status, NEW.verification_status)
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply audit logging triggers
DROP TRIGGER IF EXISTS tr_log_verification_cards ON credit_cards;
CREATE TRIGGER tr_log_verification_cards
  AFTER UPDATE ON credit_cards
  FOR EACH ROW
  EXECUTE FUNCTION log_verification_change();

DROP TRIGGER IF EXISTS tr_log_verification_rules ON card_reward_rules;
CREATE TRIGGER tr_log_verification_rules
  AFTER UPDATE ON card_reward_rules
  FOR EACH ROW
  EXECUTE FUNCTION log_verification_change();

DROP TRIGGER IF EXISTS tr_log_verification_merchants ON merchants;
CREATE TRIGGER tr_log_verification_merchants
  AFTER UPDATE ON merchants
  FOR EACH ROW
  EXECUTE FUNCTION log_verification_change();

DROP TRIGGER IF EXISTS tr_log_verification_exclusions ON merchant_exclusions;
CREATE TRIGGER tr_log_verification_exclusions
  AFTER UPDATE ON merchant_exclusions
  FOR EACH ROW
  EXECUTE FUNCTION log_verification_change();

-- ============================================
-- AI INFERENCE APPROVAL TRIGGER
-- ============================================

-- When AI inference is approved, copy to canonical tables
CREATE OR REPLACE FUNCTION handle_inference_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only act when accepted becomes true with human review
  IF NEW.accepted = true 
     AND NEW.reviewed_by_human = true 
     AND (OLD.accepted = false OR OLD.reviewed_by_human = false)
  THEN
    -- Update merchant's default category if inference was for category
    IF NEW.suggested_category_id IS NOT NULL THEN
      UPDATE merchants
      SET default_category_id = NEW.suggested_category_id,
          verification_status = 'verified',
          verification_source = 'ai',
          last_verified_at = now()
      WHERE domain = NEW.merchant_domain;
      
      -- If merchant doesn't exist, create merchant_domains entry
      IF NOT FOUND THEN
        -- Log for manual review - merchant should be created first
        INSERT INTO canonical_change_log (
          entity_type,
          entity_id,
          action,
          metadata,
          change_summary
        ) VALUES (
          'domain'::entity_type,
          NEW.id,
          'approve'::change_action,
          jsonb_build_object(
            'inference_id', NEW.id,
            'domain', NEW.merchant_domain,
            'category_id', NEW.suggested_category_id,
            'note', 'Merchant does not exist - requires manual creation'
          ),
          format('AI inference approved for %s but merchant not found', NEW.merchant_domain)
        );
      ELSE
        -- Log successful approval
        INSERT INTO canonical_change_log (
          entity_type,
          entity_id,
          action,
          metadata,
          change_summary
        ) VALUES (
          'merchant'::entity_type,
          (SELECT id FROM merchants WHERE domain = NEW.merchant_domain LIMIT 1),
          'approve'::change_action,
          jsonb_build_object(
            'inference_id', NEW.id,
            'domain', NEW.merchant_domain,
            'category_id', NEW.suggested_category_id
          ),
          format('AI inference approved: %s → category %s', NEW.merchant_domain, NEW.suggested_category_id)
        );
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS tr_handle_inference_approval ON merchant_category_inference;
CREATE TRIGGER tr_handle_inference_approval
  AFTER UPDATE ON merchant_category_inference
  FOR EACH ROW
  EXECUTE FUNCTION handle_inference_approval();

-- ============================================
-- UPDATED_AT TRIGGERS
-- ============================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

-- Apply to tables with updated_at
DROP TRIGGER IF EXISTS tr_update_profiles ON profiles;
CREATE TRIGGER tr_update_profiles
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tr_update_user_preferences ON user_preferences;
CREATE TRIGGER tr_update_user_preferences
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

DROP TRIGGER IF EXISTS tr_update_user_cards ON user_cards;
CREATE TRIGGER tr_update_user_cards
  BEFORE UPDATE ON user_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Comments
COMMENT ON FUNCTION block_verified_card_changes IS 'Prevents modification of verified card data';
COMMENT ON FUNCTION enforce_sources_on_verify IS 'Requires sources before verification';
COMMENT ON FUNCTION log_verification_change IS 'Creates audit trail for verification changes';
COMMENT ON FUNCTION handle_inference_approval IS 'Copies approved AI inferences to canonical tables';
