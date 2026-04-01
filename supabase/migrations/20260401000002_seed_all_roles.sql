-- ============================================================================
-- Migration: Seed All 11 Lumina Institutional Roles
-- Date: 2026-04-01
-- Description: Ensures all 11+ roles exist in the `roles` table.
--              Adds missing roles without duplicating existing ones.
-- ============================================================================

-- Add a description column if it doesn't exist
ALTER TABLE roles ADD COLUMN IF NOT EXISTS description TEXT;

-- Insert/update all roles
-- Existing roles: admin, hod, teacher, student, parent, counselor
-- Missing roles: faculty, super_admin, college_admin, mentor, peer_tutor, researcher
INSERT INTO roles (name, description) VALUES
  ('student',       'Adaptive learning, AI tutor, own progress & flashcards'),
  ('teacher',       'Content creation, AI verification, class analytics, verification queue'),
  ('faculty',       'Course oversight, grading, department course data'),
  ('hod',           'Department governance, risk scores, attendance, grades'),
  ('admin',         'Institutional operations, all institutional data'),
  ('college_admin', 'College-level administration and configuration'),
  ('super_admin',   'Platform management, system-wide configuration'),
  ('parent',        'Monitor child progress, restricted progress view'),
  ('mentor',        'Guidance & support, mentee performance data'),
  ('peer_tutor',    'Collaborative learning, limited peer interaction'),
  ('counselor',     'Safeguarding & wellbeing, encrypted student notes'),
  ('researcher',    'Educational impact studies, anonymized datasets only')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description;

-- ============================================================================
-- Ensure the login_attempts table exists for brute-force protection
-- ============================================================================
CREATE TABLE IF NOT EXISTS login_attempts (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  identifier  TEXT NOT NULL,
  ip_address  TEXT NOT NULL DEFAULT '0.0.0.0',
  attempts    INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_attempt TIMESTAMPTZ DEFAULT now(),
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_lookup
  ON login_attempts (identifier, ip_address);

-- ============================================================================
-- Ensure the login_history table exists for audit trails
-- ============================================================================
CREATE TABLE IF NOT EXISTS login_history (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
  college_id      UUID,
  identifier_used TEXT NOT NULL,
  identifier_type TEXT NOT NULL DEFAULT 'email',
  role_at_login   TEXT,
  ip_address      TEXT NOT NULL DEFAULT '0.0.0.0',
  user_agent      TEXT DEFAULT '',
  success         BOOLEAN NOT NULL DEFAULT false,
  failure_reason  TEXT,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_history_user
  ON login_history (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_login_history_identifier
  ON login_history (identifier_used, created_at DESC);

-- ============================================================================
-- Done
-- ============================================================================
