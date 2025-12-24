-- CardClutch Truth Engine: Audit & Change Control
-- Execution order: 018
-- Spec: GLOBAL_BACKEND_SPECIFICATION.md Section 7
--
-- PURPOSE: Bank-grade audit trail for all canonical data changes
-- Every change is logged, timestamped, and attributed

-- Canonical change log - the master audit table
CREATE TABLE canonical_change_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  action change_action NOT NULL,
  actor_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- NULL for system actions
  actor_type TEXT NOT NULL DEFAULT 'user', -- 'user', 'system', 'migration'
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  
  -- For verification actions, track sources
  sources_used UUID[],
  
  -- Human-readable summary
  change_summary TEXT
);

-- Indexes
CREATE INDEX idx_canonical_change_log_entity ON canonical_change_log (entity_type, entity_id);
CREATE INDEX idx_canonical_change_log_action ON canonical_change_log (action);
CREATE INDEX idx_canonical_change_log_actor ON canonical_change_log (actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX idx_canonical_change_log_date ON canonical_change_log (created_at DESC);
CREATE INDEX idx_canonical_change_log_entity_date ON canonical_change_log (entity_type, entity_id, created_at DESC);

-- Function to require sources for verification
CREATE OR REPLACE FUNCTION require_sources_for_verification(
  p_entity_type entity_type,
  p_entity_id UUID
)
RETURNS VOID
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  source_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO source_count
  FROM entity_sources
  WHERE entity_type = p_entity_type
    AND entity_id = p_entity_id;
    
  IF source_count = 0 THEN
    RAISE EXCEPTION 'Cannot verify entity without at least one source. Entity: % %', p_entity_type, p_entity_id;
  END IF;
END;
$$;

-- Function to log canonical changes
CREATE OR REPLACE FUNCTION log_canonical_change(
  p_entity_type entity_type,
  p_entity_id UUID,
  p_action change_action,
  p_actor_id UUID DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::JSONB,
  p_sources UUID[] DEFAULT NULL,
  p_summary TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO canonical_change_log (
    entity_type, entity_id, action, actor_id, metadata, sources_used, change_summary
  ) VALUES (
    p_entity_type, p_entity_id, p_action, p_actor_id, p_metadata, p_sources, p_summary
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$;

-- Data correction requests (for disputed data)
CREATE TABLE data_correction_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  requested_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  current_value JSONB NOT NULL,
  proposed_value JSONB NOT NULL,
  reason TEXT NOT NULL,
  supporting_sources TEXT[], -- URLs to supporting evidence
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'withdrawn')),
  reviewed_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT data_correction_requests_reason_not_empty CHECK (length(trim(reason)) > 0)
);

-- Indexes
CREATE INDEX idx_data_correction_requests_entity ON data_correction_requests (entity_type, entity_id);
CREATE INDEX idx_data_correction_requests_status ON data_correction_requests (status);
CREATE INDEX idx_data_correction_requests_pending ON data_correction_requests (created_at DESC) 
  WHERE status = 'pending';

-- System health metrics (for monitoring)
CREATE TABLE system_health_metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC NOT NULL,
  metric_unit TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  metadata JSONB
);

-- Index for time-series queries
CREATE INDEX idx_system_health_metrics_name_date ON system_health_metrics (metric_name, recorded_at DESC);

-- Comments
COMMENT ON TABLE canonical_change_log IS 'Master audit log for all canonical data changes';
COMMENT ON COLUMN canonical_change_log.metadata IS 'JSON with before/after values, context';
COMMENT ON COLUMN canonical_change_log.sources_used IS 'Source IDs used to justify verification';
COMMENT ON FUNCTION require_sources_for_verification IS 'Enforces sources requirement before verification';
COMMENT ON FUNCTION log_canonical_change IS 'Convenience function to log changes with proper structure';
COMMENT ON TABLE data_correction_requests IS 'User-submitted corrections for disputed data';
COMMENT ON TABLE system_health_metrics IS 'Operational metrics for monitoring data quality';
