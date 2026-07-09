-- Phase 2 features: folders, labels, search, snooze, pin

-- Custom folders table
CREATE TABLE IF NOT EXISTS email_folders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES email_folders(id) ON DELETE SET NULL,
  color TEXT DEFAULT '#6366f1',
  icon TEXT DEFAULT 'Folder',
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE email_folders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own folders" ON email_folders;
CREATE POLICY "Users can manage own folders"
  ON email_folders FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_email_folders_workspace ON email_folders(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_folders_user ON email_folders(user_id);
CREATE INDEX IF NOT EXISTS idx_email_folders_parent ON email_folders(parent_id);

-- Smart folder rules
CREATE TABLE IF NOT EXISTS folder_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  folder_id UUID NOT NULL REFERENCES email_folders(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field TEXT NOT NULL CHECK (field IN ('from', 'subject', 'to', 'cc', 'body')),
  operator TEXT NOT NULL CHECK (operator IN ('contains', 'equals', 'starts_with', 'ends_with', 'matches')),
  value TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE folder_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own folder rules" ON folder_rules;
CREATE POLICY "Users can manage own folder rules"
  ON folder_rules FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_folder_rules_folder ON folder_rules(folder_id);

-- Color labels table
CREATE TABLE IF NOT EXISTS email_labels (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#6366f1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE email_labels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own labels" ON email_labels;
CREATE POLICY "Users can manage own labels"
  ON email_labels FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_email_labels_workspace ON email_labels(workspace_id);
CREATE INDEX IF NOT EXISTS idx_email_labels_user ON email_labels(user_id);

-- Junction table: email <-> label
CREATE TABLE IF NOT EXISTS email_label_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES emails(id) ON DELETE CASCADE,
  label_id UUID NOT NULL REFERENCES email_labels(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (email_id, label_id)
);

ALTER TABLE email_label_assignments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own label assignments" ON email_label_assignments;
CREATE POLICY "Users can manage own label assignments"
  ON email_label_assignments FOR ALL
  USING (
    email_id IN (SELECT id FROM emails WHERE user_id = auth.uid())
  )
  WITH CHECK (
    email_id IN (SELECT id FROM emails WHERE user_id = auth.uid())
  );

CREATE INDEX IF NOT EXISTS idx_email_label_assignments_email ON email_label_assignments(email_id);
CREATE INDEX IF NOT EXISTS idx_email_label_assignments_label ON email_label_assignments(label_id);

-- Add pinned and snoozed_until to emails
ALTER TABLE emails ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE emails ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_emails_pinned ON emails(user_id, pinned) WHERE pinned = true;
CREATE INDEX IF NOT EXISTS idx_emails_snoozed ON emails(user_id, snoozed_until) WHERE snoozed_until IS NOT NULL;

-- Full-text search support
ALTER TABLE emails ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_emails_search_vector ON emails USING GIN(search_vector);

-- Trigger to auto-update search_vector on INSERT or UPDATE
CREATE OR REPLACE FUNCTION update_email_search_vector()
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    COALESCE(NEW.subject, '') || ' ' ||
    COALESCE(NEW.from_name, '') || ' ' ||
    COALESCE(NEW.from_address, '') || ' ' ||
    COALESCE(array_to_string(NEW.to_addresses, ' '), '') || ' ' ||
    COALESCE(NEW.body_text, '') || ' ' ||
    COALESCE(NEW.mailbox_address, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_emails_search_vector ON emails;
CREATE TRIGGER trg_emails_search_vector
  BEFORE INSERT OR UPDATE OF subject, from_name, from_address, to_addresses, body_text, mailbox_address
  ON emails
  FOR EACH ROW
  EXECUTE FUNCTION update_email_search_vector();

-- Update existing rows
UPDATE emails SET search_vector = to_tsvector('english',
  COALESCE(subject, '') || ' ' ||
  COALESCE(from_name, '') || ' ' ||
  COALESCE(from_address, '') || ' ' ||
  COALESCE(array_to_string(to_addresses, ' '), '') || ' ' ||
  COALESCE(body_text, '') || ' ' ||
  COALESCE(mailbox_address, '')
) WHERE search_vector IS NULL;
