-- Create waitlist_subscribers table
CREATE TABLE public.waitlist_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  utm_source text NULL,
  utm_campaign text NULL,
  referrer text NULL
);

-- Enable RLS
ALTER TABLE public.waitlist_subscribers ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for landing page)
CREATE POLICY "Anyone can subscribe to waitlist"
ON public.waitlist_subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Only admin can read waitlist
CREATE POLICY "Admins can view waitlist"
ON public.waitlist_subscribers
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role));