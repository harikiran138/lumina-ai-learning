-- Phase 1: Adaptive Learning Management System - Data Layer
-- Tables for Knowledge Graphs, Mastery Tracking, and Real-time Interventions

-- 1. Concepts (Nodes in Knowledge Graph)
CREATE TABLE IF NOT EXISTS public.concepts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  difficulty_level INTEGER DEFAULT 1, -- 1 to 5
  common_misconceptions JSONB DEFAULT '[]',
  dependency_depth INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Concept Dependencies (Edges in Knowledge Graph)
CREATE TABLE IF NOT EXISTS public.concept_dependencies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  concept_id UUID REFERENCES public.concepts(id) ON DELETE CASCADE,
  depends_on_concept_id UUID REFERENCES public.concepts(id) ON DELETE CASCADE,
  dependency_strength NUMERIC DEFAULT 1.0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(concept_id, depends_on_concept_id)
);

-- 3. Adaptive Student Profile (State Store for BKT/DKT/RL)
CREATE TABLE IF NOT EXISTS public.student_adaptive_profiles (
  student_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  mastery_scores JSONB DEFAULT '{}', -- concept_id -> score (0.0-1.0)
  growth_velocity JSONB DEFAULT '{}', -- concept_id -> velocity (-1.0 to 1.0)
  style_weights JSONB DEFAULT '{"visual": 0.33, "auditory": 0.33, "kinesthetic": 0.34}',
  lag_zones JSONB DEFAULT '[]', -- list of concept IDs
  engagement_score NUMERIC DEFAULT 0.0,
  cognitive_load TEXT DEFAULT 'optimal', -- bored | optimal | overloaded
  answering_pattern TEXT DEFAULT 'deliberate', -- rushed | deliberate | stalling
  dropout_risk NUMERIC DEFAULT 0.0,
  writing_fingerprint JSONB DEFAULT '{}', -- keystroke dynamics metadata
  session_history JSONB DEFAULT '[]', -- Recent session performance snapshots
  last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DKT States (Hidden sequence state for Deep Knowledge Tracing)
CREATE TABLE IF NOT EXISTS public.dkt_states (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  state_data JSONB NOT NULL DEFAULT '{"state": {}, "timestamps": {}, "sequence": []}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Adaptive Answers (Detailed Answer Records)
CREATE TABLE IF NOT EXISTS public.adaptive_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  concept_id UUID REFERENCES public.concepts(id) ON DELETE SET NULL,
  session_id UUID,
  question_type TEXT,
  is_correct BOOLEAN,
  answer_text TEXT,
  response_time_ms INTEGER,
  avg_think_time_ms INTEGER,
  keystroke_variance NUMERIC,
  correction_ratio NUMERIC,
  paste_detected BOOLEAN DEFAULT FALSE,
  probe_followup_passed BOOLEAN,
  score_4d JSONB, -- {correctness, depth, effort, growth}
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Intervention Queue
CREATE TABLE IF NOT EXISTS public.intervention_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
  suggested_action TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'ignored')),
  resolved_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_concept_dependencies_concept_id ON public.concept_dependencies(concept_id);
CREATE INDEX IF NOT EXISTS idx_intervention_queue_student_id ON public.intervention_queue(student_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_answers_student_id ON public.adaptive_answers(student_id);
CREATE INDEX IF NOT EXISTS idx_adaptive_answers_concept_id ON public.adaptive_answers(concept_id);
CREATE INDEX IF NOT EXISTS idx_dkt_states_updated_at ON public.dkt_states(updated_at);
