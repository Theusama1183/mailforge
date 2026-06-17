-- ==============================================================
-- Migration 0011: Consolidate workspace tables and user_preferences
-- Applies all missing pieces from 0009 + 0010
-- Safe to run multiple times (IF NOT EXISTS / IF NOT NULL guards)
-- ==============================================================

-- 1. Create workspaces table
CREATE TABLE IF NOT EXISTS public.workspaces (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now()
);

-- 2. Create workspace_members table
CREATE TABLE IF NOT EXISTS public.workspace_members (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id uuid NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(workspace_id, user_id)
);

-- Add FK to public.users so PostgREST joins (users!inner) work
ALTER TABLE public.workspace_members
  DROP CONSTRAINT IF EXISTS fk_workspace_members_user_id_public_users,
  ADD CONSTRAINT fk_workspace_members_user_id_public_users
  FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;

-- 3. Add workspace_id column to email_addresses if missing
ALTER TABLE public.email_addresses ADD COLUMN IF NOT EXISTS workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL;

-- 4. Create user_preferences table
CREATE TABLE IF NOT EXISTS public.user_preferences (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  default_workspace_id uuid REFERENCES public.workspaces(id) ON DELETE SET NULL,
  onboarding_complete boolean DEFAULT false,
  accepted_terms_at timestamptz,
  updated_at timestamptz DEFAULT now()
);

-- 5. Create security-definer function to check workspace admin status
-- This breaks the infinite recursion that would occur if we queried
-- workspace_members from within a policy on workspace_members.
CREATE OR REPLACE FUNCTION public.is_workspace_admin(ws_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.workspace_members
    WHERE workspace_id = ws_id
    AND user_id = auth.uid()
    AND role = 'admin'
  );
$$;

-- 6. Enable RLS on all tables
ALTER TABLE public.workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workspace_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- 7. Drop existing policies first (safe idempotent)
DROP POLICY IF EXISTS "Users can view workspaces they belong to" ON public.workspaces;
DROP POLICY IF EXISTS "Users can create workspaces" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace creators can update" ON public.workspaces;
DROP POLICY IF EXISTS "Workspace creators can delete" ON public.workspaces;
DROP POLICY IF EXISTS "Users can view their own memberships" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can join as admin on creation" ON public.workspace_members;
DROP POLICY IF EXISTS "Admins can manage members" ON public.workspace_members;
DROP POLICY IF EXISTS "Users can manage their own preferences" ON public.user_preferences;

-- 8. Workspaces policies
CREATE POLICY "Users can view workspaces they belong to"
  ON public.workspaces FOR SELECT
  USING (id IN (SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "Users can create workspaces"
  ON public.workspaces FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Workspace creators can update"
  ON public.workspaces FOR UPDATE
  USING (created_by = auth.uid());

CREATE POLICY "Workspace creators can delete"
  ON public.workspaces FOR DELETE
  USING (created_by = auth.uid());

-- 9. Workspace members policies
CREATE POLICY "Users can view their own memberships"
  ON public.workspace_members FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can join as admin on creation"
  ON public.workspace_members FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND role = 'admin'
    AND workspace_id IN (
      SELECT id FROM public.workspaces WHERE created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can manage members"
  ON public.workspace_members FOR ALL
  USING (public.is_workspace_admin(workspace_id));

-- 10. User preferences policy
CREATE POLICY "Users can manage their own preferences"
  ON public.user_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 11. Notify PostgREST to refresh its schema cache
NOTIFY pgrst, 'reload schema';
