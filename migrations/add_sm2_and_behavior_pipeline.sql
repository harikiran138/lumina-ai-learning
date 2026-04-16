-- ============================================================
-- Migration: add_fsrs_v5_and_behavior_pipeline
-- Adds FSRS v5 spaced repetition columns to skill_mastery and
-- ensures behavior_logs table is ready for the tracking pipeline.
-- NOTE: Lumina uses FSRS v5 (NOT SM-2). ease_factor maps to
-- fsrs_difficulty; interval_days maps to fsrs_stability.
-- See migration 034 for the canonical FSRS v5 column rename.
-- Apply via: Supabase Dashboard → SQL Editor → Run
-- ============================================================

-- 1. FSRS v5 base columns on skill_mastery (legacy names kept for compat)
ALTER TABLE skill_mastery
  ADD COLUMN IF NOT EXISTS ease_factor    NUMERIC DEFAULT 2.5,  -- maps to fsrs_difficulty (D)
  ADD COLUMN IF NOT EXISTS repetitions    INT     DEFAULT 0,
  ADD COLUMN IF NOT EXISTS interval_days  INT     DEFAULT 1,     -- maps to fsrs_stability (S) in days
  ADD COLUMN IF NOT EXISTS next_review_at TIMESTAMPTZ;

-- Index for efficient review schedule queries
CREATE INDEX IF NOT EXISTS idx_skill_mastery_next_review
  ON skill_mastery(user_id, next_review_at)
  WHERE next_review_at IS NOT NULL;

-- 2. behavior_logs table (create if not already present)
CREATE TABLE IF NOT EXISTS behavior_logs (
  id                       UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  UUID REFERENCES users(id)    ON DELETE CASCADE,
  course_id                UUID REFERENCES courses(id)  ON DELETE SET NULL,
  event_type               TEXT NOT NULL,
  event_data               JSONB DEFAULT '{}',
  session_duration_seconds INT,
  resource_id              TEXT,
  timestamp                TIMESTAMPTZ DEFAULT NOW(),
  created_at               TIMESTAMPTZ DEFAULT NOW()
);

-- Performance index
CREATE INDEX IF NOT EXISTS idx_behavior_logs_user_ts
  ON behavior_logs(user_id, timestamp DESC);

-- 3. RLS policies for behavior_logs
ALTER TABLE behavior_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "behavior_logs_student_insert" ON behavior_logs;
CREATE POLICY "behavior_logs_student_insert" ON behavior_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "behavior_logs_student_select" ON behavior_logs;
CREATE POLICY "behavior_logs_student_select" ON behavior_logs
  FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "behavior_logs_teacher_read" ON behavior_logs;
CREATE POLICY "behavior_logs_teacher_read" ON behavior_logs
  FOR SELECT USING (
    auth.uid() IS NULL OR
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = behavior_logs.course_id
        AND c.teacher_id = auth.uid()
    )
  );
