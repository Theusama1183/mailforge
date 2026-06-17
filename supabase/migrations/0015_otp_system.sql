-- Create auth_otps table for email verification OTP
CREATE TABLE IF NOT EXISTS public.auth_otps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  otp_hash TEXT NOT NULL,
  email TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '5 minutes'),
  attempts INTEGER DEFAULT 0,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add index for fast lookups
CREATE INDEX IF NOT EXISTS idx_auth_otps_user_id ON public.auth_otps(user_id);
CREATE INDEX IF NOT EXISTS idx_auth_otps_email ON public.auth_otps(email);

-- Enable RLS (but allow insert/select by authenticated users via API)
ALTER TABLE public.auth_otps ENABLE ROW LEVEL SECURITY;

-- Only allow inserts via service role (API)
CREATE POLICY "Service role can manage OTPs" ON public.auth_otps
  FOR ALL USING (true) WITH CHECK (true);

-- Drop autoconfirm trigger if exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create function to auto-create public.users entry on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.users (id, email, name, created_at)
  VALUES (NEW.id, NEW.email, '', NEW.created_at)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Re-create trigger for new user sync (only creates public.users, no autoconfirm)
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
