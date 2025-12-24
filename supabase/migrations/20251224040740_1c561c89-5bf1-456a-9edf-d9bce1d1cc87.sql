-- =============================================
-- CARDCLUTCH DATABASE SCHEMA (PRODUCTION-READY)
-- =============================================

-- Enums
CREATE TYPE public.user_mode AS ENUM ('rewards', 'conservative');
CREATE TYPE public.utilization_level AS ENUM ('low', 'medium', 'high');
CREATE TYPE public.card_network AS ENUM ('visa', 'mastercard', 'amex', 'discover');
CREATE TYPE public.verification_status AS ENUM ('verified', 'pending', 'stale');

-- =============================================
-- 1. PROFILES (auto-created on signup)
-- =============================================
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  display_name TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

-- =============================================
-- 2. USER PREFERENCES
-- =============================================
CREATE TABLE public.user_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  mode public.user_mode NOT NULL DEFAULT 'rewards',
  onboarding_completed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

-- =============================================
-- 3. ISSUERS (canonical, public read)
-- =============================================
CREATE TABLE public.issuers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  website_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.issuers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read issuers"
  ON public.issuers FOR SELECT
  TO authenticated, anon
  USING (true);

-- =============================================
-- 4. CREDIT CARDS (canonical, bank-grade)
-- =============================================
CREATE TABLE public.credit_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  issuer_id UUID REFERENCES public.issuers(id),
  name TEXT NOT NULL,
  network public.card_network NOT NULL,
  annual_fee_cents INTEGER NOT NULL,
  reward_summary TEXT NOT NULL,
  image_url TEXT,
  terms_url TEXT,
  source_url TEXT NOT NULL,
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  verification_status public.verification_status NOT NULL DEFAULT 'verified',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(issuer_id, name)
);

ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read active cards"
  ON public.credit_cards FOR SELECT
  TO authenticated, anon
  USING (is_active = true);

-- =============================================
-- 5. REWARD CATEGORIES
-- =============================================
CREATE TABLE public.reward_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.reward_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read categories"
  ON public.reward_categories FOR SELECT
  TO authenticated, anon
  USING (true);

-- =============================================
-- 6. CARD REWARD RULES (per-category rates)
-- =============================================
CREATE TABLE public.card_reward_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES public.reward_categories(id),
  multiplier NUMERIC(5,2) NOT NULL,
  description TEXT,
  cap_cents INTEGER,
  cap_period TEXT,
  conditions TEXT,
  exclusions TEXT[],
  source_url TEXT,
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(card_id, category_id)
);

ALTER TABLE public.card_reward_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read reward rules"
  ON public.card_reward_rules FOR SELECT
  TO authenticated, anon
  USING (true);

-- =============================================
-- 7. MERCHANTS (verified registry)
-- =============================================
CREATE TABLE public.merchants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  category_id UUID REFERENCES public.reward_categories(id),
  verification_status public.verification_status NOT NULL DEFAULT 'pending',
  is_warehouse BOOLEAN NOT NULL DEFAULT false,
  excluded_from_grocery BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.merchants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read verified merchants"
  ON public.merchants FOR SELECT
  TO authenticated, anon
  USING (verification_status = 'verified');

-- =============================================
-- 8. USER WALLET CARDS
-- =============================================
CREATE TABLE public.user_wallet_cards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  card_id UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
  utilization_status public.utilization_level NOT NULL DEFAULT 'low',
  do_not_recommend BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, card_id)
);

ALTER TABLE public.user_wallet_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own wallet"
  ON public.user_wallet_cards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can add to wallet"
  ON public.user_wallet_cards FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own wallet"
  ON public.user_wallet_cards FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can remove from wallet"
  ON public.user_wallet_cards FOR DELETE
  USING (auth.uid() = user_id);

-- =============================================
-- 9. RECOMMENDATION AUDIT LOG
-- =============================================
CREATE TABLE public.recommendation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  url TEXT NOT NULL,
  domain TEXT,
  merchant_id UUID REFERENCES public.merchants(id),
  category_slug TEXT,
  recommended_card_id UUID REFERENCES public.credit_cards(id),
  multiplier NUMERIC(5,2),
  confidence TEXT NOT NULL,
  explanation TEXT,
  decision_path JSONB,
  runner_up_card_id UUID REFERENCES public.credit_cards(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.recommendation_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs"
  ON public.recommendation_logs FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
  ON public.recommendation_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 10. DATA ISSUE REPORTS
-- =============================================
CREATE TABLE public.data_issue_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  card_id UUID REFERENCES public.credit_cards(id),
  merchant_id UUID REFERENCES public.merchants(id),
  issue_type TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.data_issue_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own reports"
  ON public.data_issue_reports FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can submit reports"
  ON public.data_issue_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- =============================================
-- 11. TRIGGERS
-- =============================================

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (NEW.id, NEW.email);
  
  INSERT INTO public.user_preferences (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Updated_at triggers
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_credit_cards_updated_at
  BEFORE UPDATE ON public.credit_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_merchants_updated_at
  BEFORE UPDATE ON public.merchants
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_wallet_cards_updated_at
  BEFORE UPDATE ON public.user_wallet_cards
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 12. INDEXES
-- =============================================
CREATE INDEX idx_credit_cards_issuer ON public.credit_cards(issuer_id);
CREATE INDEX idx_credit_cards_network ON public.credit_cards(network);
CREATE INDEX idx_card_reward_rules_card ON public.card_reward_rules(card_id);
CREATE INDEX idx_card_reward_rules_category ON public.card_reward_rules(category_id);
CREATE INDEX idx_user_wallet_cards_user ON public.user_wallet_cards(user_id);
CREATE INDEX idx_merchants_domain ON public.merchants(domain);
CREATE INDEX idx_recommendation_logs_user ON public.recommendation_logs(user_id);
CREATE INDEX idx_recommendation_logs_created ON public.recommendation_logs(created_at DESC);