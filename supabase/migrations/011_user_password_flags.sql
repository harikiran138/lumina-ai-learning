-- Add must_change_password flag for first-login enforcement
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_must_change_password ON public.users(must_change_password);
