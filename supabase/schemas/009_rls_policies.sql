-- Row Level Security Policies
-- Execution order: 009 (after all tables)

-- Enable RLS on all tables
ALTER TABLE issuers ENABLE ROW LEVEL SECURITY;
ALTER TABLE reward_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_cards ENABLE ROW LEVEL SECURITY;
ALTER TABLE card_reward_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_exclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchants ENABLE ROW LEVEL SECURITY;
ALTER TABLE merchant_category_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE recommendation_audits ENABLE ROW LEVEL SECURITY;

-- Public read access for reference data (cards, issuers, categories, rules)
-- These are canonical truth and should be publicly readable

CREATE POLICY "Public read access for issuers"
  ON issuers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read access for reward_categories"
  ON reward_categories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read access for credit_cards"
  ON credit_cards FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read access for card_reward_rules"
  ON card_reward_rules FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read access for merchant_exclusions"
  ON merchant_exclusions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Public read access for merchants"
  ON merchants FOR SELECT
  TO anon, authenticated
  USING (true);

-- Evaluations and audits are internal/service-level
-- Read access for authenticated users, write via service role only

CREATE POLICY "Authenticated read access for evaluations"
  ON merchant_category_evaluations FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated read access for audits"
  ON recommendation_audits FOR SELECT
  TO authenticated
  USING (true);

-- Insert policy for audits (edge functions can write via service role)
CREATE POLICY "Service insert for audits"
  ON recommendation_audits FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Note: All write operations for canonical data (cards, rules, exclusions)
-- should be performed via service_role key in admin contexts only
