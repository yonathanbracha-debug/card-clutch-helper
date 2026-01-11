-- Create to_dos table for finance hygiene tasks
CREATE TABLE public.to_dos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('cancel_subscription', 'review_subscription', 'claim_benefit', 'switch_card_rule', 'contact_issuer', 'set_autopay', 'verify_statement')),
  title text NOT NULL,
  description text NOT NULL,
  cta_label text,
  cta_url text,
  impact_usd numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'done', 'snoozed')),
  snooze_until timestamptz,
  source jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.to_dos ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Users can only manage their own to-dos
CREATE POLICY "Deny anon access to to_dos"
  ON public.to_dos
  FOR SELECT
  TO anon
  USING (false);

CREATE POLICY "Users can select own to_dos"
  ON public.to_dos
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own to_dos"
  ON public.to_dos
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own to_dos"
  ON public.to_dos
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own to_dos"
  ON public.to_dos
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Indexes for performance
CREATE INDEX idx_to_dos_user_status ON public.to_dos(user_id, status);
CREATE INDEX idx_to_dos_user_type ON public.to_dos(user_id, type);
CREATE INDEX idx_to_dos_user_snooze ON public.to_dos(user_id, snooze_until);

-- Trigger for updated_at
CREATE TRIGGER update_to_dos_updated_at
  BEFORE UPDATE ON public.to_dos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add card_rules column to user_preferences if it doesn't exist
ALTER TABLE public.user_preferences 
  ADD COLUMN IF NOT EXISTS card_rules jsonb DEFAULT '[]'::jsonb;