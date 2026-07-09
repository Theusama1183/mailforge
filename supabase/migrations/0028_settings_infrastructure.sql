-- Phase 6: Settings & Configuration tables

-- 1. User profiles (extends users table)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  avatar_url TEXT,
  timezone TEXT DEFAULT 'UTC',
  language TEXT DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own profile" ON public.user_profiles;
CREATE POLICY "Users manage own profile"
  ON public.user_profiles FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. Notification preferences
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('email_received', 'email_opened', 'email_clicked', 'email_bounced', 'email_failed', 'member_joined', 'member_left')),
  email_enabled BOOLEAN NOT NULL DEFAULT true,
  in_app_enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, event_type)
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own notification preferences" ON public.notification_preferences;
CREATE POLICY "Users manage own notification preferences"
  ON public.notification_preferences FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON public.notification_preferences(user_id);

-- 3. Vacation auto-reply
CREATE TABLE IF NOT EXISTS public.vacation_autoreply (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_address_id UUID REFERENCES public.email_addresses(id) ON DELETE CASCADE,
  subject TEXT NOT NULL DEFAULT 'Auto-reply: Out of office',
  body TEXT NOT NULL DEFAULT 'I am currently out of the office and will respond to your message as soon as possible.',
  enabled BOOLEAN NOT NULL DEFAULT false,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.vacation_autoreply ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own vacation autoreply" ON public.vacation_autoreply;
CREATE POLICY "Users manage own vacation autoreply"
  ON public.vacation_autoreply FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_vacation_autoreply_user ON public.vacation_autoreply(user_id);

-- 4. Forwarding rules
CREATE TABLE IF NOT EXISTS public.forwarding_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email_address_id UUID REFERENCES public.email_addresses(id) ON DELETE CASCADE,
  destination TEXT NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT true,
  keep_copy BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.forwarding_rules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own forwarding rules" ON public.forwarding_rules;
CREATE POLICY "Users manage own forwarding rules"
  ON public.forwarding_rules FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_forwarding_rules_user ON public.forwarding_rules(user_id);

-- 5. Blocked senders
CREATE TABLE IF NOT EXISTS public.blocked_senders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL,
  pattern_type TEXT NOT NULL DEFAULT 'email' CHECK (pattern_type IN ('email', 'domain')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.blocked_senders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own blocked senders" ON public.blocked_senders;
CREATE POLICY "Users manage own blocked senders"
  ON public.blocked_senders FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_blocked_senders_user ON public.blocked_senders(user_id);

-- 6. Trusted senders
CREATE TABLE IF NOT EXISTS public.trusted_senders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern TEXT NOT NULL,
  pattern_type TEXT NOT NULL DEFAULT 'email' CHECK (pattern_type IN ('email', 'domain')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.trusted_senders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own trusted senders" ON public.trusted_senders;
CREATE POLICY "Users manage own trusted senders"
  ON public.trusted_senders FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE INDEX IF NOT EXISTS idx_trusted_senders_user ON public.trusted_senders(user_id);

-- 7. Audit logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  details JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Workspace admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Workspace admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (
    workspace_id IN (
      SELECT workspace_id FROM public.workspace_members
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

DROP POLICY IF EXISTS "Service role can insert audit logs" ON public.audit_logs;
CREATE POLICY "Service role can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_audit_logs_workspace ON public.audit_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON public.audit_logs(created_at);

-- 8. Activity logs
CREATE TABLE IF NOT EXISTS public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  workspace_id UUID REFERENCES public.workspaces(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own activity" ON public.activity_logs;
CREATE POLICY "Users can view own activity"
  ON public.activity_logs FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Service role can insert activity" ON public.activity_logs;
CREATE POLICY "Service role can insert activity"
  ON public.activity_logs FOR INSERT
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON public.activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_workspace ON public.activity_logs(workspace_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at);

NOTIFY pgrst, 'reload schema';
