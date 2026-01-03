-- Create card_url_health table for URL health check results
CREATE TABLE IF NOT EXISTS public.card_url_health (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  card_id UUID NOT NULL REFERENCES public.credit_cards(id) ON DELETE CASCADE,
  url_type TEXT NOT NULL CHECK (url_type IN ('terms', 'source', 'image')),
  url TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('ok', 'redirect', 'broken', 'invalid')),
  http_status INTEGER,
  error_text TEXT,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.card_url_health ENABLE ROW LEVEL SECURITY;

-- Admin-only policies
CREATE POLICY "Admins can view url health"
ON public.card_url_health
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can insert url health"
ON public.card_url_health
FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update url health"
ON public.card_url_health
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete url health"
ON public.card_url_health
FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Index for faster lookups
CREATE INDEX idx_card_url_health_card_id ON public.card_url_health(card_id);
CREATE INDEX idx_card_url_health_status ON public.card_url_health(status);

-- Comments
COMMENT ON TABLE public.card_url_health IS 'Stores URL health check results for credit card URLs';
COMMENT ON COLUMN public.card_url_health.url_type IS 'Type of URL: terms, source, or image';
COMMENT ON COLUMN public.card_url_health.status IS 'Health status: ok, redirect, broken, or invalid';