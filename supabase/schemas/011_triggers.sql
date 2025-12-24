-- Database Triggers (Data Integrity Enforcement)
-- Spec: Section 7
-- Execution order: 011

-- ============================================================
-- TRIGGER FUNCTION: Auto-update updated_at timestamp
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply to all tables with updated_at
CREATE TRIGGER set_updated_at_issuers
  BEFORE UPDATE ON issuers
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_reward_categories
  BEFORE UPDATE ON reward_categories
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_credit_cards
  BEFORE UPDATE ON credit_cards
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_card_reward_rules
  BEFORE UPDATE ON card_reward_rules
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_merchant_exclusions
  BEFORE UPDATE ON merchant_exclusions
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

CREATE TRIGGER set_updated_at_merchants
  BEFORE UPDATE ON merchants
  FOR EACH ROW EXECUTE FUNCTION trigger_set_updated_at();

-- ============================================================
-- TRIGGER FUNCTION: Validate and normalize domain format
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_validate_domain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  domain_field TEXT;
  domain_value TEXT;
BEGIN
  -- Determine which field to validate based on table
  IF TG_TABLE_NAME = 'merchants' THEN
    domain_value := NEW.domain;
  ELSIF TG_TABLE_NAME IN ('merchant_exclusions', 'merchant_category_inference', 'recommendation_audit_log') THEN
    domain_value := NEW.merchant_domain;
  ELSE
    RETURN NEW;
  END IF;
  
  -- Normalize: lowercase and trim
  domain_value := lower(trim(domain_value));
  
  -- Validate format: alphanumeric with dots and hyphens
  IF domain_value !~ '^[a-z0-9]([a-z0-9\-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]*[a-z0-9])?)+$' THEN
    RAISE EXCEPTION 'Invalid domain format: %. Expected format: example.com', domain_value
      USING HINT = 'Domain must be lowercase, contain at least one dot, and use only alphanumeric characters and hyphens';
  END IF;
  
  -- Apply normalized value back
  IF TG_TABLE_NAME = 'merchants' THEN
    NEW.domain := domain_value;
  ELSE
    NEW.merchant_domain := domain_value;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply domain validation triggers
CREATE TRIGGER validate_domain_merchants
  BEFORE INSERT OR UPDATE ON merchants
  FOR EACH ROW EXECUTE FUNCTION trigger_validate_domain();

CREATE TRIGGER validate_domain_merchant_exclusions
  BEFORE INSERT OR UPDATE ON merchant_exclusions
  FOR EACH ROW EXECUTE FUNCTION trigger_validate_domain();

CREATE TRIGGER validate_domain_inference
  BEFORE INSERT OR UPDATE ON merchant_category_inference
  FOR EACH ROW EXECUTE FUNCTION trigger_validate_domain();

CREATE TRIGGER validate_domain_audit_log
  BEFORE INSERT OR UPDATE ON recommendation_audit_log
  FOR EACH ROW EXECUTE FUNCTION trigger_validate_domain();

-- ============================================================
-- TRIGGER FUNCTION: Prevent modification of historical records
-- Implements append-only for critical tables
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_prevent_history_modification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Allow updates only to specific "mutable" fields
  IF TG_OP = 'UPDATE' THEN
    -- For credit_cards: only allow discontinuing or extending effective_end_date
    IF TG_TABLE_NAME = 'credit_cards' THEN
      IF OLD.annual_fee_cents != NEW.annual_fee_cents THEN
        RAISE EXCEPTION 'Cannot modify annual_fee_cents on existing record. Create a new versioned record instead.'
          USING HINT = 'Fee changes require a new row with updated effective dates';
      END IF;
      IF OLD.official_product_name != NEW.official_product_name THEN
        RAISE EXCEPTION 'Cannot modify official_product_name on existing record.'
          USING HINT = 'Product name changes require a new versioned record';
      END IF;
    END IF;
    
    -- For card_reward_rules: prevent modification of core reward logic
    IF TG_TABLE_NAME = 'card_reward_rules' THEN
      IF OLD.multiplier != NEW.multiplier THEN
        RAISE EXCEPTION 'Cannot modify multiplier on existing record. Create a new rule with updated effective dates.'
          USING HINT = 'Reward changes require a new row to preserve history';
      END IF;
      IF OLD.category_id != NEW.category_id THEN
        RAISE EXCEPTION 'Cannot modify category_id on existing record.'
          USING HINT = 'Category changes require a new versioned rule';
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Apply history protection triggers
CREATE TRIGGER protect_history_credit_cards
  BEFORE UPDATE ON credit_cards
  FOR EACH ROW EXECUTE FUNCTION trigger_prevent_history_modification();

CREATE TRIGGER protect_history_card_reward_rules
  BEFORE UPDATE ON card_reward_rules
  FOR EACH ROW EXECUTE FUNCTION trigger_prevent_history_modification();

-- ============================================================
-- TRIGGER FUNCTION: Enforce inference review workflow
-- Prevents auto-acceptance of AI suggestions
-- ============================================================
CREATE OR REPLACE FUNCTION trigger_enforce_inference_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- New inferences must start as unaccepted and unreviewed
  IF TG_OP = 'INSERT' THEN
    IF NEW.accepted = true AND NEW.reviewed_by_human = false THEN
      RAISE EXCEPTION 'Cannot insert accepted inference without human review'
        USING HINT = 'Set reviewed_by_human = true first';
    END IF;
  END IF;
  
  -- Updates: can only accept if reviewed
  IF TG_OP = 'UPDATE' THEN
    IF NEW.accepted = true AND NEW.reviewed_by_human = false THEN
      RAISE EXCEPTION 'Cannot accept inference without human review'
        USING HINT = 'Set reviewed_by_human = true before accepting';
    END IF;
    
    -- Once accepted, cannot un-accept
    IF OLD.accepted = true AND NEW.accepted = false THEN
      RAISE EXCEPTION 'Cannot revoke accepted inference'
        USING HINT = 'Create a new inference instead';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER enforce_inference_review
  BEFORE INSERT OR UPDATE ON merchant_category_inference
  FOR EACH ROW EXECUTE FUNCTION trigger_enforce_inference_review();

-- Comments
COMMENT ON FUNCTION trigger_set_updated_at IS 'Auto-updates updated_at timestamp on row modification';
COMMENT ON FUNCTION trigger_validate_domain IS 'Validates and normalizes domain format (lowercase, valid structure)';
COMMENT ON FUNCTION trigger_prevent_history_modification IS 'Enforces append-only semantics for canonical data';
COMMENT ON FUNCTION trigger_enforce_inference_review IS 'Prevents auto-acceptance of AI suggestions - requires human review';
