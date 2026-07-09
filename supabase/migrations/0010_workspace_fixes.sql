-- Fix workspace creation: add missing INSERT policy for workspaces
-- The original migration had SELECT/UPDATE/DELETE but no INSERT policy

DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;
CREATE POLICY "Users can create workspaces"
  ON public.workspaces FOR INSERT
  WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can join as admin on creation" ON public.workspace_members;
CREATE POLICY "Users can join as admin on creation"
  ON public.workspace_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'admin'
    AND workspace_id IN (
      SELECT id FROM public.workspaces WHERE created_by = auth.uid()
    )
  );

-- Add user_preferences table for onboarding state
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  onboarding_complete boolean DEFAULT false,
  accepted_terms_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_preferences;
CREATE POLICY "Users can manage their own preferences"
  ON public.user_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
