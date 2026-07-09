-- Phase 3 features: signatures, drafts server-side, delivery tracking

-- Signatures table
CREATE TABLE IF NOT EXISTS user_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Default',
  content TEXT NOT NULL DEFAULT '',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE user_signatures ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own signatures" ON user_signatures;
CREATE POLICY "Users can manage own signatures"
  ON user_signatures FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_user_signatures_user_id ON user_signatures(user_id);

-- Add status tracking to emails for delivery status
ALTER TABLE emails ADD COLUMN IF NOT EXISTS delivery_status TEXT CHECK (delivery_status IN ('queued', 'sending', 'sent', 'delivered', 'failed', 'bounced')) DEFAULT 'queued';
ALTER TABLE emails ADD COLUMN IF NOT EXISTS delivery_error TEXT;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;

-- Drafts: add is_draft flag and scheduled_for
ALTER TABLE emails ADD COLUMN IF NOT EXISTS is_draft BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;
CREATE INDEX IF NOT EXISTS idx_emails_is_draft ON emails(user_id, is_draft) WHERE is_draft = true;

-- Recipient groups usage tracking
CREATE TABLE IF NOT EXISTS email_recipient_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  group_id UUID NOT NULL REFERENCES contact_groups(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE email_recipient_groups ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own email recipient groups" ON email_recipient_groups;
CREATE POLICY "Users can manage own email recipient groups"
  ON email_recipient_groups FOR ALL
  USING (email_id IN (SELECT id FROM emails WHERE user_id = auth.uid()))
  WITH CHECK (email_id IN (SELECT id FROM emails WHERE user_id = auth.uid()));
