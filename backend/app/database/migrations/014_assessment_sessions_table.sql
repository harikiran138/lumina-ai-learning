-- Migration 014: Create assessment_sessions and related foundation tables
-- Goal: Synchronize database with the modern Adaptive Assessment System Pydantic models.

-- 1. Assessment Sessions Table
-- Schema aligns with app.assessment.models.schemas.AssessmentSession
CREATE TABLE IF NOT EXISTS public.assessment_sessions (
    id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id         uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    topic              text NOT NULL,
    current_difficulty float8 DEFAULT 0.5,
    total_questions    integer DEFAULT 5,
    responses          jsonb DEFAULT '[]',
    question_history   jsonb DEFAULT '[]',
    current_question   jsonb,
    mastery_state      jsonb DEFAULT '{}',
    status             text DEFAULT 'active', -- 'active' or 'completed'
    final_score        float8,
    start_time         timestamptz DEFAULT now(),
    end_time           timestamptz,
    created_at         timestamptz DEFAULT now()
);

-- Indexing for performance
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_student_id ON public.assessment_sessions(student_id);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_status ON public.assessment_sessions(status);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_topic ON public.assessment_sessions(topic);

-- 2. User Data Table (Legacy support for cascades)
-- Used for generic user-related metadata and persistent profile attributes
CREATE TABLE IF NOT EXISTS public.user_data (
    id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    uuid REFERENCES public.users(id) ON DELETE CASCADE,
    data       jsonb DEFAULT '{}',
    updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_user_data_user_id ON public.user_data(user_id);

-- Enable RLS for Assessment Sessions
ALTER TABLE public.assessment_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Students can view their own sessions
CREATE POLICY "Students can view own sessions" 
ON public.assessment_sessions FOR SELECT 
USING (auth.uid() = student_id);

-- Policy: Students can insert their own sessions
CREATE POLICY "Students can insert own sessions" 
ON public.assessment_sessions FOR INSERT 
WITH CHECK (auth.uid() = student_id);

-- Policy: Students can update their own sessions
CREATE POLICY "Students can update own sessions" 
ON public.assessment_sessions FOR UPDATE 
USING (auth.uid() = student_id);

-- Note: RLS policies for user_data should follow similar patterns if students access it directly.
