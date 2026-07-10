-- Performance indexes for common query patterns

-- Emails mailbox query: WHERE user_id = ? AND folder = ? ORDER BY created_at DESC LIMIT ? OFFSET ?
DROP INDEX IF EXISTS idx_emails_user_folder_created;
CREATE INDEX idx_emails_user_folder_created
  ON public.emails(user_id, folder, created_at DESC);

-- Email addresses lookup: WHERE workspace_id = ?
CREATE INDEX IF NOT EXISTS idx_email_addresses_workspace_id
  ON public.email_addresses(workspace_id);

-- Rate limits cleanup query: WHERE key = ? AND created_at >= ?
CREATE INDEX IF NOT EXISTS idx_rate_limits_key_created
  ON public.rate_limits(key, created_at);

NOTIFY pgrst, 'reload schema';
