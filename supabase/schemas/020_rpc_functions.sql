-- CardClutch Truth Engine: RPC Functions
-- Execution order: 020
-- Spec: GLOBAL_BACKEND_SPECIFICATION.md Section 9
--
-- PURPOSE: Stable functions for frontend integration
-- These are the ONLY way frontend should query recommendation logic

-- (1) Resolve merchant from URL
CREATE OR REPLACE FUNCTION rpc_resolve_merchant(p_url TEXT)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  domain_normalized TEXT;
  result_id UUID;
BEGIN
  -- Normalize the URL to domain
  domain_normalized := normalize_domain(p_url);
  
  IF domain_normalized IS NULL OR domain_normalized = '' THEN
    RETURN NULL;
  END IF;
  
  -- Use the resolve function from 015
  result_id := resolve_merchant_from_domain(domain_normalized);
  
  RETURN result_id;
END;
$$;

-- (2) Infer category from URL
CREATE OR REPLACE FUNCTION rpc_infer_category(
  p_url TEXT,
  p_page_title TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  merchant_id UUID;
  category_id UUID;
  domain_normalized TEXT;
BEGIN
  domain_normalized := normalize_domain(p_url);
  
  -- First try to resolve merchant
  merchant_id := resolve_merchant_from_domain(domain_normalized);
  
  IF merchant_id IS NOT NULL THEN
    -- Get merchant's default category if verified
    SELECT m.default_category_id INTO category_id
    FROM merchants m
    WHERE m.id = merchant_id
      AND m.verification_status = 'verified'
      AND m.default_category_id IS NOT NULL;
      
    IF category_id IS NOT NULL THEN
      RETURN category_id;
    END IF;
  END IF;
  
  -- Fallback: check AI inference table for approved suggestions
  SELECT mci.suggested_category_id INTO category_id
  FROM merchant_category_inference mci
  WHERE mci.merchant_domain = domain_normalized
    AND mci.accepted = true
    AND mci.reviewed_by_human = true
  ORDER BY mci.confidence_score DESC
  LIMIT 1;
  
  IF category_id IS NOT NULL THEN
    RETURN category_id;
  END IF;
  
  -- No category found - return NULL (caller should use fallback)
  RETURN NULL;
END;
$$;

-- (3) Main recommendation function
CREATE OR REPLACE FUNCTION rpc_recommend_card(
  p_user_id UUID,
  p_url TEXT,
  p_page_title TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_domain TEXT;
  v_merchant_id UUID;
  v_category_id UUID;
  v_brand_id UUID;
  v_user_mode user_mode;
  v_safety_threshold safety_threshold;
  v_recommended_card RECORD;
  v_applied_rules JSONB := '[]'::JSONB;
  v_excluded_rules JSONB := '[]'::JSONB;
  v_warnings JSONB := '[]'::JSONB;
  v_confidence NUMERIC(3,2) := 0.00;
  v_provenance JSONB := '[]'::JSONB;
  v_result JSONB;
  v_card RECORD;
  v_rule RECORD;
  v_exclusion RECORD;
  v_best_multiplier NUMERIC(6,3) := 0;
  v_best_card_id UUID;
  v_best_rule_id UUID;
  v_override RECORD;
BEGIN
  -- Normalize domain
  v_domain := normalize_domain(p_url);
  
  -- Get user preferences
  SELECT mode, safety_threshold INTO v_user_mode, v_safety_threshold
  FROM user_preferences
  WHERE user_id = p_user_id;
  
  -- Default if no preferences
  v_user_mode := COALESCE(v_user_mode, 'optimize_rewards');
  v_safety_threshold := COALESCE(v_safety_threshold, 'balanced');
  
  -- Check for user override first
  SELECT * INTO v_override
  FROM user_merchant_overrides
  WHERE user_id = p_user_id
    AND domain_normalized = v_domain;
    
  IF v_override IS NOT NULL THEN
    v_merchant_id := v_override.forced_merchant_id;
    v_category_id := v_override.forced_category_id;
    v_warnings := v_warnings || jsonb_build_object('type', 'user_override', 'message', 'Using your custom category for this merchant');
  ELSE
    -- Resolve merchant
    v_merchant_id := resolve_merchant_from_domain(v_domain);
    
    -- Get category from merchant or infer
    IF v_merchant_id IS NOT NULL THEN
      SELECT m.default_category_id INTO v_category_id
      FROM merchants m
      WHERE m.id = v_merchant_id
        AND m.verification_status = 'verified';
        
      -- Get brand if any
      SELECT mbm.brand_id INTO v_brand_id
      FROM merchant_brand_members mbm
      WHERE mbm.merchant_id = v_merchant_id
      LIMIT 1;
    END IF;
    
    -- If no category, try inference
    IF v_category_id IS NULL THEN
      v_category_id := rpc_infer_category(p_url, p_page_title);
    END IF;
  END IF;
  
  -- Calculate confidence
  IF v_merchant_id IS NOT NULL AND v_category_id IS NOT NULL THEN
    v_confidence := 1.00;
  ELSIF v_merchant_id IS NOT NULL THEN
    v_confidence := 0.70;
    v_warnings := v_warnings || jsonb_build_object('type', 'category_inferred', 'message', 'Category was inferred, not verified');
  ELSIF v_category_id IS NOT NULL THEN
    v_confidence := 0.50;
    v_warnings := v_warnings || jsonb_build_object('type', 'merchant_unknown', 'message', 'Merchant not in verified database');
  ELSE
    v_confidence := 0.40;
    v_warnings := v_warnings || jsonb_build_object('type', 'fallback', 'message', 'Using flat-rate fallback - merchant and category unknown');
  END IF;
  
  -- Iterate through user's cards to find best option
  FOR v_card IN
    SELECT uc.*, cc.official_product_name, cc.annual_fee_cents, cc.verification_status AS card_verification
    FROM user_cards uc
    JOIN v_cards_current cc ON uc.card_id = cc.id
    WHERE uc.user_id = p_user_id
      AND uc.do_not_recommend = false
    ORDER BY cc.annual_fee_cents ASC
  LOOP
    -- Check for exclusions
    SELECT * INTO v_exclusion
    FROM check_exclusion(
      v_card.card_id,
      v_merchant_id,
      v_domain,
      v_brand_id,
      v_category_id
    );
    
    IF v_exclusion.is_excluded THEN
      v_excluded_rules := v_excluded_rules || jsonb_build_object(
        'card_id', v_card.card_id,
        'card_name', v_card.official_product_name,
        'reason', v_exclusion.exclusion_reason
      );
      CONTINUE;
    END IF;
    
    -- Get best rule for this card
    SELECT * INTO v_rule
    FROM get_best_rule(
      v_card.card_id,
      v_category_id,
      v_merchant_id,
      v_brand_id,
      'any'::payment_method
    );
    
    IF v_rule.rule_id IS NOT NULL THEN
      -- Apply protect_credit penalty if applicable
      DECLARE
        effective_multiplier NUMERIC(6,3);
      BEGIN
        effective_multiplier := v_rule.multiplier;
        
        IF v_user_mode = 'protect_credit' THEN
          IF v_card.utilization_level = 'high' THEN
            effective_multiplier := effective_multiplier * 0.5;
          ELSIF v_card.utilization_level = 'medium' AND v_safety_threshold = 'strict' THEN
            effective_multiplier := effective_multiplier * 0.75;
          END IF;
        END IF;
        
        IF effective_multiplier > v_best_multiplier THEN
          v_best_multiplier := effective_multiplier;
          v_best_card_id := v_card.card_id;
          v_best_rule_id := v_rule.rule_id;
        END IF;
      END;
      
      v_applied_rules := v_applied_rules || jsonb_build_object(
        'card_id', v_card.card_id,
        'card_name', v_card.official_product_name,
        'rule_id', v_rule.rule_id,
        'multiplier', v_rule.multiplier,
        'requires_enrollment', v_rule.requires_enrollment,
        'has_cap', v_rule.spend_cap_cents IS NOT NULL
      );
    ELSE
      -- No specific rule - check for flat rate
      SELECT r.* INTO v_rule
      FROM v_rules_current r
      WHERE r.card_id = v_card.card_id
        AND r.rule_type = 'flat_rate'
        AND r.verification_status IN ('verified', 'pending')
      LIMIT 1;
      
      IF v_rule IS NOT NULL AND COALESCE(v_rule.flat_rate, 0) > v_best_multiplier THEN
        v_best_multiplier := v_rule.flat_rate;
        v_best_card_id := v_card.card_id;
        v_best_rule_id := v_rule.rule_id;
      END IF;
    END IF;
  END LOOP;
  
  -- Build result
  IF v_best_card_id IS NOT NULL THEN
    SELECT * INTO v_recommended_card
    FROM v_cards_current
    WHERE id = v_best_card_id;
    
    v_result := jsonb_build_object(
      'recommended_card_id', v_best_card_id,
      'recommended_card_name', v_recommended_card.official_product_name,
      'category_id', v_category_id,
      'category_name', (SELECT display_name FROM reward_categories WHERE id = v_category_id),
      'merchant_id', v_merchant_id,
      'merchant_name', (SELECT canonical_name FROM merchants WHERE id = v_merchant_id),
      'confidence', v_confidence,
      'effective_multiplier', v_best_multiplier,
      'applied_rules', v_applied_rules,
      'excluded_rules', v_excluded_rules,
      'warnings', v_warnings,
      'explain', CASE 
        WHEN v_confidence >= 0.9 THEN format('%s earns %sx on this purchase', v_recommended_card.official_product_name, v_best_multiplier)
        WHEN v_confidence >= 0.5 THEN format('%s is likely best (%sx) but category was inferred', v_recommended_card.official_product_name, v_best_multiplier)
        ELSE format('Using %s as flat-rate fallback', v_recommended_card.official_product_name)
      END,
      'provenance', jsonb_build_array(
        jsonb_build_object('entity_type', 'card', 'entity_id', v_best_card_id),
        jsonb_build_object('entity_type', 'rule', 'entity_id', v_best_rule_id)
      ),
      'timestamp', now()
    );
  ELSE
    v_result := jsonb_build_object(
      'recommended_card_id', NULL,
      'recommended_card_name', NULL,
      'category_id', v_category_id,
      'merchant_id', v_merchant_id,
      'confidence', 0,
      'applied_rules', '[]'::JSONB,
      'excluded_rules', v_excluded_rules,
      'warnings', v_warnings || jsonb_build_object('type', 'no_cards', 'message', 'No eligible cards found in your wallet'),
      'explain', 'No card recommendation available - add cards to your wallet',
      'timestamp', now()
    );
  END IF;
  
  -- Log to audit
  INSERT INTO recommendation_audit_log (
    merchant_domain,
    resolved_category_id,
    winning_card_id,
    evaluated_cards,
    decision_reasoning,
    decision_path,
    confidence_score
  ) VALUES (
    v_domain,
    v_category_id,
    v_best_card_id,
    (SELECT array_agg(card_id) FROM user_cards WHERE user_id = p_user_id),
    v_result->>'explain',
    v_result,
    v_confidence
  );
  
  -- Log to search history
  INSERT INTO user_search_history (
    user_id,
    url_searched,
    resolved_merchant_id,
    resolved_category_id,
    recommended_card_id,
    confidence_score
  ) VALUES (
    p_user_id,
    p_url,
    v_merchant_id,
    v_category_id,
    v_best_card_id,
    v_confidence
  );
  
  RETURN v_result;
END;
$$;

-- Lightweight version for anonymous users (no personalization)
CREATE OR REPLACE FUNCTION rpc_recommend_card_anonymous(
  p_url TEXT,
  p_card_ids UUID[]
)
RETURNS JSONB
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_domain TEXT;
  v_merchant_id UUID;
  v_category_id UUID;
  v_brand_id UUID;
  v_best_card RECORD;
  v_best_multiplier NUMERIC(6,3) := 0;
  v_best_rule_id UUID;
  v_confidence NUMERIC(3,2);
  v_warnings JSONB := '[]'::JSONB;
  v_applied_rules JSONB := '[]'::JSONB;
  v_excluded_rules JSONB := '[]'::JSONB;
  v_card RECORD;
  v_rule RECORD;
  v_exclusion RECORD;
BEGIN
  v_domain := normalize_domain(p_url);
  v_merchant_id := resolve_merchant_from_domain(v_domain);
  
  IF v_merchant_id IS NOT NULL THEN
    SELECT m.default_category_id INTO v_category_id
    FROM merchants m WHERE m.id = v_merchant_id AND m.verification_status = 'verified';
    
    SELECT mbm.brand_id INTO v_brand_id
    FROM merchant_brand_members mbm WHERE mbm.merchant_id = v_merchant_id LIMIT 1;
  END IF;
  
  IF v_category_id IS NULL THEN
    v_category_id := rpc_infer_category(p_url, NULL);
  END IF;
  
  -- Calculate confidence
  v_confidence := CASE 
    WHEN v_merchant_id IS NOT NULL AND v_category_id IS NOT NULL THEN 1.00
    WHEN v_merchant_id IS NOT NULL THEN 0.70
    WHEN v_category_id IS NOT NULL THEN 0.50
    ELSE 0.40
  END;
  
  -- Evaluate each provided card
  FOR v_card IN
    SELECT cc.*
    FROM v_cards_current cc
    WHERE cc.id = ANY(p_card_ids)
  LOOP
    -- Check exclusions
    SELECT * INTO v_exclusion
    FROM check_exclusion(v_card.id, v_merchant_id, v_domain, v_brand_id, v_category_id);
    
    IF v_exclusion.is_excluded THEN
      v_excluded_rules := v_excluded_rules || jsonb_build_object(
        'card_id', v_card.id,
        'card_name', v_card.official_product_name,
        'reason', v_exclusion.exclusion_reason
      );
      CONTINUE;
    END IF;
    
    -- Get best rule
    SELECT * INTO v_rule
    FROM get_best_rule(v_card.id, v_category_id, v_merchant_id, v_brand_id, 'any');
    
    IF v_rule.rule_id IS NOT NULL AND COALESCE(v_rule.multiplier, 0) > v_best_multiplier THEN
      v_best_multiplier := v_rule.multiplier;
      v_best_card := v_card;
      v_best_rule_id := v_rule.rule_id;
    END IF;
    
    IF v_rule.rule_id IS NOT NULL THEN
      v_applied_rules := v_applied_rules || jsonb_build_object(
        'card_id', v_card.id,
        'card_name', v_card.official_product_name,
        'multiplier', v_rule.multiplier,
        'requires_enrollment', v_rule.requires_enrollment
      );
    END IF;
  END LOOP;
  
  -- Return result
  RETURN jsonb_build_object(
    'recommended_card_id', v_best_card.id,
    'recommended_card_name', v_best_card.official_product_name,
    'category_id', v_category_id,
    'category_name', (SELECT display_name FROM reward_categories WHERE id = v_category_id),
    'merchant_id', v_merchant_id,
    'confidence', v_confidence,
    'effective_multiplier', v_best_multiplier,
    'applied_rules', v_applied_rules,
    'excluded_rules', v_excluded_rules,
    'warnings', v_warnings,
    'timestamp', now()
  );
END;
$$;

-- Comments
COMMENT ON FUNCTION rpc_resolve_merchant IS 'Resolves URL to merchant_id';
COMMENT ON FUNCTION rpc_infer_category IS 'Infers category from URL, uses verified data only';
COMMENT ON FUNCTION rpc_recommend_card IS 'Main recommendation for authenticated users';
COMMENT ON FUNCTION rpc_recommend_card_anonymous IS 'Lightweight recommendation for anonymous users';
