-- CardClutch Truth Engine: Sources & Provenance
-- Execution order: 013
-- Spec: GLOBAL_BACKEND_SPECIFICATION.md Section 2
--
-- PURPOSE: Every verified fact must have a source
-- NO HALLUCINATED FACTS - if unknown, mark needs_review

-- Helper function to normalize URLs
CREATE OR REPLACE FUNCTION normalize_url(url TEXT)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
DECLARE
  normalized TEXT;
BEGIN
  -- Lowercase, strip fragments (#...), strip trailing slash
  normalized := lower(url);
  normalized := regexp_replace(normalized, '#.*$', '');
  normalized := regexp_replace(normalized, '/$', '');
  normalized := regexp_replace(normalized, '^https?://(www\.)?', '');
  RETURN normalized;
END;
$$;

-- Sources table - primary provenance record
CREATE TABLE sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_type source_type NOT NULL,
  url TEXT NOT NULL,
  url_normalized TEXT GENERATED ALWAYS AS (normalize_url(url)) STORED,
  title TEXT,
  issuer_id UUID REFERENCES issuers(id) ON DELETE SET NULL,
  card_id UUID REFERENCES credit_cards(id) ON DELETE SET NULL,
  merchant_id UUID REFERENCES merchants(id) ON DELETE SET NULL,
  retrieved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  content_hash_sha256 TEXT,
  notes TEXT,
  is_authoritative BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Constraints: at least one entity reference required
  CONSTRAINT sources_has_entity CHECK (
    issuer_id IS NOT NULL OR 
    card_id IS NOT NULL OR 
    merchant_id IS NOT NULL
  ),
  CONSTRAINT sources_url_not_empty CHECK (length(trim(url)) > 0)
);

-- Partial unique indexes for source deduplication
CREATE UNIQUE INDEX idx_sources_unique_card 
  ON sources (source_type, url_normalized, card_id) 
  WHERE card_id IS NOT NULL;

CREATE UNIQUE INDEX idx_sources_unique_issuer 
  ON sources (source_type, url_normalized, issuer_id) 
  WHERE issuer_id IS NOT NULL AND card_id IS NULL;

CREATE UNIQUE INDEX idx_sources_unique_merchant 
  ON sources (source_type, url_normalized, merchant_id) 
  WHERE merchant_id IS NOT NULL AND card_id IS NULL AND issuer_id IS NULL;

-- General indexes
CREATE INDEX idx_sources_card_id ON sources (card_id) WHERE card_id IS NOT NULL;
CREATE INDEX idx_sources_issuer_id ON sources (issuer_id) WHERE issuer_id IS NOT NULL;
CREATE INDEX idx_sources_merchant_id ON sources (merchant_id) WHERE merchant_id IS NOT NULL;
CREATE INDEX idx_sources_source_type ON sources (source_type);
CREATE INDEX idx_sources_url_normalized ON sources (url_normalized);
CREATE INDEX idx_sources_authoritative ON sources (is_authoritative) WHERE is_authoritative = true;
CREATE INDEX idx_sources_retrieved_at ON sources (retrieved_at DESC);

-- Entity-Sources junction (many-to-many provenance)
CREATE TABLE entity_sources (
  entity_type entity_type NOT NULL,
  entity_id UUID NOT NULL,
  source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
  citation_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  PRIMARY KEY (entity_type, entity_id, source_id)
);

-- Indexes
CREATE INDEX idx_entity_sources_entity ON entity_sources (entity_type, entity_id);
CREATE INDEX idx_entity_sources_source ON entity_sources (source_id);

-- Comments
COMMENT ON TABLE sources IS 'Primary provenance record - every verified fact must link here';
COMMENT ON COLUMN sources.url_normalized IS 'Lowercase, fragment-stripped URL for deduplication';
COMMENT ON COLUMN sources.content_hash_sha256 IS 'SHA256 of retrieved content for change detection';
COMMENT ON COLUMN sources.is_authoritative IS 'If true, this source takes precedence on conflicts';
COMMENT ON TABLE entity_sources IS 'Links any entity to its supporting sources';
COMMENT ON COLUMN entity_sources.citation_note IS 'Specific excerpt or section reference';
