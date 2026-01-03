-- Create is_admin_or_owner helper function
CREATE OR REPLACE FUNCTION public.is_admin_or_owner(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role IN ('admin', 'owner')
  )
$$;

-- Update RLS policies to include owner role where admin is allowed

-- analytics_events: Update admin-only read policy to include owner
DROP POLICY IF EXISTS "Only admins can read events" ON public.analytics_events;
CREATE POLICY "Admins and owners can read events" 
ON public.analytics_events 
FOR SELECT 
USING (is_admin_or_owner(auth.uid()));

-- waitlist_subscribers: Update admin-only read policy to include owner  
DROP POLICY IF EXISTS "Admins can view waitlist" ON public.waitlist_subscribers;
CREATE POLICY "Admins and owners can view waitlist" 
ON public.waitlist_subscribers 
FOR SELECT 
USING (is_admin_or_owner(auth.uid()));

-- security_audit_log: Update admin-only read policy to include owner
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.security_audit_log;
CREATE POLICY "Admins and owners can view audit logs" 
ON public.security_audit_log 
FOR SELECT 
USING (is_admin_or_owner(auth.uid()));

-- user_roles: Allow owners to manage roles
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins and owners can view all roles" 
ON public.user_roles 
FOR SELECT 
USING (is_admin_or_owner(auth.uid()));

-- Allow owners to insert/update/delete roles (for promoting users)
CREATE POLICY "Owners can insert roles" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can update roles" 
ON public.user_roles 
FOR UPDATE 
USING (has_role(auth.uid(), 'owner'));

CREATE POLICY "Owners can delete roles" 
ON public.user_roles 
FOR DELETE 
USING (has_role(auth.uid(), 'owner'));