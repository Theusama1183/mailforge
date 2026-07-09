-- Phase 7: Security & Compliance

-- 1. Password reset tokens
CREATE TABLE IF NOT EXISTS public.password_reset_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  token TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON public.password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON public.password_reset_tokens(user_id);

ALTER TABLE public.password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- 2. App passwords (for SMTP/IMAP/API access)
CREATE TABLE IF NOT EXISTS public.app_passwords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  scopes TEXT[] NOT NULL DEFAULT '{smtp,imap}',
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_app_passwords_user ON public.app_passwords(user_id);

ALTER TABLE public.app_passwords ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own app passwords" ON public.app_passwords;
CREATE POLICY "Users manage own app passwords"
  ON public.app_passwords FOR ALL
  USING (user_id = auth.uid());

-- 3. User sessions tracking
CREATE TABLE IF NOT EXISTS public.user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL UNIQUE,
  ip_address TEXT,
  user_agent TEXT,
  device_type TEXT,
  location TEXT,
  last_active_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON public.user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_session ON public.user_sessions(session_id);

ALTER TABLE public.user_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage own sessions" ON public.user_sessions;
CREATE POLICY "Users manage own sessions"
  ON public.user_sessions FOR ALL
  USING (user_id = auth.uid());

-- 4. Add tracking consent to user_preferences
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS tracking_consent BOOLEAN DEFAULT false;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS cookie_consent_at TIMESTAMPTZ;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ;
ALTER TABLE public.user_preferences ADD COLUMN IF NOT EXISTS terms_version TEXT DEFAULT '2026-06';

NOTIFY pgrst, 'reload schema';
