-- A1: Create user_ai_preferences table
CREATE TABLE public.user_ai_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  answer_depth text NOT NULL DEFAULT 'beginner' CHECK (answer_depth IN ('beginner', 'intermediate', 'advanced')),
  tone text NOT NULL DEFAULT 'direct' CHECK (tone IN ('direct', 'friendly', 'strict')),
  last_calibrated_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_ai_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Deny anonymous access
CREATE POLICY "Deny anon access to user_ai_preferences"
  ON public.user_ai_preferences
  FOR SELECT
  TO anon
  USING (false);

-- Authenticated users can only access their own row
CREATE POLICY "Users can select own ai preferences"
  ON public.user_ai_preferences
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own ai preferences"
  ON public.user_ai_preferences
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ai preferences"
  ON public.user_ai_preferences
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own ai preferences"
  ON public.user_ai_preferences
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_user_ai_preferences_updated_at
  BEFORE UPDATE ON public.user_ai_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- A2: Create user_calibration table
CREATE TABLE public.user_calibration (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  knows_statement_vs_due boolean,
  understands_utilization boolean,
  has_budgeting_habit boolean,
  has_emergency_fund boolean,
  goal_score boolean,
  goal_rewards boolean,
  carry_balance boolean,
  bnpl_usage text CHECK (bnpl_usage IN ('never', 'sometimes', 'often')),
  confidence_level text CHECK (confidence_level IN ('low', 'medium', 'high')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_calibration ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Deny anonymous access
CREATE POLICY "Deny anon access to user_calibration"
  ON public.user_calibration
  FOR SELECT
  TO anon
  USING (false);

-- Authenticated users can only access their own row
CREATE POLICY "Users can select own calibration"
  ON public.user_calibration
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own calibration"
  ON public.user_calibration
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calibration"
  ON public.user_calibration
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own calibration"
  ON public.user_calibration
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Add updated_at trigger
CREATE TRIGGER update_user_calibration_updated_at
  BEFORE UPDATE ON public.user_calibration
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- A3: Extend rag_queries with new columns
ALTER TABLE public.rag_queries 
  ADD COLUMN IF NOT EXISTS answer_schema_version int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS answer_depth text CHECK (answer_depth IN ('beginner', 'intermediate', 'advanced')),
  ADD COLUMN IF NOT EXISTS myth_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS calibration_needed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS calibration_questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS routing jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS redacted_question text,
  ADD COLUMN IF NOT EXISTS redacted_answer jsonb;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_ai_preferences_user_id ON public.user_ai_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_calibration_user_id ON public.user_calibration(user_id);
CREATE INDEX IF NOT EXISTS idx_rag_queries_myth_flags ON public.rag_queries USING GIN(myth_flags);
CREATE INDEX IF NOT EXISTS idx_rag_queries_routing ON public.rag_queries USING GIN(routing);