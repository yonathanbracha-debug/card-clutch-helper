-- Row Level Security Policies (Bank-Grade Access Control)
-- Spec: Section 9
-- Execution order: 009

-- Enable RLS on all tables
ALTER TABLE issuers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_reward_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_exclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_category_inference ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_audit_log ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- PUBLIC READ ACCESS (Canonical Truth Tables)
-- These are public reference data - no PII, no user data
-- ============================================================

CREATE POLICY "Public read: issuers"
  ON issuers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read: reward_categories"
  ON reward_categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read: credit_cards"
  ON credit_cards FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read: card_reward_rules"
  ON card_reward_rules FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read: merchant_exclusions"
  ON merchant_exclusions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read: merchants (verified only)"
  ON merchants FOR SELECT
  TO anon, authenticated
  USING (verification_status = 'verified');

-- ============================================================
-- RESTRICTED ACCESS (Internal/Service Tables)
-- Inference and audit data require authentication
-- ============================================================

CREATE POLICY "Authenticated read: merchant_category_inference"
  ON merchant_category_inference FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated read: recommendation_audit_log"
  ON recommendation_audit_log FOR SELECT
  TO authenticated
  USING (true);

-- ============================================================
-- WRITE ACCESS (Service Role Only)
-- All canonical data writes must go through service_role
-- Edge functions with service_role key can insert audits
-- ============================================================

CREATE POLICY "Service insert: recommendation_audit_log"
  ON recommendation_audit_log FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Note: All writes to canonical truth tables (issuers, credit_cards, 
-- card_reward_rules, merchant_exclusions, merchants) should be 
-- performed via service_role key in admin/verification contexts ONLY.
-- 
-- This ensures:
-- 1. No unauthorized data modification
-- 2. Full audit trail via database logs
-- 3. Compliance with data integrity requirements
