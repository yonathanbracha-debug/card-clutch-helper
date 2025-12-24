
-- Create merchant_exclusions table if not exists
CREATE TABLE IF NOT EXISTS merchant_exclusions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES credit_cards(id) ON DELETE CASCADE,
  merchant_pattern TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE merchant_exclusions ENABLE ROW LEVEL SECURITY;

-- Allow public read access (catalog data)
CREATE POLICY "Anyone can read merchant exclusions"
  ON merchant_exclusions FOR SELECT
  USING (true);

-- Add slug column to credit_cards for easier lookups
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS slug TEXT;

-- Add foreign_tx_fee_percent column
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS foreign_tx_fee_percent NUMERIC;

-- Add credits_summary column  
ALTER TABLE credit_cards ADD COLUMN IF NOT EXISTS credits_summary TEXT;

-- Create index for slug lookups
CREATE INDEX IF NOT EXISTS idx_credit_cards_slug ON credit_cards(slug);

-- Add notes column to card_reward_rules for things like "U.S. supermarkets only"
ALTER TABLE card_reward_rules ADD COLUMN IF NOT EXISTS notes TEXT;

-- Add priority column for ordering
ALTER TABLE card_reward_rules ADD COLUMN IF NOT EXISTS priority INT DEFAULT 0;
