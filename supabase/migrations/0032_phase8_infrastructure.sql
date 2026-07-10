-- Phase 8: Performance & Infrastructure

-- ========== Email Queue with Retry ==========
CREATE TABLE IF NOT EXISTS email_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  email_data JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  priority INTEGER NOT NULL DEFAULT 0,
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 3,
  last_error TEXT,
  scheduled_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_queue_status ON email_queue(status);
CREATE INDEX idx_email_queue_scheduled ON email_queue(scheduled_at) WHERE status = 'pending';
CREATE INDEX idx_email_queue_priority ON email_queue(priority DESC, scheduled_at);

ALTER TABLE email_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_access" ON email_queue
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- ========== Webhook Retry Log ==========
CREATE TABLE IF NOT EXISTS webhook_retry_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  webhook_url TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
  retry_count INTEGER NOT NULL DEFAULT 0,
  max_retries INTEGER NOT NULL DEFAULT 5,
  last_error TEXT,
  next_retry_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_webhook_retry_status ON webhook_retry_logs(status);
CREATE INDEX idx_webhook_retry_next ON webhook_retry_logs(next_retry_at) WHERE status = 'pending';

ALTER TABLE webhook_retry_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_access" ON webhook_retry_logs
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- ========== Rate Limit Tiers ==========
CREATE TABLE IF NOT EXISTS rate_limit_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'starter', 'growth', 'enterprise')),
  requests_per_minute INTEGER NOT NULL DEFAULT 60,
  emails_per_hour INTEGER NOT NULL DEFAULT 100,
  emails_per_day INTEGER NOT NULL DEFAULT 500,
  concurrent_jobs INTEGER NOT NULL DEFAULT 2,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id)
);

ALTER TABLE rate_limit_tiers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_access" ON rate_limit_tiers
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- ========== Background Jobs ==========
CREATE TABLE IF NOT EXISTS background_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  job_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed', 'cancelled')),
  payload JSONB NOT NULL DEFAULT '{}',
  result JSONB,
  progress INTEGER DEFAULT 0,
  error TEXT,
  priority INTEGER NOT NULL DEFAULT 0,
  scheduled_at TIMESTAMPTZ DEFAULT now(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_bg_jobs_status ON background_jobs(status);
CREATE INDEX idx_bg_jobs_type ON background_jobs(job_type);
CREATE INDEX idx_bg_jobs_scheduled ON background_jobs(scheduled_at) WHERE status = 'pending';

ALTER TABLE background_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_access" ON background_jobs
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- ========== Email Archiving (Cold Storage) ==========
CREATE TABLE IF NOT EXISTS email_archives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  original_email_id UUID,
  archived_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  retention_days INTEGER NOT NULL DEFAULT 365,
  archive_data JSONB NOT NULL,
  compressed_size_bytes BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_archives_workspace ON email_archives(workspace_id);
CREATE INDEX idx_email_archives_date ON email_archives(archived_at);

ALTER TABLE email_archives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_access" ON email_archives
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

-- ========== Usage Quotas ==========
CREATE TABLE IF NOT EXISTS usage_quotas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  emails_sent INTEGER NOT NULL DEFAULT 0,
  emails_received INTEGER NOT NULL DEFAULT 0,
  api_requests INTEGER NOT NULL DEFAULT 0,
  storage_bytes BIGINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, month)
);

ALTER TABLE usage_quotas ENABLE ROW LEVEL SECURITY;

CREATE POLICY "workspace_access" ON usage_quotas
  USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));
