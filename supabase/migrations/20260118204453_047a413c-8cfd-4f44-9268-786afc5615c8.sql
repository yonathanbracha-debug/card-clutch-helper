-- Add rate limiting table enhancements for ask-credit-question
-- Ensure proper indexing and cleanup

-- Add missing indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_rate_limits_bucket_scope ON public.rate_limits(bucket, scope);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window_start ON public.rate_limits(window_start);
CREATE INDEX IF NOT EXISTS idx_rate_limits_cleanup ON public.rate_limits(updated_at);

-- Add scope_type column for better categorization (if not exists)
DO $$ BEGIN
  ALTER TABLE public.rate_limits ADD COLUMN IF NOT EXISTS scope_type text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.rate_limits ADD COLUMN IF NOT EXISTS scope_key text;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.rate_limits ADD COLUMN IF NOT EXISTS blocked_until timestamptz;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE public.rate_limits ADD COLUMN IF NOT EXISTS window_size_seconds integer;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Create a scheduled cleanup function (runs daily via cron)
CREATE OR REPLACE FUNCTION public.cleanup_old_rate_limits()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  deleted_count integer;
BEGIN
  DELETE FROM public.rate_limits
  WHERE updated_at < now() - interval '30 days';
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$;

-- Add comment for documentation
COMMENT ON FUNCTION public.cleanup_old_rate_limits() IS 'Cleans up rate_limits records older than 30 days. Should be called via pg_cron or edge function.';