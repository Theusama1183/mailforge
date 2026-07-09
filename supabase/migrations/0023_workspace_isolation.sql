-- Add workspace isolation for contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;
ALTER TABLE contact_groups ADD COLUMN IF NOT EXISTS workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE;

-- Drop old unique constraints
ALTER TABLE contacts DROP CONSTRAINT IF EXISTS contacts_user_id_email_key;
ALTER TABLE contact_groups DROP CONSTRAINT IF EXISTS contact_groups_user_id_name_key;

-- Add new unique constraints scoped to (user_id, workspace_id, email)
ALTER TABLE contacts ADD UNIQUE (user_id, workspace_id, email);
ALTER TABLE contact_groups ADD UNIQUE (user_id, workspace_id, name);

-- Update RLS policies for workspace isolation
DROP POLICY IF EXISTS "Users manage own contacts" ON contacts;
DROP POLICY IF EXISTS "Users manage own groups" ON contact_groups;
DROP POLICY IF EXISTS "Users manage own group members" ON contact_group_members;

CREATE POLICY "Users manage own contacts"
  ON contacts FOR ALL
  USING (
    user_id = auth.uid()
    AND (
      workspace_id IS NULL
      OR EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = contacts.workspace_id
        AND workspace_members.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND (
      workspace_id IS NULL
      OR EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = contacts.workspace_id
        AND workspace_members.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users manage own groups"
  ON contact_groups FOR ALL
  USING (
    user_id = auth.uid()
    AND (
      workspace_id IS NULL
      OR EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = contact_groups.workspace_id
        AND workspace_members.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    user_id = auth.uid()
    AND (
      workspace_id IS NULL
      OR EXISTS (
        SELECT 1 FROM workspace_members
        WHERE workspace_members.workspace_id = contact_groups.workspace_id
        AND workspace_members.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "Users manage own group members"
  ON contact_group_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM contact_groups
      WHERE contact_groups.id = group_id
      AND contact_groups.user_id = auth.uid()
      AND (
        contact_groups.workspace_id IS NULL
        OR EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = contact_groups.workspace_id
          AND workspace_members.user_id = auth.uid()
        )
      )
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM contact_groups
      WHERE contact_groups.id = group_id
      AND contact_groups.user_id = auth.uid()
      AND (
        contact_groups.workspace_id IS NULL
        OR EXISTS (
          SELECT 1 FROM workspace_members
          WHERE workspace_members.workspace_id = contact_groups.workspace_id
          AND workspace_members.user_id = auth.uid()
        )
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_contacts_workspace_id ON contacts(workspace_id);
CREATE INDEX IF NOT EXISTS idx_contact_groups_workspace_id ON contact_groups(workspace_id);
