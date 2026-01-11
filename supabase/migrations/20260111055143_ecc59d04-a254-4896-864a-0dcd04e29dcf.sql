-- ============================================
-- BNPL/Purchase Risk Intelligence - Prompt 9
-- ============================================

-- Create enum for BNPL providers
CREATE TYPE bnpl_provider AS ENUM (
  'affirm',
  'klarna',
  'afterpay',
  'zip',
  'sezzle',
  'paypal_pay_in_4',
  'other'
);

-- Create enum for risk levels
CREATE TYPE risk_level AS ENUM ('low', 'medium', 'high');

-- Create purchase_risk_events table
CREATE TABLE public.purchase_risk_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  merchant text NOT NULL,
  amount integer NOT NULL, -- in cents
  bnpl_detected boolean NOT NULL DEFAULT false,
  bnpl_provider text NULL,
  risk_level text NOT NULL DEFAULT 'low',
  risk_score integer NOT NULL DEFAULT 0,
  user_classification text NULL, -- 'essential', 'planned', 'impulse', 'unsure'
  explanation text[] NOT NULL DEFAULT '{}',
  alternatives text[] NOT NULL DEFAULT '{}',
  user_prompt_shown boolean NOT NULL DEFAULT false,
  suppressed boolean NOT NULL DEFAULT false,
  suppression_reason text NULL,
  context jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create benefit_usage table for tracking
CREATE TABLE public.benefit_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  benefit_id text NOT NULL,
  card_name text NOT NULL,
  issuer text NOT NULL,
  period_start date NOT NULL,
  period_end date NOT NULL,
  value_usd numeric NOT NULL,
  used_amount numeric NOT NULL DEFAULT 0,
  usage_count integer NOT NULL DEFAULT 0,
  last_used_at timestamptz NULL,
  status text NOT NULL DEFAULT 'available', -- 'available', 'partial', 'claimed', 'expired'
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, benefit_id, period_start)
);

-- Enable RLS
ALTER TABLE public.purchase_risk_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.benefit_usage ENABLE ROW LEVEL SECURITY;

-- RLS Policies for purchase_risk_events
CREATE POLICY "Deny anon access to purchase_risk_events"
  ON public.purchase_risk_events FOR SELECT
  USING (false);

CREATE POLICY "Users can select own risk events"
  ON public.purchase_risk_events FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own risk events"
  ON public.purchase_risk_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own risk events"
  ON public.purchase_risk_events FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- RLS Policies for benefit_usage
CREATE POLICY "Deny anon access to benefit_usage"
  ON public.benefit_usage FOR SELECT
  USING (false);

CREATE POLICY "Users can select own benefit usage"
  ON public.benefit_usage FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own benefit usage"
  ON public.benefit_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own benefit usage"
  ON public.benefit_usage FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own benefit usage"
  ON public.benefit_usage FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes for efficient queries
CREATE INDEX idx_purchase_risk_events_user ON public.purchase_risk_events(user_id, created_at DESC);
CREATE INDEX idx_purchase_risk_events_bnpl ON public.purchase_risk_events(user_id, bnpl_detected) WHERE bnpl_detected = true;
CREATE INDEX idx_benefit_usage_user ON public.benefit_usage(user_id, period_start DESC);
CREATE INDEX idx_benefit_usage_status ON public.benefit_usage(user_id, status);