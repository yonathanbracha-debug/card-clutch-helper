-- Database Triggers
-- Execution order: 011 (after functions)

-- Function: Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
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

-- Triggers for updated_at on all relevant tables

CREATE TRIGGER trigger_issuers_updated_at
  BEFORE UPDATE ON issuers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_reward_categories_updated_at
  BEFORE UPDATE ON reward_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_credit_cards_updated_at
  BEFORE UPDATE ON credit_cards
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_card_reward_rules_updated_at
  BEFORE UPDATE ON card_reward_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_merchant_exclusions_updated_at
  BEFORE UPDATE ON merchant_exclusions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_merchants_updated_at
  BEFORE UPDATE ON merchants
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function: Validate merchant domain format
CREATE OR REPLACE FUNCTION validate_domain_format()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Ensure domain is lowercase and has valid format
  IF NEW.merchant_domain IS NOT NULL THEN
    NEW.merchant_domain = lower(trim(NEW.merchant_domain));
    
    -- Basic domain validation (contains at least one dot, no spaces)
    IF NEW.merchant_domain !~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$' THEN
      RAISE EXCEPTION 'Invalid domain format: %', NEW.merchant_domain;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_merchant_exclusions_validate_domain
  BEFORE INSERT OR UPDATE ON merchant_exclusions
  FOR EACH ROW
  EXECUTE FUNCTION validate_domain_format();

-- Function: Validate domain in merchants table
CREATE OR REPLACE FUNCTION validate_merchants_domain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.domain = lower(trim(NEW.domain));
  
  IF NEW.domain !~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$' THEN
    RAISE EXCEPTION 'Invalid domain format: %', NEW.domain;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_merchants_validate_domain
  BEFORE INSERT OR UPDATE ON merchants
  FOR EACH ROW
  EXECUTE FUNCTION validate_merchants_domain();

-- Function: Validate evaluations domain
CREATE OR REPLACE FUNCTION validate_evaluations_domain()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.merchant_domain = lower(trim(NEW.merchant_domain));
  
  IF NEW.merchant_domain !~ '^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$' THEN
    RAISE EXCEPTION 'Invalid domain format: %', NEW.merchant_domain;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_evaluations_validate_domain
  BEFORE INSERT OR UPDATE ON merchant_category_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION validate_evaluations_domain();

-- Comments
COMMENT ON FUNCTION update_updated_at_column IS 'Automatically updates updated_at timestamp on row modification';
COMMENT ON FUNCTION validate_domain_format IS 'Validates and normalizes merchant domain format';
