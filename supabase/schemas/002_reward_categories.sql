-- Reward Categories Table (Controlled Taxonomy)
-- Spec: Section 5.3
-- Execution order: 002

CREATE TABLE reward_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  display_name TEXT NOT NULL,
  formal_definition TEXT NOT NULL,
  common_misclassifications TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT reward_categories_slug_format CHECK (slug ~ '^[a-z][a-z0-9_]*$'),
  CONSTRAINT reward_categories_slug_not_empty CHECK (length(trim(slug)) > 0),
  CONSTRAINT reward_categories_display_name_not_empty CHECK (length(trim(display_name)) > 0)
);

-- Indexes
CREATE INDEX idx_reward_categories_slug ON reward_categories (slug);
CREATE INDEX idx_reward_categories_display_name ON reward_categories (display_name);

-- Comments
COMMENT ON TABLE reward_categories IS 'Controlled taxonomy of spending categories - no overlap allowed';
COMMENT ON COLUMN reward_categories.slug IS 'Machine-readable identifier (e.g., groceries, dining, travel)';
COMMENT ON COLUMN reward_categories.formal_definition IS 'Precise legal/financial definition of this category';
COMMENT ON COLUMN reward_categories.common_misclassifications IS 'Known confusions (e.g., groceries ≠ warehouse_clubs)';
