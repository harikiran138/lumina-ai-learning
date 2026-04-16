-- =============================================================================
-- LUMINA CANONICAL SCHEMA — FULL ARCHITECTURAL CONSOLIDATION
-- Date: 2026-04-16
-- Version: 2.0 (Canonical)
-- Description: Finalizes the 114+ table system catalog, normalizes field naming,
--              and implements missing modules identified in the System Audit V2.
-- =============================================================================

-- ─── 00. PRE-FLIGHT: FIELD NORMALIZATION ─────────────────────────────────────

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Force normalize all existing tables before adding new ones
    FOR r IN 
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND (column_name IN ('college_id', 'org_id'))
    LOOP
        EXECUTE format('ALTER TABLE public.%I RENAME COLUMN %I TO institution_id', r.table_name, r.column_name);
    END LOOP;

    FOR r IN 
        SELECT table_name, column_name 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND (column_name = 'dept_id')
    LOOP
        EXECUTE format('ALTER TABLE public.%I RENAME COLUMN %I TO department_id', r.table_name, r.column_name);
    END LOOP;
END $$;


-- ─── 01. ASSESSMENT: EXAMS & QUESTION BANK HARDENING ────────────────────────

CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  batch_id UUID NOT NULL REFERENCES public.batches(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('internal','external','mock','competitive')),
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER NOT NULL,
  total_marks NUMERIC(6,2) NOT NULL,
  passing_marks NUMERIC(6,2) NOT NULL,
  instructions TEXT,
  proctoring_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ai_monitoring BOOLEAN NOT NULL DEFAULT FALSE,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type TEXT NOT NULL CHECK (question_type IN ('mcq','short','long','coding')),
  options JSONB DEFAULT '[]'::jsonb,
  correct_answer TEXT,
  marks NUMERIC(6,2) NOT NULL,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('easy','medium','hard')),
  bloom_level TEXT NOT NULL CHECK (bloom_level IN ('remember','understand','apply','analyze','evaluate','create')),
  topic_tag TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.exam_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID NOT NULL REFERENCES public.exams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ,
  submitted_at TIMESTAMPTZ,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_score NUMERIC(6,2),
  teacher_score NUMERIC(6,2),
  status TEXT NOT NULL CHECK (status IN ('not_started','in_progress','submitted','graded')),
  proctoring_flags JSONB NOT NULL DEFAULT '[]'::jsonb,
  UNIQUE(exam_id, student_id)
);


-- ─── 02. ML STACK: LEARNING PATHWAYS & MASTERY ──────────────────────────────

CREATE TABLE IF NOT EXISTS public.learning_pathways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pathway_json JSONB NOT NULL,
  completion_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, course_id)
);

CREATE TABLE IF NOT EXISTS public.mastery_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  topic_id UUID REFERENCES public.courses(id) ON DELETE CASCADE, -- Fallback to course level if topic nodes aren't UUID
  score NUMERIC(4,3) NOT NULL CHECK (score BETWEEN 0 AND 1),
  attempts INTEGER NOT NULL DEFAULT 0,
  last_assessed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, topic_id)
);


-- ─── 03. SPACING & ADAPTIVITY (SRS/FSRS) ────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.flashcard_decks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.flashcards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  deck_id UUID NOT NULL REFERENCES public.flashcard_decks(id) ON DELETE CASCADE,
  front_content TEXT NOT NULL,
  back_content TEXT NOT NULL,
  ai_generated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.srs_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  flashcard_id UUID NOT NULL REFERENCES public.flashcards(id) ON DELETE CASCADE,
  interval_days INTEGER NOT NULL,
  ease_factor NUMERIC(4,2) NOT NULL,
  next_review_at TIMESTAMPTZ NOT NULL,
  last_reviewed_at TIMESTAMPTZ,
  repetition_count INTEGER NOT NULL DEFAULT 0,
  quality_response SMALLINT NOT NULL CHECK (quality_response BETWEEN 0 AND 5)
);


-- ─── 04. GUARDIAN AI & RISK MANAGEMENT ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.guardian_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  content_type TEXT NOT NULL CHECK (content_type IN ('ai_message','group_message','assignment','ocr_text')),
  content_id UUID NOT NULL,
  flag_type TEXT NOT NULL CHECK (flag_type IN ('academic_integrity','inappropriate_content','bias_detected','pii_exposed','off_topic')),
  severity TEXT NOT NULL CHECK (severity IN ('low','medium','high','critical')),
  flagged_by TEXT NOT NULL CHECK (flagged_by IN ('system','report')),
  status TEXT NOT NULL CHECK (status IN ('open','reviewed','dismissed','escalated')),
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  resolution_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.student_risk_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  risk_score NUMERIC(4,3) NOT NULL CHECK (risk_score BETWEEN 0 AND 1),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('low','medium','high','critical')),
  contributing_factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  last_computed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  trend TEXT NOT NULL CHECK (trend IN ('improving','stable','declining'))
);

CREATE TABLE IF NOT EXISTS public.risk_interventions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  risk_profile_id UUID NOT NULL REFERENCES public.student_risk_profiles(id) ON DELETE CASCADE,
  intervention_type TEXT NOT NULL CHECK (intervention_type IN ('counseling','mentor_assignment','parent_alert','hod_review')),
  status TEXT NOT NULL CHECK (status IN ('planned','active','completed','ineffective')),
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  notes TEXT,
  outcome_score NUMERIC(4,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─── 05. COMMUNICATIONS: PARENT-TEACHER & THREADS ──────────────────────────

CREATE TABLE IF NOT EXISTS public.message_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID REFERENCES public.institutions(id) ON DELETE CASCADE,
  participants JSONB NOT NULL,
  context_type TEXT NOT NULL CHECK (context_type IN ('parent_teacher','student_teacher','admin_faculty')),
  context_id UUID,
  last_message_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('open','closed','archived'))
);

CREATE TABLE IF NOT EXISTS public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID NOT NULL REFERENCES public.message_threads(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  sender_role TEXT NOT NULL,
  recipient_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  recipient_role TEXT NOT NULL,
  subject TEXT,
  body TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─── 06. OPERATIONS: ATTENDANCE & LEAVE ─────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  leave_type TEXT NOT NULL CHECK (leave_type IN ('personal','medical','official')),
  reason TEXT,
  supporting_document_url TEXT,
  status TEXT NOT NULL CHECK (status IN ('submitted','teacher_approved','hod_approved','rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ─── 07. LIBRARY & KNOWLEDGE ASSETS ────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.library_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('video','pdf','link','interactive','flashcard_deck')),
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  file_url TEXT,
  duration_seconds INTEGER,
  thumbnail_url TEXT,
  access_level TEXT NOT NULL CHECK (access_level IN ('public','enrolled','restricted')),
  view_count INTEGER NOT NULL DEFAULT 0,
  rating_avg NUMERIC(3,2) NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.resource_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_id UUID NOT NULL REFERENCES public.library_resources(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_watched_seconds INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE
);


-- ─── 08. CERTIFICATION & GAMIFICATION ──────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  certificate_type TEXT NOT NULL CHECK (certificate_type IN ('completion','distinction','participation')),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  issued_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  blockchain_hash TEXT,
  pdf_url TEXT NOT NULL,
  is_public BOOLEAN NOT NULL DEFAULT FALSE,
  revoked_at TIMESTAMPTZ,
  revoke_reason TEXT
);

CREATE TABLE IF NOT EXISTS public.achievements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  achievement_type TEXT NOT NULL,
  criteria_met JSONB NOT NULL DEFAULT '{}'::jsonb,
  earned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  badge_url TEXT
);


-- ─── 09. FINANCE & GOVERNANCE ───────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.institution_config (
  institution_id UUID PRIMARY KEY REFERENCES public.institutions(id) ON DELETE CASCADE,
  feature_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  ai_features_enabled JSONB NOT NULL DEFAULT '{"tila":true,"ocr":true,"flashcards":true}'::jsonb,
  max_students INTEGER NOT NULL DEFAULT 1000,
  max_teachers INTEGER NOT NULL DEFAULT 100,
  ai_token_budget_monthly BIGINT NOT NULL DEFAULT 0,
  storage_quota_gb INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.institution_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('starter','growth','enterprise')),
  billing_cycle TEXT NOT NULL CHECK (billing_cycle IN ('monthly','annual')),
  price_usd NUMERIC(10,2) NOT NULL,
  ai_token_budget_monthly BIGINT NOT NULL,
  max_students INTEGER NOT NULL,
  max_teachers INTEGER NOT NULL,
  features_enabled JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL CHECK (status IN ('active','trial','suspended','cancelled')),
  started_at TIMESTAMPTZ NOT NULL,
  renewal_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.ai_usage_ledger (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES public.institutions(id) ON DELETE CASCADE,
  month_year DATE NOT NULL,
  tokens_consumed BIGINT NOT NULL DEFAULT 0,
  cost_usd NUMERIC(12,4) NOT NULL DEFAULT 0,
  overage_tokens BIGINT NOT NULL DEFAULT 0,
  overage_cost_usd NUMERIC(12,4) NOT NULL DEFAULT 0,
  snapshot_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(institution_id, month_year)
);


-- ─── 10. SYSTEM HARDENING: RLS ENABLEMENT ──────────────────────────────────

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exam_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.learning_pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mastery_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcard_decks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flashcards ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.srs_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guardian_flags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_risk_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_interventions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.message_threads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.library_resources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resource_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.institution_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_usage_ledger ENABLE ROW LEVEL SECURITY;

-- Apply base multi-tenant policies to new tables (using subquery for safety)
DO $$
DECLARE
    t TEXT;
BEGIN
    FOR t IN 
        SELECT tablename FROM pg_tables 
        WHERE schemaname = 'public' 
          AND tablename IN ('exams','guardian_flags','institution_config','institution_subscriptions','ai_usage_ledger','message_threads')
    LOOP
        EXECUTE format('CREATE POLICY tenant_isolation ON public.%I FOR ALL USING (institution_id = (SELECT institution_id FROM users WHERE id = auth.uid()) OR auth.uid() IS NULL)', t);
    END LOOP;
END $$;
