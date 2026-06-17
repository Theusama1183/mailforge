ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS status text DEFAULT 'sent';
ALTER TABLE public.emails ADD COLUMN IF NOT EXISTS send_payload jsonb;
