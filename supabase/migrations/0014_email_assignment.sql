-- Add assigned_to column to email_addresses for member-level email assignment
ALTER TABLE public.email_addresses ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Add assigned_email_ids column to invitations for pre-selecting email assignments
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS assigned_email_ids jsonb DEFAULT '[]'::jsonb;

-- Update email_addresses RLS: domain owners + workspace admins see all, members see assigned
DROP POLICY IF EXISTS "Users can manage own email_addresses" ON public.email_addresses;
DROP POLICY IF EXISTS "Domain owners can manage" ON public.email_addresses;
CREATE POLICY "Domain owners can manage" ON public.email_addresses
  FOR ALL USING (domain_id IN (SELECT id FROM public.domains WHERE user_id = auth.uid()));
DROP POLICY IF EXISTS "Workspace admins can manage" ON public.email_addresses;
CREATE POLICY "Workspace admins can manage" ON public.email_addresses
  FOR ALL USING (workspace_id IN (
    SELECT workspace_id FROM public.workspace_members
    WHERE user_id = auth.uid() AND role = 'admin'
  ));
DROP POLICY IF EXISTS "Members can view assigned" ON public.email_addresses;
CREATE POLICY "Members can view assigned" ON public.email_addresses
  FOR SELECT USING (assigned_to = auth.uid());

-- Allow workspace admins to SELECT domains (needed for email_addresses join)
DROP POLICY IF EXISTS "Workspace admins can view domains" ON public.domains;
CREATE POLICY "Workspace admins can view domains" ON public.domains
  FOR SELECT USING (
    id IN (
      SELECT domain_id FROM public.email_addresses
      WHERE workspace_id IN (
        SELECT workspace_id FROM public.workspace_members
        WHERE user_id = auth.uid() AND role = 'admin'
      )
    )
  );
