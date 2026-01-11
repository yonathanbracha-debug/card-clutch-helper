-- Add priority_score column to to_dos table
ALTER TABLE public.to_dos 
ADD COLUMN IF NOT EXISTS priority_score numeric NOT NULL DEFAULT 0;

-- Create index for priority sorting
CREATE INDEX IF NOT EXISTS idx_to_dos_priority ON public.to_dos (user_id, status, priority_score DESC);

-- Create user_feedback table for insight override memory
CREATE TABLE public.user_feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  insight_type text NOT NULL,
  insight_key text NOT NULL,
  feedback text NOT NULL CHECK (feedback IN ('incorrect', 'correct', 'suppress')),
  reason text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, insight_type, insight_key)
);

-- Enable RLS on user_feedback
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- RLS policies for user_feedback - strict owner-only access
CREATE POLICY "Users can view own feedback" 
ON public.user_feedback 
FOR SELECT 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can create own feedback" 
ON public.user_feedback 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update own feedback" 
ON public.user_feedback 
FOR UPDATE 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can delete own feedback" 
ON public.user_feedback 
FOR DELETE 
USING (auth.uid() IS NOT NULL AND auth.uid() = user_id);

-- Create index for feedback lookups
CREATE INDEX idx_user_feedback_lookup ON public.user_feedback (user_id, insight_type, insight_key);