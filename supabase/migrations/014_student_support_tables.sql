-- Correction requests for student onboarding
CREATE TABLE IF NOT EXISTS public.correction_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.users(id),
  type text NOT NULL,
  message text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS emergency_contact text,
ADD COLUMN IF NOT EXISTS parent_email text;

ALTER TABLE public.enrollment_codes
ADD COLUMN IF NOT EXISTS used_by uuid REFERENCES public.users(id);
