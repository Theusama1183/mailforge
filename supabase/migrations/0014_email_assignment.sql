-- Add assigned_to column to email_addresses for member-level email assignment
ALTER TABLE public.email_addresses ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES public.users(id) ON DELETE SET NULL;

-- Add assigned_email_ids column to invitations for pre-selecting email assignments
ALTER TABLE public.invitations ADD COLUMN IF NOT EXISTS assigned_email_ids jsonb DEFAULT '[]'::jsonb;
