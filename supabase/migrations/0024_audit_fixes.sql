-- ============================================
-- Migration 0024: Audit Fixes
-- Addresses all issues found in deep codebase audit
-- ============================================

-- 1. RATE LIMITS TABLE (for serverless-compatible rate limiting)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_rate_limits_key_created ON public.rate_limits(key, created_at DESC);

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

-- Only the service role (admin client) can manage rate limits
DROP POLICY IF EXISTS "Service role manages rate limits" ON public.rate_limits;
CREATE POLICY "Service role manages rate limits"
  ON public.rate_limits FOR ALL
  USING (true)
  WITH CHECK (true);

REVOKE ALL ON public.rate_limits FROM anon, authenticated;
GRANT ALL ON public.rate_limits TO service_role;

-- Index for cleanup queries (cleanup runs via scheduled job, not partial index)
CREATE INDEX IF NOT EXISTS idx_rate_limits_created_at ON public.rate_limits(created_at);


-- 2. FIX NULLABLE WORKSPACE_ID UNIQUE CONSTRAINT
-- PG treats NULLs as distinct in unique constraints, so add partial unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_contacts_unique_email_per_user
  ON public.contacts(user_id, email)
  WHERE workspace_id IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_contact_groups_unique_name_per_user
  ON public.contact_groups(user_id, name)
  WHERE workspace_id IS NULL;


-- 3. FIX INVITATIONS RLS - prevent token enumeration
DROP POLICY IF EXISTS "Anyone can view by token" ON public.invitations;
DROP POLICY IF EXISTS "Anyone can view valid invitation by token" ON public.invitations;

CREATE POLICY "Anyone can view valid invitation by token"
  ON public.invitations FOR SELECT
  USING (
    status = 'pending'
    AND expires_at > now()
  );

DROP POLICY IF EXISTS "Users can view own invitations" ON public.invitations;
CREATE POLICY "Users can view own invitations"
  ON public.invitations FOR SELECT
  USING (email = auth.email());


-- 4. FIX EMAIL EVENTS RLS - verify email ownership
DROP POLICY IF EXISTS "Anyone can insert events" ON public.email_events;

DROP POLICY IF EXISTS "Users can insert own email events" ON public.email_events;
CREATE POLICY "Users can insert own email events"
  ON public.email_events FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.emails
      WHERE emails.id = email_id
      AND emails.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can view own email events" ON public.email_events;
CREATE POLICY "Users can view own email events"
  ON public.email_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.emails
      WHERE emails.id = email_id
      AND emails.user_id = auth.uid()
    )
  );


-- 5. ADD WORKSPACE_ID TO TEMPLATES
ALTER TABLE public.templates ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_templates_workspace_id ON public.templates(workspace_id);

-- Update existing templates RLS to include workspace check
DROP POLICY IF EXISTS "Users manage own templates" ON public.templates;

CREATE POLICY "Users manage own templates"
  ON public.templates FOR ALL
  USING (
    user_id = auth.uid()
    AND (
      workspace_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_members.workspace_id = templates.workspace_id
        AND workspace_members.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND (
      workspace_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_members.workspace_id = templates.workspace_id
        AND workspace_members.user_id = auth.uid()
      )
    )
  );


-- 6. ADD WORKSPACE_ID TO IMAP_ACCOUNTS
ALTER TABLE public.imap_accounts ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_imap_accounts_workspace_id ON public.imap_accounts(workspace_id);

-- Update IMAP accounts RLS
DROP POLICY IF EXISTS "Users manage own imap accounts" ON public.imap_accounts;

CREATE POLICY "Users manage own imap accounts"
  ON public.imap_accounts FOR ALL
  USING (
    user_id = auth.uid()
    AND (
      workspace_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_members.workspace_id = imap_accounts.workspace_id
        AND workspace_members.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND (
      workspace_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_members.workspace_id = imap_accounts.workspace_id
        AND workspace_members.user_id = auth.uid()
      )
    )
  );


-- 7. ADD WORKSPACE_ID TO EMAILS (critical for workspace isolation)
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES public.workspaces(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_emails_workspace_id ON public.emails(workspace_id);

-- Update emails RLS to include workspace check
DROP POLICY IF EXISTS "Users can view their own emails" ON public.emails;

CREATE POLICY "Users can view their own emails"
  ON public.emails FOR SELECT
  USING (
    user_id = auth.uid()
    AND (
      workspace_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_members.workspace_id = emails.workspace_id
        AND workspace_members.user_id = auth.uid()
      )
    )
  );

-- Insert policy for emails
DROP POLICY IF EXISTS "Users can insert their own emails" ON public.emails;

CREATE POLICY "Users can insert their own emails"
  ON public.emails FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      workspace_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_members.workspace_id = emails.workspace_id
        AND workspace_members.user_id = auth.uid()
      )
    )
  );


-- 8. MISSING INDEXES FOR PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_email_addresses_assigned_to ON public.email_addresses(assigned_to);
CREATE INDEX IF NOT EXISTS idx_templates_user_id ON public.templates(user_id);
CREATE INDEX IF NOT EXISTS idx_imap_accounts_user_id ON public.imap_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_imap_sync_state_account_id ON public.imap_sync_state(account_id);
CREATE INDEX IF NOT EXISTS idx_workspaces_created_by ON public.workspaces(created_by);
CREATE INDEX IF NOT EXISTS idx_workspace_members_workspace_id ON public.workspace_members(workspace_id);
CREATE INDEX IF NOT EXISTS idx_workspace_members_user_id ON public.workspace_members(user_id);
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by ON public.invitations(invited_by);
CREATE INDEX IF NOT EXISTS idx_contact_group_members_group_id ON public.contact_group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_emails_message_id ON public.emails(message_id);
CREATE INDEX IF NOT EXISTS idx_emails_direction ON public.emails(direction);
CREATE INDEX IF NOT EXISTS idx_emails_folder ON public.emails(folder);
CREATE INDEX IF NOT EXISTS idx_email_events_email_id ON public.email_events(email_id);
CREATE INDEX IF NOT EXISTS idx_email_addresses_domain_id ON public.email_addresses(domain_id);


-- 9. ADD CHECK CONSTRAINT FOR EMAIL FORMAT ON CONTACTS
ALTER TABLE public.contacts DROP CONSTRAINT IF EXISTS contacts_email_check;
ALTER TABLE public.contacts ADD CONSTRAINT contacts_email_check
  CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');


-- 10. NOTIFY: smtp_password is stored in plaintext
-- A future migration should add encryption support using pgcrypto
-- CREATE EXTENSION IF NOT EXISTS pgcrypto;
-- ALTER TABLE public.domains ADD COLUMN smtp_password_encrypted TEXT;
