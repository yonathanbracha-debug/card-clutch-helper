-- Add onboarding fields to user_preferences
ALTER TABLE public.user_preferences 
  ADD COLUMN IF NOT EXISTS intent text CHECK (intent IN ('optimize_score', 'maximize_rewards', 'both')) DEFAULT 'both',
  ADD COLUMN IF NOT EXISTS carry_balance boolean DEFAULT false;

-- Create cleanup function for old rate_limits records
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

-- Grant execute to service role only
REVOKE ALL ON FUNCTION public.cleanup_old_rate_limits() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.cleanup_old_rate_limits() TO service_role;

-- Standard index for cleanup performance (no partial predicate)
CREATE INDEX IF NOT EXISTS idx_rate_limits_updated_at ON public.rate_limits (updated_at);

-- Add comment documenting the cleanup procedure
COMMENT ON FUNCTION public.cleanup_old_rate_limits() IS 
  'Cleanup function to remove rate_limits records older than 30 days. 
   Should be called via scheduled job or cron. Returns count of deleted rows.';