CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.workspace_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

ALTER TABLE public.email_addresses ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;

ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view workspaces they belong to" ON public.workspaces;
CREATE POLICY "Users can view workspaces they belong to"
  ON public.workspaces FOR SELECT
  USING (id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

DROP POLICY IF EXISTS "Workspace creators can update" ON public.workspaces;
CREATE POLICY "Workspace creators can update"
  ON public.workspaces FOR UPDATE
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Workspace creators can delete" ON public.workspaces;
CREATE POLICY "Workspace creators can delete"
  ON public.workspaces FOR DELETE
  USING (created_by = auth.uid());

DROP POLICY IF EXISTS "Users can view their own memberships" ON public.workspace_members;
CREATE POLICY "Users can view their own memberships"
  ON public.workspace_members FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can manage members" ON public.workspace_members;
CREATE POLICY "Admins can manage members"
  ON public.workspace_members FOR ALL
  USING (workspace_id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid() AND role = 'admin'));
