-- CardClutch Truth Engine: Merchant Identity System
-- Execution order: 015
-- Spec: GLOBAL_BACKEND_SPECIFICATION.md Section 4
--
-- PURPOSE: Proper merchant resolution via domain, alias, and brand family
-- This is the HARD PART - accurate merchant identification

-- Helper function to normalize domains
CREATE OR REPLACE FUNCTION normalize_domain(raw_domain TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  normalized TEXT;
BEGIN
  -- Lowercase, strip www., strip protocol, strip path
  normalized := lower(raw_domain);
  normalized := regexp_replace(normalized, '^https?://', '');
  normalized := regexp_replace(normalized, '^www\.', '');
  normalized := regexp_replace(normalized, '/.*$', '');
  RETURN normalized;
END;
$$;

-- Merchant Domains - multiple domains per merchant
CREATE TABLE merchant_domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  domain_normalized TEXT GENERATED ALWAYS AS (normalize_domain(domain)) STORED,
  match_type match_type NOT NULL DEFAULT 'exact',
  confidence NUMERIC(4,3) NOT NULL DEFAULT 1.000,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints
  CONSTRAINT merchant_domains_confidence_range CHECK (confidence >= 0 AND confidence <= 1),
  CONSTRAINT merchant_domains_domain_not_empty CHECK (length(trim(domain)) > 0)
);

-- Unique constraint on normalized domain + match type
CREATE UNIQUE INDEX idx_merchant_domains_unique 
  ON merchant_domains (domain_normalized, match_type);

-- Indexes for lookup
CREATE INDEX idx_merchant_domains_domain ON merchant_domains (domain_normalized);
CREATE INDEX idx_merchant_domains_merchant ON merchant_domains (merchant_id);
CREATE INDEX idx_merchant_domains_match_type ON merchant_domains (match_type);
CREATE INDEX idx_merchant_domains_confidence ON merchant_domains (confidence DESC);

-- Merchant Aliases - alternate names
CREATE TABLE merchant_aliases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  alias TEXT NOT NULL,
  alias_normalized TEXT GENERATED ALWAYS AS (
    lower(regexp_replace(alias, '[^a-z0-9]+', '', 'gi'))
  ) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT merchant_aliases_alias_not_empty CHECK (length(trim(alias)) > 0)
);

-- Unique on normalized alias
CREATE UNIQUE INDEX idx_merchant_aliases_unique ON merchant_aliases (alias_normalized);
CREATE INDEX idx_merchant_aliases_merchant ON merchant_aliases (merchant_id);

-- Merchant Brands - brand families (e.g., Walmart family includes walmart.com, grocery.walmart.com)
CREATE TABLE merchant_brands (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL,
  brand_normalized TEXT GENERATED ALWAYS AS (
    lower(regexp_replace(brand_name, '[^a-z0-9]+', '', 'gi'))
  ) STORED,
  description TEXT,
  parent_brand_id UUID REFERENCES merchant_brands(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT merchant_brands_name_not_empty CHECK (length(trim(brand_name)) > 0)
);

CREATE UNIQUE INDEX idx_merchant_brands_unique ON merchant_brands (brand_normalized);

-- Brand members junction
CREATE TABLE merchant_brand_members (
  brand_id UUID NOT NULL REFERENCES merchant_brands(id) ON DELETE CASCADE,
  merchant_id UUID NOT NULL REFERENCES merchants(id) ON DELETE CASCADE,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  PRIMARY KEY (brand_id, merchant_id)
);

CREATE INDEX idx_merchant_brand_members_merchant ON merchant_brand_members (merchant_id);
CREATE INDEX idx_merchant_brand_members_primary ON merchant_brand_members (brand_id) WHERE is_primary = true;

-- Function to resolve merchant from URL
CREATE OR REPLACE FUNCTION resolve_merchant_from_domain(input_domain TEXT)
RETURNS UUID
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  normalized_domain TEXT;
  result_merchant_id UUID;
BEGIN
  normalized_domain := normalize_domain(input_domain);
  
  -- Priority 1: Exact match
  SELECT merchant_id INTO result_merchant_id
  FROM merchant_domains
  WHERE domain_normalized = normalized_domain
    AND match_type = 'exact'
  ORDER BY confidence DESC
  LIMIT 1;
  
  IF result_merchant_id IS NOT NULL THEN
    RETURN result_merchant_id;
  END IF;
  
  -- Priority 2: Suffix match (e.g., "store.example.com" matches ".example.com")
  SELECT merchant_id INTO result_merchant_id
  FROM merchant_domains
  WHERE match_type = 'suffix'
    AND normalized_domain LIKE '%' || domain_normalized
  ORDER BY length(domain_normalized) DESC, confidence DESC
  LIMIT 1;
  
  IF result_merchant_id IS NOT NULL THEN
    RETURN result_merchant_id;
  END IF;
  
  -- Priority 3: Contains match
  SELECT merchant_id INTO result_merchant_id
  FROM merchant_domains
  WHERE match_type = 'contains'
    AND normalized_domain LIKE '%' || domain_normalized || '%'
  ORDER BY length(domain_normalized) DESC, confidence DESC
  LIMIT 1;
  
  IF result_merchant_id IS NOT NULL THEN
    RETURN result_merchant_id;
  END IF;
  
  -- Priority 4: Regex match (most expensive, used sparingly)
  SELECT merchant_id INTO result_merchant_id
  FROM merchant_domains
  WHERE match_type = 'regex'
    AND normalized_domain ~ domain_normalized
  ORDER BY confidence DESC
  LIMIT 1;
  
  RETURN result_merchant_id; -- May be NULL
END;
$$;

-- Comments
COMMENT ON TABLE merchant_domains IS 'Multiple domains per merchant with match type priority';
COMMENT ON COLUMN merchant_domains.match_type IS 'exact > suffix > contains > regex (resolution priority)';
COMMENT ON TABLE merchant_aliases IS 'Alternate names for merchant lookup (e.g., "McDs" → "McDonalds")';
COMMENT ON TABLE merchant_brands IS 'Brand families for exclusion grouping (e.g., Walmart family)';
COMMENT ON TABLE merchant_brand_members IS 'Links merchants to brand families';
COMMENT ON FUNCTION resolve_merchant_from_domain IS 'Resolves domain to merchant_id using priority matching';
