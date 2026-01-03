-- Create analytics_events table for tracking key actions
CREATE TABLE public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name text NOT NULL,
  context jsonb NOT NULL DEFAULT '{}'::jsonb,
  url text,
  domain text
);

-- Enable RLS
ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies:
-- Anonymous or authenticated users can insert events (user_id can be null for anonymous)
CREATE POLICY "Anyone can insert events"
ON public.analytics_events
FOR INSERT
WITH CHECK (
  user_id IS NULL OR user_id = auth.uid()
);

-- Only admins can read all events
CREATE POLICY "Admins can read all events"
ON public.analytics_events
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- No updates or deletes (append-only)
-- (No policies means denied by default with RLS enabled)

-- Create index for common queries
CREATE INDEX idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX idx_analytics_events_event_name ON public.analytics_events(event_name);
CREATE INDEX idx_analytics_events_user_id ON public.analytics_events(user_id);
CREATE INDEX idx_analytics_events_domain ON public.analytics_events(domain);

-- Add comment
COMMENT ON TABLE public.analytics_events IS 'Append-only event tracking for product metrics. Users can insert, only admins can read.';

-- Add admin policies for data_issue_reports if they don't exist
-- Allow admin to SELECT all reports
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'data_issue_reports' 
    AND policyname = 'Admins can view all reports'
  ) THEN
    CREATE POLICY "Admins can view all reports"
    ON public.data_issue_reports
    FOR SELECT
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Allow admin to UPDATE reports (for status changes)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'data_issue_reports' 
    AND policyname = 'Admins can update reports'
  ) THEN
    CREATE POLICY "Admins can update reports"
    ON public.data_issue_reports
    FOR UPDATE
    USING (has_role(auth.uid(), 'admin'::app_role));
  END IF;
END $$;

-- Add admin_notes column to data_issue_reports if it doesn't exist
ALTER TABLE public.data_issue_reports 
ADD COLUMN IF NOT EXISTS admin_notes text,
ADD COLUMN IF NOT EXISTS resolved_at timestamptz;