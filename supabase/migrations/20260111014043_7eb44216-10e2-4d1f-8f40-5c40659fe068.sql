-- Add missing columns for Credit Pathway Engine
-- credit_history: none = new, thin = <2 years, established = 2+ years
-- has_derogatories: late payments, collections, etc.

ALTER TABLE public.user_credit_profile
ADD COLUMN IF NOT EXISTS credit_history text CHECK (credit_history IN ('none', 'thin', 'established')),
ADD COLUMN IF NOT EXISTS has_derogatories boolean NOT NULL DEFAULT false;

-- Add comment for documentation
COMMENT ON COLUMN public.user_credit_profile.credit_history IS 'Credit history depth: none (new to credit), thin (<2 years), established (2+ years)';
COMMENT ON COLUMN public.user_credit_profile.has_derogatories IS 'Whether user has negative marks (late payments, collections, etc.)';