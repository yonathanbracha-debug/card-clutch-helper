-- Fix overly permissive RLS policy on waitlist_subscribers table
-- The current policy allows anyone to INSERT with any data (WITH CHECK (true))
-- This is flagged by the Supabase linter as a security issue

-- Drop the existing overly permissive INSERT policy
DROP POLICY IF EXISTS "Anyone can subscribe to waitlist" ON public.waitlist_subscribers;

-- Create a more restrictive policy that:
-- 1. Still allows unauthenticated users to subscribe (required for waitlist functionality)
-- 2. Validates that the email field is not null (basic input validation)
-- 3. Uses a proper WITH CHECK expression instead of just (true)
CREATE POLICY "Anyone can subscribe with valid email" 
ON public.waitlist_subscribers 
FOR INSERT 
TO anon, authenticated
WITH CHECK (
  -- Ensure email is provided (not null and not empty)
  email IS NOT NULL 
  AND length(trim(email)) > 0
  -- Basic email format validation
  AND email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$'
);