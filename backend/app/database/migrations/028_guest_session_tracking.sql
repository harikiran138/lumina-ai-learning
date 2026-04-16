-- Migration 028: Guest session tracking for anonymous analytics
-- Lumina AI LMS — Section A2

CREATE TABLE IF NOT EXISTS guest_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT NOT NULL UNIQUE,   -- anonymous fingerprint, never PII
  institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
  pages_visited JSONB DEFAULT '[]'::jsonb,
  course_previews JSONB DEFAULT '[]'::jsonb,  -- {course_id, duration_seconds, timestamp}
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: only admins and super_admins can read guest sessions
ALTER TABLE guest_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view guest sessions for their institution" ON guest_sessions;
CREATE POLICY "Admins can view guest sessions for their institution" ON guest_sessions
  FOR SELECT
  USING (
    (SELECT role FROM users WHERE id = auth.uid()) IN ('super_admin', 'system_admin')
    OR (
      (SELECT role FROM users WHERE id = auth.uid()) IN ('admin', 'college_admin', 'institution_admin')
      AND (
        institution_id IS NULL
        OR institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
      )
    )
  );

-- Backend service can insert via service_role key (bypasses RLS)
-- No INSERT RLS needed — server-side only inserts using service role

CREATE INDEX IF NOT EXISTS idx_guest_sessions_token ON guest_sessions (session_token);
CREATE INDEX IF NOT EXISTS idx_guest_sessions_institution ON guest_sessions (institution_id, last_seen_at DESC);
