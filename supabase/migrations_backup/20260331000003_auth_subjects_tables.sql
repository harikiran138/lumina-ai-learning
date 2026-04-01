-- Migration 017: Add missing tables for auth audit and student subjects
-- Tables: student_subjects, login_attempts, login_history

-- 1) Student subjects – tracks which courses/subjects a student has elected
CREATE TABLE IF NOT EXISTS public.student_subjects (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_student_subjects_student ON public.student_subjects(student_id);
CREATE INDEX IF NOT EXISTS idx_student_subjects_subject ON public.student_subjects(subject_id);

-- 2) Login attempts – brute-force protection per (identifier, ip)
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier   text NOT NULL,
  ip_address   text NOT NULL,
  attempts     integer NOT NULL DEFAULT 0,
  last_attempt timestamptz,
  locked_until timestamptz,
  UNIQUE(identifier, ip_address)
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier ON public.login_attempts(identifier);
CREATE INDEX IF NOT EXISTS idx_login_attempts_locked    ON public.login_attempts(locked_until) WHERE locked_until IS NOT NULL;

-- 3) Login history – full audit trail per authentication event
CREATE TABLE IF NOT EXISTS public.login_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES public.users(id) ON DELETE SET NULL,
  college_id      uuid REFERENCES public.institutions(id) ON DELETE SET NULL,
  identifier_used text,
  identifier_type text,
  role_at_login   text,
  ip_address      text,
  user_agent      text,
  success         boolean NOT NULL DEFAULT false,
  failure_reason  text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_history_user_id  ON public.login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created  ON public.login_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_success  ON public.login_history(success);
