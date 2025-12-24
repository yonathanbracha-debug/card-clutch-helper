-- Reward Categories Table
-- Normalized spending categories (no overlap allowed)
-- Execution order: 002

CREATE TABLE reward_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_reward_categories_name ON reward_categories (name);

-- Comments
COMMENT ON TABLE reward_categories IS 'Normalized reward categories - each category must be mutually exclusive';
COMMENT ON COLUMN reward_categories.name IS 'Category identifier (e.g., dining, groceries, travel)';
