-- CardClutch Truth Engine: RLS Hardening
-- Execution order: 021
-- Spec: GLOBAL_BACKEND_SPECIFICATION.md Section 10
--
-- PURPOSE: Lock down all tables with proper RLS
-- No public writes, minimal exposure, user data protected

-- Enable RLS on all tables
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE entity_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_domains ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_aliases ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_brand_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_merchant_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE canonical_change_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE data_correction_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE system_health_metrics ENABLE ROW LEVEL SECURITY;

-- ============================================
-- REFERENCE DATA (Public read, no write)
-- ============================================

-- Sources: read-only for authenticated users
CREATE POLICY "Sources are readable by authenticated users"
  ON sources FOR SELECT
  TO authenticated
  USING (true);

-- Entity sources: read-only
CREATE POLICY "Entity sources are readable by authenticated users"
  ON entity_sources FOR SELECT
  TO authenticated
  USING (true);

-- Merchant domains: public read (needed for recommendations)
CREATE POLICY "Merchant domains are publicly readable"
  ON merchant_domains FOR SELECT
  TO authenticated, anon
  USING (true);

-- Merchant aliases: public read
CREATE POLICY "Merchant aliases are publicly readable"
  ON merchant_aliases FOR SELECT
  TO authenticated, anon
  USING (true);

-- Merchant brands: public read
CREATE POLICY "Merchant brands are publicly readable"
  ON merchant_brands FOR SELECT
  TO authenticated, anon
  USING (true);

-- Merchant brand members: public read
CREATE POLICY "Merchant brand members are publicly readable"
  ON merchant_brand_members FOR SELECT
  TO authenticated, anon
  USING (true);

-- ============================================
-- USER DATA (Strict user isolation)
-- ============================================

-- Profiles: users can only see/edit their own
CREATE POLICY "Users can view their own profile"
  ON profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- User preferences: strict isolation
CREATE POLICY "Users can view their own preferences"
  ON user_preferences FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own preferences"
  ON user_preferences FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own preferences"
  ON user_preferences FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- User cards: strict isolation
CREATE POLICY "Users can view their own cards"
  ON user_cards FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own cards"
  ON user_cards FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own cards"
  ON user_cards FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own cards"
  ON user_cards FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- User merchant overrides: strict isolation
CREATE POLICY "Users can view their own overrides"
  ON user_merchant_overrides FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own overrides"
  ON user_merchant_overrides FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- User search history: users see only their own
CREATE POLICY "Users can view their own search history"
  ON user_search_history FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Search history insert is handled by RPC function (security definer)

-- ============================================
-- AUDIT/ADMIN DATA (No public access)
-- ============================================

-- Verification events: no public access (admin only via service role)
CREATE POLICY "Verification events are not publicly accessible"
  ON verification_events FOR SELECT
  TO authenticated
  USING (false);

-- Canonical change log: no public access
CREATE POLICY "Canonical change log is not publicly accessible"
  ON canonical_change_log FOR SELECT
  TO authenticated
  USING (false);

-- Verification schedule: no public access
CREATE POLICY "Verification schedule is not publicly accessible"
  ON verification_schedule FOR SELECT
  TO authenticated
  USING (false);

-- System health metrics: no public access
CREATE POLICY "System health metrics are not publicly accessible"
  ON system_health_metrics FOR SELECT
  TO authenticated
  USING (false);

-- Data correction requests: users can see their own
CREATE POLICY "Users can view their own correction requests"
  ON data_correction_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = requested_by);

CREATE POLICY "Users can submit correction requests"
  ON data_correction_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = requested_by);

-- ============================================
-- GRANT EXECUTE ON RPC FUNCTIONS
-- ============================================

-- Allow anonymous users to use basic recommendation
GRANT EXECUTE ON FUNCTION rpc_resolve_merchant(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_infer_category(TEXT, TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION rpc_recommend_card_anonymous(TEXT, UUID[]) TO anon, authenticated;

-- Authenticated only for personalized recommendations
GRANT EXECUTE ON FUNCTION rpc_recommend_card(UUID, TEXT, TEXT) TO authenticated;

-- Helper functions
GRANT EXECUTE ON FUNCTION normalize_domain(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION normalize_url(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION resolve_merchant_from_domain(TEXT) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION get_best_rule(UUID, UUID, UUID, UUID, payment_method) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION check_exclusion(UUID, UUID, TEXT, UUID, UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION is_stale(TIMESTAMPTZ, verification_status, INTEGER) TO authenticated;

-- Comments
COMMENT ON POLICY "Sources are readable by authenticated users" ON sources IS 'Sources visible for transparency but not editable';
COMMENT ON POLICY "Users can view their own profile" ON profiles IS 'Strict user isolation';
COMMENT ON POLICY "Verification events are not publicly accessible" ON verification_events IS 'Admin-only via service role';
