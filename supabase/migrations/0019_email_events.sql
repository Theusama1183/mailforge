-- Email tracking events for open/click analytics
CREATE TABLE IF NOT EXISTS public.email_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_id UUID NOT NULL REFERENCES public.emails(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('open', 'click')),
  link_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_email_events_email_id ON public.email_events(email_id);
CREATE INDEX IF NOT EXISTS idx_email_events_type ON public.email_events(event_type);
CREATE INDEX IF NOT EXISTS idx_email_events_created ON public.email_events(created_at);

ALTER TABLE public.email_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view events for own emails" ON public.email_events;
CREATE POLICY "Users can view events for own emails"
  ON public.email_events FOR SELECT
  USING (
    email_id IN (
      SELECT id FROM public.emails WHERE user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Anyone can insert events" ON public.email_events;
CREATE POLICY "Anyone can insert events"
  ON public.email_events FOR INSERT
  WITH CHECK (true);

NOTIFY pgrst, 'reload schema';
