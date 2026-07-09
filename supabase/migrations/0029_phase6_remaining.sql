-- Phase 6 remaining: IMAP sync config, sync logs, folder mappings, catch-all, aliases

-- 1. Add sync_frequency to imap_accounts
ALTER TABLE public.imap_accounts ADD COLUMN IF NOT EXISTS sync_frequency INTEGER DEFAULT 0 NOT NULL;
COMMENT ON COLUMN public.imap_accounts.sync_frequency IS 'Sync interval in minutes. 0 = manual only.';

-- 2. IMAP sync logs
CREATE TABLE IF NOT EXISTS public.imap_sync_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.imap_accounts(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
  messages_synced INTEGER DEFAULT 0,
  error_message TEXT,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.imap_sync_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own sync logs" ON public.imap_sync_logs;
CREATE POLICY "Users manage own sync logs"
  ON public.imap_sync_logs FOR ALL
  USING (
    account_id IN (SELECT id FROM public.imap_accounts WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_imap_sync_logs_account ON public.imap_sync_logs(account_id);
CREATE INDEX IF NOT EXISTS idx_imap_sync_logs_started ON public.imap_sync_logs(started_at DESC);

-- 3. IMAP folder mappings
CREATE TABLE IF NOT EXISTS public.imap_folder_mappings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  account_id UUID NOT NULL REFERENCES public.imap_accounts(id) ON DELETE CASCADE,
  remote_folder TEXT NOT NULL,
  local_folder TEXT NOT NULL CHECK (local_folder IN ('inbox', 'sent', 'drafts', 'trash', 'spam', 'archive', 'starred')),
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(account_id, remote_folder)
);

ALTER TABLE public.imap_folder_mappings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own folder mappings" ON public.imap_folder_mappings;
CREATE POLICY "Users manage own folder mappings"
  ON public.imap_folder_mappings FOR ALL
  USING (
    account_id IN (SELECT id FROM public.imap_accounts WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_imap_folder_mappings_account ON public.imap_folder_mappings(account_id);

-- 4. Add catch-all column to email_addresses
ALTER TABLE public.email_addresses ADD COLUMN IF NOT EXISTS is_catch_all BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.email_addresses ADD COLUMN IF NOT EXISTS alias_for UUID REFERENCES public.email_addresses(id) ON DELETE SET NULL;

-- 5. Update existing email_addresses RLS to include new columns
-- (existing RLS policy already covers user-owned, adding new columns is fine)

NOTIFY pgrst, 'reload schema';
