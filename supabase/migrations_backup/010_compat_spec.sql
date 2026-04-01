-- Compatibility migration for Lumina Engineering College Architecture

-- 1) Colleges (institutions)
ALTER TABLE public.institutions
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS academic_year text,
  ADD COLUMN IF NOT EXISTS login_policy text DEFAULT 'email_only',
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 2) Departments
ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS abbreviation text,
  ADD COLUMN IF NOT EXISTS intake_strength integer,
  ADD COLUMN IF NOT EXISTS established_year integer;

-- 3) Batches
CREATE TABLE IF NOT EXISTS public.batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid REFERENCES public.institutions(id),
  dept_id uuid REFERENCES public.departments(id),
  year integer NOT NULL,
  label text NOT NULL,
  sections text[] DEFAULT '{}'::text[],
  current_semester integer DEFAULT 1,
  is_lateral boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 4) Classes -> link to batch
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.batches(id);

-- 5) Subjects (courses)
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS semester integer,
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS college_id uuid REFERENCES public.institutions(id);

-- 6) Subject assignments (teacher_assignments)
ALTER TABLE public.teacher_assignments
  ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.batches(id),
  ADD COLUMN IF NOT EXISTS section text,
  ADD COLUMN IF NOT EXISTS academic_year text,
  ADD COLUMN IF NOT EXISTS is_co_teacher boolean DEFAULT false;

-- 7) Users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS college_id uuid REFERENCES public.institutions(id),
  ADD COLUMN IF NOT EXISTS dept_id uuid REFERENCES public.departments(id),
  ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.batches(id),
  ADD COLUMN IF NOT EXISTS section text,
  ADD COLUMN IF NOT EXISTS student_roll text,
  ADD COLUMN IF NOT EXISTS employee_id text,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS profile_photo_url text,
  ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

-- 8) Invite tokens + enrollment codes
CREATE TABLE IF NOT EXISTS public.invite_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id),
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.enrollment_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES public.batches(id),
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 9) Backfills (safe)
UPDATE public.users
SET full_name = COALESCE(full_name, name)
WHERE full_name IS NULL AND name IS NOT NULL;

UPDATE public.users
SET dept_id = COALESCE(dept_id, department_id)
WHERE dept_id IS NULL AND department_id IS NOT NULL;

UPDATE public.users u
SET college_id = d.institution_id
FROM public.departments d
WHERE u.college_id IS NULL
  AND d.id = u.department_id;

UPDATE public.courses c
SET college_id = d.institution_id
FROM public.departments d
WHERE c.college_id IS NULL
  AND c.department_id = d.id;
