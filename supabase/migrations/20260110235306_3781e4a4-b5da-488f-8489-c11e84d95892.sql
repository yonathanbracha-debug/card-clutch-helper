-- Add calibration and experience level fields to user_preferences
ALTER TABLE public.user_preferences 
ADD COLUMN IF NOT EXISTS experience_level text NOT NULL DEFAULT 'beginner',
ADD COLUMN IF NOT EXISTS calibration_completed boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS calibration_responses jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS myth_flags jsonb DEFAULT '{}'::jsonb;

-- Add check constraint for experience_level
ALTER TABLE public.user_preferences 
ADD CONSTRAINT valid_experience_level CHECK (experience_level IN ('beginner', 'intermediate', 'advanced'));