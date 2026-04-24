ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS is_admin boolean NOT NULL DEFAULT false;

-- Set your admin account(s) by email after running this migration:
-- UPDATE public.profiles SET is_admin = true WHERE email = 'you@yourdomain.com';

COMMENT ON COLUMN public.profiles.is_admin IS
  'Platform administrator. Receives notifications for surveillance reports
   and has access to investigation workflows.';
