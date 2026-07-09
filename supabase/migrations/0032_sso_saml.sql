-- Phase 7: SSO/SAML Providers

CREATE TABLE IF NOT EXISTS public.sso_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  domain TEXT NOT NULL,
  provider TEXT NOT NULL DEFAULT 'saml',
  label TEXT,
  metadata_url TEXT,
  entity_id TEXT,
  sso_url TEXT,
  certificate TEXT,
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  UNIQUE(workspace_id, domain)
);

CREATE INDEX IF NOT EXISTS idx_sso_providers_workspace ON public.sso_providers(workspace_id);
CREATE INDEX IF NOT EXISTS idx_sso_providers_domain ON public.sso_providers(domain);

ALTER TABLE public.sso_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Workspace admins can manage SSO providers"
  ON public.sso_providers
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Members can read SSO providers"
  ON public.sso_providers
  FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );
