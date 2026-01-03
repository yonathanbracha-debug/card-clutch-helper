-- Fix data_issue_reports SELECT policies - change from RESTRICTIVE to PERMISSIVE
-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Admins can view all reports" ON public.data_issue_reports;
DROP POLICY IF EXISTS "Users can view own reports" ON public.data_issue_reports;

-- Create permissive policies (default behavior)
CREATE POLICY "Users can view own reports" 
ON public.data_issue_reports 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reports" 
ON public.data_issue_reports 
FOR SELECT 
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));

-- Ensure analytics_events cannot be read by non-admins when user_id is NULL
-- Current policy already restricts to admin, but let's make it explicit
DROP POLICY IF EXISTS "Admins can read all events" ON public.analytics_events;
CREATE POLICY "Only admins can read events"
ON public.analytics_events
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));