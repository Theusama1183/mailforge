-- Phase 5: Analytics & Reports infrastructure
-- 1. Extend email_events with more event types
-- 2. Campaigns table for grouping bulk sends
-- 3. A/B testing tables

-- 1. Extend email_events event types
ALTER TABLE public.email_events DROP CONSTRAINT IF EXISTS email_events_event_type_check;
ALTER TABLE public.email_events ADD CONSTRAINT email_events_event_type_check
  CHECK (event_type IN ('open', 'click', 'bounce', 'unsubscribe', 'spam_report'));

-- Additional columns for richer analytics
ALTER TABLE public.email_events ADD COLUMN IF NOT EXISTS bounce_type TEXT CHECK (bounce_type IN ('hard', 'soft'));
ALTER TABLE public.email_events ADD COLUMN IF NOT EXISTS country TEXT;
ALTER TABLE public.email_events ADD COLUMN IF NOT EXISTS device_type TEXT CHECK (device_type IN ('mobile', 'desktop', 'tablet'));
ALTER TABLE public.email_events ADD COLUMN IF NOT EXISTS email_client TEXT;

CREATE INDEX IF NOT EXISTS idx_email_events_country ON public.email_events(event_type, country);
CREATE INDEX IF NOT EXISTS idx_email_events_device ON public.email_events(event_type, device_type);
CREATE INDEX IF NOT EXISTS idx_email_events_client ON public.email_events(event_type, email_client);

-- 2. Campaigns table
CREATE TABLE IF NOT EXISTS public.campaigns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sending', 'sent', 'cancelled')),
  total_sent INTEGER NOT NULL DEFAULT 0,
  total_opens INTEGER NOT NULL DEFAULT 0,
  total_clicks INTEGER NOT NULL DEFAULT 0,
  total_bounces INTEGER NOT NULL DEFAULT 0,
  total_unsubscribes INTEGER NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own campaigns" ON public.campaigns;
CREATE POLICY "Users can manage own campaigns"
  ON public.campaigns FOR ALL
  USING (
    user_id = auth.uid()
    AND (
      workspace_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_members.workspace_id = campaigns.workspace_id
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
        WHERE workspace_members.workspace_id = campaigns.workspace_id
        AND workspace_members.user_id = auth.uid()
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_campaigns_workspace ON public.campaigns(workspace_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_user ON public.campaigns(user_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_status ON public.campaigns(status);

-- Link emails to campaigns
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS campaign_id UUID REFERENCES public.campaigns(id) ON DELETE SET NULL;
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS unsubscribed BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_emails_campaign ON public.emails(campaign_id);
CREATE INDEX IF NOT EXISTS idx_emails_unsubscribed ON public.emails(user_id, unsubscribed) WHERE unsubscribed = true;

-- 3. A/B testing tables
CREATE TABLE IF NOT EXISTS public.ab_tests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID NOT NULL REFERENCES public.workspaces(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'completed')),
  winning_variant_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ab_tests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own ab_tests" ON public.ab_tests;
CREATE POLICY "Users can manage own ab_tests"
  ON public.ab_tests FOR ALL
  USING (
    user_id = auth.uid()
    AND (
      workspace_id IS NULL
      OR EXISTS (
        SELECT 1 FROM public.workspace_members
        WHERE workspace_members.workspace_id = ab_tests.workspace_id
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
        WHERE workspace_members.workspace_id = ab_tests.workspace_id
        AND workspace_members.user_id = auth.uid()
      )
    )
  );

CREATE TABLE IF NOT EXISTS public.ab_test_variants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ab_test_id UUID NOT NULL REFERENCES public.ab_tests(id) ON DELETE CASCADE,
  label TEXT NOT NULL CHECK (label IN ('A', 'B')),
  subject TEXT NOT NULL,
  body_html TEXT,
  body_text TEXT,
  sent_count INTEGER NOT NULL DEFAULT 0,
  open_count INTEGER NOT NULL DEFAULT 0,
  click_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ab_test_variants ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own ab_test_variants" ON public.ab_test_variants;
CREATE POLICY "Users can manage own ab_test_variants"
  ON public.ab_test_variants FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.ab_tests
      WHERE ab_tests.id = ab_test_variants.ab_test_id
      AND ab_tests.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.ab_tests
      WHERE ab_tests.id = ab_test_variants.ab_test_id
      AND ab_tests.user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_ab_test_variants_test ON public.ab_test_variants(ab_test_id);

-- Add ab_test_variant_id to emails
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS ab_test_variant_id UUID REFERENCES public.ab_test_variants(id) ON DELETE SET NULL;

-- Self-referencing FK for winning_variant
ALTER TABLE public.ab_tests ADD CONSTRAINT fk_winning_variant
  FOREIGN KEY (winning_variant_id) REFERENCES public.ab_test_variants(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_emails_ab_test_variant ON public.emails(ab_test_variant_id);

NOTIFY pgrst, 'reload schema';
