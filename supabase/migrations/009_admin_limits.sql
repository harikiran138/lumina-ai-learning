-- Admin hierarchy limits + codes

ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS teacher_limit INTEGER;
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS class_limit INTEGER;
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS course_limit INTEGER;
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS student_limit INTEGER;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS teacher_limit INTEGER;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS teacher_limit INTEGER;
