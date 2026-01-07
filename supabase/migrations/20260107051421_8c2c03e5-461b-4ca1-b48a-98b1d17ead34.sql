-- Rate Limiting Table for Server-Side Enforcement
-- Tracks request counts per bucket (IP hash or user ID) per scope

CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket TEXT NOT NULL,
  scope TEXT NOT NULL,
  window_start TIMESTAMPTZ NOT NULL DEFAULT now(),
  count INTEGER NOT NULL DEFAULT 1,
  blocked_until TIMESTAMPTZ,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for efficient lookups (no partial index with now())
CREATE INDEX IF NOT EXISTS idx_rate_limits_bucket_scope ON public.rate_limits (bucket, scope);
CREATE INDEX IF NOT EXISTS idx_rate_limits_bucket_scope_window ON public.rate_limits (bucket, scope, window_start DESC);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits (window_start);

-- Enable RLS
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- No public access - only service role can read/write
CREATE POLICY "Service role only: rate_limits"
  ON public.rate_limits
  FOR ALL
  USING (false)
  WITH CHECK (false);

-- Security events logging table
CREATE TABLE IF NOT EXISTS public.security_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),
  ip_hash TEXT,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- Index for querying
CREATE INDEX IF NOT EXISTS idx_security_events_type ON public.security_events (event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_security_events_user ON public.security_events (user_id) WHERE user_id IS NOT NULL;

-- Enable RLS
ALTER TABLE public.security_events ENABLE ROW LEVEL SECURITY;

-- Only admins can read security events
CREATE POLICY "Admins can read security events"
  ON public.security_events
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

-- No public write - only service role
CREATE POLICY "Service role only: security_events insert"
  ON public.security_events
  FOR INSERT
  WITH CHECK (false);

-- Cleanup function for old rate limit entries
CREATE OR REPLACE FUNCTION cleanup_old_rate_limits()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = public
AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '2 days';
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

COMMENT ON TABLE public.rate_limits IS 'Server-side rate limiting buckets - service role access only';
COMMENT ON TABLE public.security_events IS 'Immutable security event log - admin read only';