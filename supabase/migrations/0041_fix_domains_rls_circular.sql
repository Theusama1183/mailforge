-- Fix circular RLS policies between domains and email_addresses
-- The old policies created infinite recursion:
--   email_addresses "Domain owners can manage"          => SELECT FROM domains
--   -> domains "Workspace admins can view domains"      => SELECT FROM email_addresses
--   -> email_addresses RLS triggers again               => INFINITE RECURSION (42P17)
--
-- Fix: use SECURITY DEFINER functions to break the cycle.
-- These run with the owner's privileges (bypass RLS), so the subqueries
-- to email_addresses won't trigger email_addresses RLS policies.

-- SECURITY DEFINER helper: returns domain_ids linked to workspaces the
-- current user administers (for the admin policy).
CREATE OR REPLACE FUNCTION public.get_admin_domain_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT domain_id FROM public.email_addresses
  WHERE workspace_id IN (
    SELECT workspace_id FROM public.workspace_members
    WHERE user_id = auth.uid() AND role = 'admin'
  );
$$;

-- SECURITY DEFINER helper: returns domain_ids linked to email addresses
-- assigned to the current user (for the member policy).
CREATE OR REPLACE FUNCTION public.get_assigned_domain_ids()
RETURNS SETOF UUID
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT DISTINCT domain_id FROM public.email_addresses
  WHERE assigned_to = auth.uid();
$$;

-- Workspace admins can view domains linked to their workspaces
DROP POLICY IF EXISTS "Workspace admins can view domains" ON public.domains;
CREATE POLICY "Workspace admins can view domains" ON public.domains
  FOR SELECT USING (
    user_id = auth.uid()
    OR id IN (SELECT public.get_admin_domain_ids())
  );

-- Members can view domains linked to their assigned email addresses
DROP POLICY IF EXISTS "Members can view assigned domains" ON public.domains;
CREATE POLICY "Members can view assigned domains" ON public.domains
  FOR SELECT USING (
    user_id = auth.uid()
    OR id IN (SELECT public.get_assigned_domain_ids())
  );

NOTIFY pgrst, 'reload schema';
