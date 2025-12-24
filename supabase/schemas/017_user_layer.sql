-- CardClutch Truth Engine: User Layer
-- Execution order: 017
-- Spec: GLOBAL_BACKEND_SPECIFICATION.md Section 6
--
-- PURPOSE: User profiles, saved cards, preferences, overrides
-- Foundation for personalized recommendations

-- User mode for recommendation strategy
CREATE TYPE user_mode AS ENUM (
  'optimize_rewards',
  'protect_credit'
);

-- User safety threshold
CREATE TYPE safety_threshold AS ENUM (
  'strict',
  'balanced',
  'aggressive'
);

-- Utilization level for credit protection mode
CREATE TYPE utilization_level AS ENUM (
  'low',      -- <10% utilization
  'medium',   -- 10-30%
  'high'      -- >30%
);

-- User profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  email TEXT,
  locale TEXT NOT NULL DEFAULT 'en-US',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User preferences table
CREATE TABLE user_preferences (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  mode user_mode NOT NULL DEFAULT 'optimize_rewards',
  safety_threshold safety_threshold NOT NULL DEFAULT 'balanced',
  notify_stale_cards BOOLEAN NOT NULL DEFAULT true,
  notify_better_options BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User's saved cards (their wallet)
CREATE TABLE user_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
  utilization_level utilization_level NOT NULL DEFAULT 'low',
  do_not_recommend BOOLEAN NOT NULL DEFAULT false,
  nickname TEXT,
  notes TEXT,
  added_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT user_cards_unique UNIQUE (user_id, card_id)
);

-- Indexes
CREATE INDEX idx_user_cards_user ON user_cards (user_id);
CREATE INDEX idx_user_cards_card ON user_cards (card_id);
CREATE INDEX idx_user_cards_active ON user_cards (user_id) WHERE do_not_recommend = false;

-- User merchant overrides (force category for specific domains)
CREATE TABLE user_merchant_overrides (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  domain_normalized TEXT GENERATED ALWAYS AS (normalize_domain(domain)) STORED,
  forced_category_id UUID REFERENCES reward_categories(id) ON DELETE SET NULL,
  forced_merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT user_merchant_overrides_unique UNIQUE (user_id, domain_normalized),
  CONSTRAINT user_merchant_overrides_has_override CHECK (
    forced_category_id IS NOT NULL OR forced_merchant_id IS NOT NULL
  )
);

-- Indexes
CREATE INDEX idx_user_merchant_overrides_user ON user_merchant_overrides (user_id);
CREATE INDEX idx_user_merchant_overrides_domain ON user_merchant_overrides (domain_normalized);

-- User search history (for analytics and suggestions)
CREATE TABLE user_search_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id) ON DELETE SET NULL, -- NULL for anonymous
  url_searched TEXT NOT NULL,
  domain_normalized TEXT GENERATED ALWAYS AS (normalize_domain(url_searched)) STORED,
  resolved_merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
  resolved_category_id UUID REFERENCES reward_categories(id) ON DELETE SET NULL,
  recommended_card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL,
  confidence_score NUMERIC(3,2),
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_user_search_history_user ON user_search_history (user_id) WHERE user_id IS NOT NULL;
CREATE INDEX idx_user_search_history_domain ON user_search_history (domain_normalized);
CREATE INDEX idx_user_search_history_date ON user_search_history (created_at DESC);
CREATE INDEX idx_user_search_history_merchant ON user_search_history (resolved_merchant_id) 
  WHERE resolved_merchant_id IS NOT NULL;

-- Function to create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  
  INSERT INTO user_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- Comments
COMMENT ON TABLE profiles IS 'User profile data - created automatically on signup';
COMMENT ON TABLE user_preferences IS 'User recommendation preferences';
COMMENT ON TABLE user_cards IS 'Cards in user wallet for personalized recommendations';
COMMENT ON COLUMN user_cards.utilization_level IS 'Current utilization - affects protect_credit mode';
COMMENT ON COLUMN user_cards.do_not_recommend IS 'User disabled this card from recommendations';
COMMENT ON TABLE user_merchant_overrides IS 'User-specified category overrides for domains';
COMMENT ON TABLE user_search_history IS 'Search history for analytics and improvement';
