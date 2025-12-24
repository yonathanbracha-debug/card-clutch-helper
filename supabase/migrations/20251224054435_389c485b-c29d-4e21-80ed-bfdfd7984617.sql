-- Create URL validation function
CREATE OR REPLACE FUNCTION public.is_valid_http_url(url text)
RETURNS boolean
LANGUAGE plpgsql
IMMUTABLE
SET search_path = public
AS $$
BEGIN
  -- NULL is valid (field is optional)
  IF url IS NULL THEN
    RETURN true;
  END IF;
  
  -- Must start with http:// or https://
  IF NOT (url ~* '^https?://') THEN
    RETURN false;
  END IF;
  
  -- Reject dangerous schemes embedded
  IF url ~* '(javascript:|data:|file:|vbscript:|about:)' THEN
    RETURN false;
  END IF;
  
  -- Basic URL structure: scheme://host with optional path
  IF NOT (url ~* '^https?://[a-z0-9]([a-z0-9\-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9\-]*[a-z0-9])?)+(/.*)?$') THEN
    RETURN false;
  END IF;
  
  RETURN true;
END;
$$;

-- Add CHECK constraint on credit_cards.source_url
ALTER TABLE public.credit_cards 
ADD CONSTRAINT chk_source_url_valid 
CHECK (source_url IS NULL OR is_valid_http_url(source_url));

-- Add CHECK constraint on credit_cards.image_url
ALTER TABLE public.credit_cards 
ADD CONSTRAINT chk_image_url_valid 
CHECK (image_url IS NULL OR is_valid_http_url(image_url));

-- Add CHECK constraint on credit_cards.terms_url
ALTER TABLE public.credit_cards 
ADD CONSTRAINT chk_terms_url_valid 
CHECK (terms_url IS NULL OR is_valid_http_url(terms_url));

-- Add missing issuers for card expansion
INSERT INTO public.issuers (id, name, website_url) VALUES
  ('99999999-9999-9999-9999-999999999999', 'Barclays', 'https://www.barclaycardus.com/'),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Synchrony', 'https://www.synchrony.com/'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'U.S. Bank', 'https://www.usbank.com/'),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'BILT', 'https://www.bilt.com/')
ON CONFLICT (id) DO NOTHING;

-- Update US Bank issuer name to match standard
UPDATE public.issuers SET name = 'US Bank' WHERE id = '88888888-8888-8888-8888-888888888888';