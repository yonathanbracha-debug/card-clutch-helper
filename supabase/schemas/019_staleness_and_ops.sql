-- CardClutch Truth Engine: Staleness & Operations
-- Execution order: 019
-- Spec: GLOBAL_BACKEND_SPECIFICATION.md Section 8
--
-- PURPOSE: Prevent data rot with staleness detection and review queues
-- All facts must be periodically re-verified

-- Function to check if an entity is stale
CREATE OR REPLACE FUNCTION is_stale(
  p_last_verified_at TIMESTAMPTZ,
  p_verification_status verification_status,
  p_max_age_days INTEGER DEFAULT 180
)
RETURNS BOOLEAN
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- Never verified = definitely stale
  IF p_last_verified_at IS NULL THEN
    RETURN true;
  END IF;
  
  -- Explicitly stale/needs_review/disputed
  IF p_verification_status IN ('stale', 'needs_review', 'disputed') THEN
    RETURN true;
  END IF;
  
  -- Older than max age
  IF p_last_verified_at < (now() - (p_max_age_days || ' days')::INTERVAL) THEN
    RETURN true;
  END IF;
  
  RETURN false;
END;
$$;

-- Unified view of stale entities
CREATE OR REPLACE VIEW v_stale_entities AS
-- Stale credit cards
SELECT 
  'card'::entity_type AS entity_type,
  id AS entity_id,
  official_product_name AS entity_name,
  verification_status,
  last_verified_at,
  CASE 
    WHEN last_verified_at IS NULL THEN 'never_verified'
    WHEN verification_status IN ('stale', 'needs_review', 'disputed') THEN 'status_' || verification_status::TEXT
    ELSE 'older_than_180_days'
  END AS stale_reason,
  created_at
FROM credit_cards
WHERE is_stale(last_verified_at, verification_status, 180)
  AND discontinued = false

UNION ALL

-- Stale reward rules
SELECT 
  'rule'::entity_type,
  r.id,
  c.official_product_name || ' - ' || COALESCE(cat.display_name, 'Unknown'),
  r.verification_status,
  r.last_verified_at,
  CASE 
    WHEN r.last_verified_at IS NULL THEN 'never_verified'
    WHEN r.verification_status IN ('stale', 'needs_review', 'disputed') THEN 'status_' || r.verification_status::TEXT
    ELSE 'older_than_180_days'
  END,
  r.created_at
FROM card_reward_rules r
JOIN credit_cards c ON r.card_id = c.id
LEFT JOIN reward_categories cat ON r.category_id = cat.id
WHERE is_stale(r.last_verified_at, r.verification_status, 180)
  AND (r.effective_end_date IS NULL OR r.effective_end_date >= CURRENT_DATE)

UNION ALL

-- Stale merchants
SELECT 
  'merchant'::entity_type,
  id,
  canonical_name,
  verification_status,
  last_verified_at,
  CASE 
    WHEN last_verified_at IS NULL THEN 'never_verified'
    WHEN verification_status IN ('stale', 'needs_review', 'disputed') THEN 'status_' || verification_status::TEXT
    ELSE 'older_than_180_days'
  END,
  created_at
FROM merchants
WHERE is_stale(last_verified_at, verification_status, 180)
  AND (effective_end_date IS NULL OR effective_end_date >= CURRENT_DATE);

-- Priority review queue (most-used entities first)
CREATE OR REPLACE VIEW v_top_priority_review_queue AS
WITH entity_usage AS (
  -- Count how often each card is recommended
  SELECT 
    'card'::entity_type AS entity_type,
    recommended_card_id AS entity_id,
    COUNT(*) AS usage_count
  FROM user_search_history
  WHERE recommended_card_id IS NOT NULL
    AND created_at > now() - INTERVAL '30 days'
  GROUP BY recommended_card_id
  
  UNION ALL
  
  -- Count how often each merchant is resolved
  SELECT 
    'merchant'::entity_type,
    resolved_merchant_id,
    COUNT(*)
  FROM user_search_history
  WHERE resolved_merchant_id IS NOT NULL
    AND created_at > now() - INTERVAL '30 days'
  GROUP BY resolved_merchant_id
)
SELECT 
  s.entity_type,
  s.entity_id,
  s.entity_name,
  s.verification_status,
  s.last_verified_at,
  s.stale_reason,
  COALESCE(u.usage_count, 0) AS usage_count,
  CASE 
    WHEN s.stale_reason = 'never_verified' THEN 1
    WHEN s.stale_reason LIKE 'status_%' THEN 2
    ELSE 3
  END AS priority_tier
FROM v_stale_entities s
LEFT JOIN entity_usage u ON s.entity_type = u.entity_type AND s.entity_id = u.entity_id
ORDER BY 
  priority_tier ASC,
  COALESCE(u.usage_count, 0) DESC,
  s.created_at ASC
LIMIT 100;

-- Verification schedule table (for tracking verification cadence)
CREATE TABLE verification_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  scheduled_for DATE NOT NULL,
  priority INTEGER NOT NULL DEFAULT 100,
  assigned_to UUID REFERENCES profiles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'skipped')),
  completed_at TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT verification_schedule_unique UNIQUE (entity_type, entity_id, scheduled_for)
);

-- Indexes
CREATE INDEX idx_verification_schedule_date ON verification_schedule (scheduled_for) 
  WHERE status = 'pending';
CREATE INDEX idx_verification_schedule_assigned ON verification_schedule (assigned_to) 
  WHERE status IN ('pending', 'in_progress');
CREATE INDEX idx_verification_schedule_entity ON verification_schedule (entity_type, entity_id);

-- Function to schedule verification for stale entities
CREATE OR REPLACE FUNCTION schedule_stale_verifications(
  p_target_date DATE DEFAULT CURRENT_DATE + 7
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  scheduled_count INTEGER := 0;
BEGIN
  INSERT INTO verification_schedule (entity_type, entity_id, scheduled_for, priority)
  SELECT 
    entity_type,
    entity_id,
    p_target_date,
    CASE 
      WHEN stale_reason = 'never_verified' THEN 1
      WHEN stale_reason LIKE 'status_%' THEN 2
      ELSE 3
    END
  FROM v_stale_entities
  WHERE NOT EXISTS (
    SELECT 1 FROM verification_schedule vs
    WHERE vs.entity_type = v_stale_entities.entity_type
      AND vs.entity_id = v_stale_entities.entity_id
      AND vs.status = 'pending'
  )
  ON CONFLICT (entity_type, entity_id, scheduled_for) DO NOTHING;
  
  GET DIAGNOSTICS scheduled_count = ROW_COUNT;
  RETURN scheduled_count;
END;
$$;

-- Data quality metrics view
CREATE OR REPLACE VIEW v_data_quality_metrics AS
SELECT 
  'cards_total' AS metric,
  COUNT(*)::NUMERIC AS value
FROM credit_cards WHERE discontinued = false

UNION ALL

SELECT 
  'cards_verified',
  COUNT(*)::NUMERIC
FROM credit_cards 
WHERE discontinued = false AND verification_status = 'verified'

UNION ALL

SELECT 
  'cards_stale',
  COUNT(*)::NUMERIC
FROM credit_cards 
WHERE discontinued = false AND is_stale(last_verified_at, verification_status, 180)

UNION ALL

SELECT 
  'rules_total',
  COUNT(*)::NUMERIC
FROM v_rules_current

UNION ALL

SELECT 
  'rules_verified',
  COUNT(*)::NUMERIC
FROM v_rules_current
WHERE verification_status = 'verified'

UNION ALL

SELECT 
  'merchants_verified',
  COUNT(*)::NUMERIC
FROM v_merchants_current
WHERE verification_status = 'verified'

UNION ALL

SELECT 
  'avg_days_since_verification',
  COALESCE(AVG(EXTRACT(DAY FROM now() - last_verified_at)), 0)
FROM credit_cards
WHERE last_verified_at IS NOT NULL AND discontinued = false;

-- Comments
COMMENT ON FUNCTION is_stale IS 'Returns true if entity needs re-verification';
COMMENT ON VIEW v_stale_entities IS 'All entities needing verification across all types';
COMMENT ON VIEW v_top_priority_review_queue IS 'Stale entities ranked by usage frequency';
COMMENT ON TABLE verification_schedule IS 'Scheduled verification tasks';
COMMENT ON FUNCTION schedule_stale_verifications IS 'Creates verification tasks for all stale entities';
COMMENT ON VIEW v_data_quality_metrics IS 'Key metrics for data quality monitoring';
