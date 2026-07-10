-- Phase 15: API & Integrations (remaining items)

-- ========== Webhook Configs ==========
CREATE TABLE IF NOT EXISTS webhook_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  secret TEXT,
  events TEXT[] DEFAULT '{*}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE webhook_configs ENABLE ROW LEVEL SECURITY;

-- ========== Integration Configs ==========
CREATE TABLE IF NOT EXISTS integration_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('slack', 'zapier', 'make', 'hubspot', 'salesforce', 'pipedrive')),
  config JSONB NOT NULL DEFAULT '{}',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id, type)
);

ALTER TABLE integration_configs ENABLE ROW LEVEL SECURITY;

-- ========== Form Widgets ==========
CREATE TABLE IF NOT EXISTS form_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  fields JSONB DEFAULT '[]',
  redirect_url TEXT,
  submit_label TEXT DEFAULT 'Subscribe',
  success_message TEXT DEFAULT 'Thank you for subscribing!',
  custom_css TEXT,
  active BOOLEAN NOT NULL DEFAULT true,
  submission_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE form_widgets ENABLE ROW LEVEL SECURITY;

-- ========== Rate Limit Tiers ==========
CREATE TABLE IF NOT EXISTS rate_limit_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  requests_per_minute INTEGER NOT NULL DEFAULT 60,
  emails_per_hour INTEGER NOT NULL DEFAULT 100,
  emails_per_day INTEGER NOT NULL DEFAULT 1000,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workspace_id)
);

ALTER TABLE rate_limit_tiers ENABLE ROW LEVEL SECURITY;

-- ========== Indexes ==========
CREATE INDEX IF NOT EXISTS idx_webhook_configs_workspace ON webhook_configs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_integration_configs_workspace ON integration_configs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_integration_configs_type ON integration_configs(type);
CREATE INDEX IF NOT EXISTS idx_form_widgets_workspace ON form_widgets(workspace_id);

-- ========== RLS Policies ==========
CREATE POLICY "workspace_access_webhook_configs" ON webhook_configs
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace_access_integration_configs" ON integration_configs
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "workspace_access_form_widgets" ON form_widgets
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

CREATE POLICY "public_submit_form_widgets" ON form_widgets
  FOR INSERT WITH CHECK (true);

CREATE POLICY "workspace_access_rate_limit_tiers" ON rate_limit_tiers
  FOR ALL USING (workspace_id IN (SELECT workspace_id FROM workspace_members WHERE user_id = auth.uid()));

NOTIFY pgrst, 'reload schema';
