-- Migration 030: Unified AI jobs table for background task polling
-- Lumina AI LMS — Section F2
-- All LLM calls are background tasks; clients poll this table for results.

CREATE TABLE IF NOT EXISTS ai_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id),
  user_id UUID NOT NULL REFERENCES users(id),
  job_type TEXT NOT NULL,  -- 'quiz_generation', 'tutor_chat', 'video_analysis', 'grade_essay', 'pathway_recommend'
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'processing', 'complete', 'failed')),
  result JSONB,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ GENERATED ALWAYS AS (created_at + INTERVAL '24 hours') STORED
);

ALTER TABLE ai_jobs ENABLE ROW LEVEL SECURITY;

-- Users see only their own jobs
DROP POLICY IF EXISTS "Users see their own jobs" ON ai_jobs;
CREATE POLICY "Users see their own jobs" ON ai_jobs
  FOR SELECT USING (user_id = auth.uid());

-- Admins can see all jobs in their institution
DROP POLICY IF EXISTS "Admins see all institution jobs" ON ai_jobs;
CREATE POLICY "Admins see all institution jobs" ON ai_jobs
  FOR SELECT
  USING (
    institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid())
        IN ('admin', 'college_admin', 'institution_admin', 'system_admin', 'super_admin')
  );

CREATE INDEX IF NOT EXISTS idx_ai_jobs_user_status
  ON ai_jobs (user_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_jobs_institution_type
  ON ai_jobs (institution_id, job_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_jobs_expires
  ON ai_jobs (expires_at)
  WHERE status IN ('complete', 'failed');

-- Cleanup function (run via pg_cron or a scheduled task)
CREATE OR REPLACE FUNCTION cleanup_expired_ai_jobs() RETURNS void
LANGUAGE SQL
SECURITY DEFINER
AS $$
  DELETE FROM ai_jobs WHERE expires_at < NOW();
$$;
