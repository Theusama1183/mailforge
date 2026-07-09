-- Phase 7: IP Allowlist & WebAuthn Passkeys

-- 1. IP allowlists (per workspace)
CREATE TABLE IF NOT EXISTS public.ip_allowlists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  cidr TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_ip_allowlists_workspace ON public.ip_allowlists(workspace_id);

ALTER TABLE public.ip_allowlists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own workspace IP allowlists"
  ON public.ip_allowlists
  FOR ALL
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members WHERE user_id = auth.uid()
    )
  );

-- 2. PGP keys (per user/address)
CREATE TABLE IF NOT EXISTS public.pgp_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_address TEXT NOT NULL,
  public_key TEXT NOT NULL,
  fingerprint TEXT,
  algorithm TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,
  UNIQUE(user_id, email_address)
);

CREATE INDEX IF NOT EXISTS idx_pgp_keys_user ON public.pgp_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_pgp_keys_email ON public.pgp_keys(email_address);

ALTER TABLE public.pgp_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own PGP keys"
  ON public.pgp_keys
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
