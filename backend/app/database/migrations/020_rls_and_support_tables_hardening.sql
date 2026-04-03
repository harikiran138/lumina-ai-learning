-- Production hardening: restore missing support tables and enforce idempotent RLS.

CREATE TABLE IF NOT EXISTS public.student_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.learner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'student',
  learning_style text,
  goals jsonb NOT NULL DEFAULT '[]'::jsonb,
  preferences jsonb NOT NULL DEFAULT '{}'::jsonb,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'active',
  performance_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  engagement_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  risk_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id)
);

CREATE TABLE IF NOT EXISTS public.intervention_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id uuid,
  recommendation_type text NOT NULL DEFAULT 'support',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'pending',
  summary text,
  recommended_action text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.automation_job_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  job_name text NOT NULL,
  status text NOT NULL DEFAULT 'queued',
  result_summary jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.learner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.intervention_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.automation_job_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_owns_data_learner_profiles ON public.learner_profiles;
CREATE POLICY user_owns_data_learner_profiles
ON public.learner_profiles
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_owns_data_intervention_recommendations ON public.intervention_recommendations;
CREATE POLICY user_owns_data_intervention_recommendations
ON public.intervention_recommendations
FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS user_owns_data_automation_job_logs ON public.automation_job_logs;
CREATE POLICY user_owns_data_automation_job_logs
ON public.automation_job_logs
FOR SELECT
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_student_subjects_student_subject
  ON public.student_subjects(student_id, subject_id);

CREATE INDEX IF NOT EXISTS idx_learner_profiles_user_id
  ON public.learner_profiles(user_id);

CREATE INDEX IF NOT EXISTS idx_intervention_recommendations_user_id
  ON public.intervention_recommendations(user_id);

CREATE INDEX IF NOT EXISTS idx_automation_job_logs_user_id
  ON public.automation_job_logs(user_id);
