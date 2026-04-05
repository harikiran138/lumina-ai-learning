-- ============================================================
-- Migration 025: Student App Tables
-- Gamification, FSRS, Calibration, Exam Mode, Study Groups,
-- Wellbeing / Emotion Logs, Language Preference
-- ============================================================

-- -------------------------
-- Gamification
-- -------------------------

CREATE TABLE IF NOT EXISTS public.student_gamification (
    student_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    streak_days INTEGER DEFAULT 0,
    last_active_date DATE,
    xp_total INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.xp_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    xp_awarded INTEGER NOT NULL,
    multiplier FLOAT DEFAULT 1.0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    icon_url TEXT,
    condition_type TEXT,
    condition_value FLOAT
);

CREATE TABLE IF NOT EXISTS public.student_badges (
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES public.badges(id),
    earned_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (student_id, badge_id)
);

-- -------------------------
-- FSRS (Spaced Repetition)
-- -------------------------

CREATE TABLE IF NOT EXISTS public.fsrs_cards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    concept_id TEXT,
    front TEXT NOT NULL,
    back TEXT NOT NULL,
    stability FLOAT DEFAULT 1.0,
    difficulty FLOAT DEFAULT 0.3,
    retrievability FLOAT DEFAULT 1.0,
    next_review_date DATE DEFAULT CURRENT_DATE,
    last_reviewed_at TIMESTAMPTZ,
    source TEXT DEFAULT 'auto_generated',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------
-- Calibration (answers table extension)
-- -------------------------

ALTER TABLE IF EXISTS public.answers ADD COLUMN IF NOT EXISTS confidence_self_report FLOAT;

-- -------------------------
-- Exam Mode
-- -------------------------

CREATE TABLE IF NOT EXISTS public.exam_syllabuses (
    exam TEXT NOT NULL,
    chapter TEXT NOT NULL,
    subtopic TEXT NOT NULL,
    concept_id TEXT,
    weight_in_exam FLOAT DEFAULT 0.05,
    PRIMARY KEY (exam, subtopic)
);

-- -------------------------
-- Study Groups
-- -------------------------

CREATE TABLE IF NOT EXISTS public.study_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subject TEXT,
    match_type TEXT DEFAULT 'peer',
    max_members INTEGER DEFAULT 5,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.study_group_members (
    group_id UUID REFERENCES public.study_groups(id) ON DELETE CASCADE,
    student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (group_id, student_id)
);

-- -------------------------
-- Wellbeing / Emotion Logs
-- -------------------------

CREATE TABLE IF NOT EXISTS public.emotion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    mood TEXT NOT NULL CHECK (mood IN ('great', 'okay', 'struggling')),
    notes TEXT,
    distress_signals JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------
-- Language Preference
-- -------------------------

ALTER TABLE IF EXISTS public.users ADD COLUMN IF NOT EXISTS language_code TEXT DEFAULT 'en';

-- -------------------------
-- Indexes
-- -------------------------

CREATE INDEX IF NOT EXISTS idx_fsrs_cards_student ON public.fsrs_cards(student_id);
CREATE INDEX IF NOT EXISTS idx_fsrs_cards_review ON public.fsrs_cards(next_review_date);
CREATE INDEX IF NOT EXISTS idx_xp_events_student ON public.xp_events(student_id);
CREATE INDEX IF NOT EXISTS idx_emotion_logs_student ON public.emotion_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_study_group_members_student ON public.study_group_members(student_id);
