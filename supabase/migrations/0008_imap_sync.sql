CREATE TABLE IF NOT EXISTS public.imap_accounts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT '',
  host text NOT NULL,
  port integer NOT NULL DEFAULT 993,
  username text NOT NULL,
  password_encrypted text NOT NULL,
  use_tls boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.imap_sync_state (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id uuid NOT NULL REFERENCES public.imap_accounts(id) ON DELETE CASCADE,
  mailbox_name text NOT NULL,
  last_uid bigint DEFAULT 0,
  last_sync_at timestamptz,
  UNIQUE(account_id, mailbox_name)
);

ALTER TABLE public.imap_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imap_sync_state ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own imap accounts"
  ON public.imap_accounts FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage own imap sync state"
  ON public.imap_sync_state
  FOR ALL
  USING (account_id IN (SELECT id FROM public.imap_accounts WHERE user_id = auth.uid()));
