-- Create user_credit_profile table (dedicated onboarding + calibration store)
CREATE TABLE public.user_credit_profile (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  experience_level text NOT NULL DEFAULT 'beginner' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced')),
  intent text NOT NULL DEFAULT 'both' CHECK (intent IN ('score', 'rewards', 'both')),
  carry_balance boolean NOT NULL DEFAULT false,
  bnpl_usage text CHECK (bnpl_usage IN ('never', 'sometimes', 'often')),
  age_bucket text CHECK (age_bucket IN ('<18', '18-20', '21-24', '25-34', '35-44', '45-54', '55+')),
  income_bucket text CHECK (income_bucket IN ('<25k', '25-50k', '50-100k', '100-200k', '200k+')),
  confidence_level text CHECK (confidence_level IN ('low', 'medium', 'high')),
  onboarding_completed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_credit_profile ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Deny anonymous access
CREATE POLICY "Deny anon access to user_credit_profile"
  ON public.user_credit_profile
  FOR SELECT
  TO anon
  USING (false);

-- Authenticated users can only read their own row
CREATE POLICY "Users can select own credit profile"
  ON public.user_credit_profile
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Authenticated users can insert their own row
CREATE POLICY "Users can insert own credit profile"
  ON public.user_credit_profile
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can update their own row
CREATE POLICY "Users can update own credit profile"
  ON public.user_credit_profile
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_user_credit_profile_updated_at
  BEFORE UPDATE ON public.user_credit_profile
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_user_credit_profile_user_id ON public.user_credit_profile(user_id);