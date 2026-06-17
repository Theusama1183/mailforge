-- Fix FK on invitations.invited_by: reference public.users instead of auth.users
-- PostgREST needs FK to public.users for the `users!invited_by(email)` join
ALTER TABLE public.invitations DROP CONSTRAINT IF EXISTS invitations_invited_by_fkey;
ALTER TABLE public.invitations ADD CONSTRAINT invitations_invited_by_fkey
  FOREIGN KEY (invited_by) REFERENCES public.users(id) ON DELETE CASCADE;
