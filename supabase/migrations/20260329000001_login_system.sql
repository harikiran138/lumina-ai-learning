-- =============================================================================
-- Lumina LMS — Login System Migration
-- Date: 2026-03-29
-- Description: Adds identifier-based auth, login history, brute-force
--              protection, invite flow, demo accounts, and student imports.
--              All changes are ADDITIVE — no destructive DROPs.
-- =============================================================================

-- ─── A. New ENUM type ─────────────────────────────────────────────────────────
DO $$ BEGIN
  CREATE TYPE login_identifier_type AS ENUM ('email', 'roll_number', 'employee_id');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── B. Extend users table ────────────────────────────────────────────────────
-- Roll number (students): format 22NU1A0519
ALTER TABLE users ADD COLUMN IF NOT EXISTS roll_number       VARCHAR(12)              UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS roll_number_year  SMALLINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS roll_number_branch VARCHAR(4);

-- Employee ID (faculty/HOD): format FAC001 | HOD001 | ADM001
ALTER TABLE users ADD COLUMN IF NOT EXISTS employee_id       VARCHAR(10)              UNIQUE;

-- Primary login method for this user
ALTER TABLE users ADD COLUMN IF NOT EXISTS primary_login_type login_identifier_type   NOT NULL DEFAULT 'email';

-- Academic fields (department_id already exists from prior migration)
ALTER TABLE users ADD COLUMN IF NOT EXISTS section           VARCHAR(4);
ALTER TABLE users ADD COLUMN IF NOT EXISTS batch_year        SMALLINT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS graduation_year   SMALLINT;

-- ─── B.1  Format constraints ──────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE users
    ADD CONSTRAINT chk_roll_number_format
      CHECK (roll_number IS NULL OR roll_number ~ '^\d{2}NU\dA\d{4}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE users
    ADD CONSTRAINT chk_employee_id_format
      CHECK (employee_id IS NULL OR employee_id ~ '^(FAC|HOD|ADM)\d{3}$');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── C. login_history ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS login_history (
  id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID         REFERENCES users(id) ON DELETE CASCADE,
  college_id       UUID,
  identifier_used  TEXT         NOT NULL,
  identifier_type  login_identifier_type,
  role_at_login    TEXT,
  ip_address       INET,
  user_agent       TEXT,
  device_type      VARCHAR(20),
  success          BOOLEAN      NOT NULL DEFAULT false,
  failure_reason   TEXT,
  session_id       UUID,
  created_at       TIMESTAMPTZ  DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_login_history_user_id   ON login_history (user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_college   ON login_history (college_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created   ON login_history (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_ip        ON login_history (ip_address);

-- ─── D. login_attempts (brute-force protection) ───────────────────────────────
CREATE TABLE IF NOT EXISTS login_attempts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier   TEXT        NOT NULL,
  ip_address   INET        NOT NULL,
  attempts     SMALLINT    DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_attempt TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_login_attempts_id_ip
  ON login_attempts (identifier, ip_address);

-- ─── E. user_invites ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_invites (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id     UUID,
  department_id  UUID        REFERENCES departments(id) ON DELETE SET NULL,
  invited_by     UUID        REFERENCES users(id)       ON DELETE SET NULL,
  email          TEXT        NOT NULL,
  intended_role  TEXT        NOT NULL,
  token          UUID        NOT NULL DEFAULT gen_random_uuid(),
  expires_at     TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '72 hours'),
  accepted_at    TIMESTAMPTZ,
  created_user_id UUID       REFERENCES users(id)       ON DELETE SET NULL,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (token)
);

CREATE INDEX IF NOT EXISTS idx_user_invites_token     ON user_invites (token);
CREATE INDEX IF NOT EXISTS idx_user_invites_email     ON user_invites (email);
CREATE INDEX IF NOT EXISTS idx_user_invites_college   ON user_invites (college_id);

-- ─── F. demo_accounts ─────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS demo_accounts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id   UUID,
  user_id      UUID        REFERENCES users(id) ON DELETE CASCADE,
  label        TEXT        NOT NULL,
  display_name TEXT        NOT NULL,
  role         TEXT        NOT NULL,
  identifier   TEXT        NOT NULL,
  is_active    BOOLEAN     DEFAULT true,
  sort_order   SMALLINT    DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_id)
);

-- ─── G. student_import_batches ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS student_import_batches (
  id            UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id    UUID,
  department_id UUID        REFERENCES departments(id) ON DELETE SET NULL,
  imported_by   UUID        REFERENCES users(id)       ON DELETE SET NULL,
  batch_year    SMALLINT,
  section       VARCHAR(4),
  total_rows    INTEGER     DEFAULT 0,
  success_count INTEGER     DEFAULT 0,
  error_count   INTEGER     DEFAULT 0,
  errors_json   JSONB       DEFAULT '[]',
  status        VARCHAR(20) DEFAULT 'pending'
                            CHECK (status IN ('pending','processing','done','failed')),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_import_batches_college ON student_import_batches (college_id);

-- ─── I. resolve_login_identifier() ───────────────────────────────────────────
-- Returns (user_id, resolved_type, role) for any identifier string.
-- Logic: roll number regex → roll_number column
--        employee ID regex  → employee_id column
--        else               → email column
CREATE OR REPLACE FUNCTION resolve_login_identifier(
  p_identifier TEXT,
  p_college_id UUID DEFAULT NULL
)
RETURNS TABLE (
  out_user_id       UUID,
  out_resolved_type login_identifier_type,
  out_role          TEXT
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
AS $$
BEGIN
  IF p_identifier ~ '^\d{2}NU\dA\d{4}$' THEN
    RETURN QUERY
      SELECT u.id,
             'roll_number'::login_identifier_type,
             u.role
      FROM   users u
      WHERE  u.roll_number = p_identifier
        AND  (p_college_id IS NULL OR u.college_id = p_college_id)
      LIMIT  1;

  ELSIF p_identifier ~ '^(FAC|HOD|ADM)\d{3}$' THEN
    RETURN QUERY
      SELECT u.id,
             'employee_id'::login_identifier_type,
             u.role
      FROM   users u
      WHERE  u.employee_id = p_identifier
        AND  (p_college_id IS NULL OR u.college_id = p_college_id)
      LIMIT  1;

  ELSE
    RETURN QUERY
      SELECT u.id,
             'email'::login_identifier_type,
             u.role
      FROM   users u
      WHERE  u.email = p_identifier
        AND  (p_college_id IS NULL OR u.college_id = p_college_id)
      LIMIT  1;
  END IF;
END;
$$;

-- ─── J. parse_roll_number() ───────────────────────────────────────────────────
-- Input  : '22NU1A0519'
-- Output : (batch_yr=22, branch_code='1', seq=519)
CREATE OR REPLACE FUNCTION parse_roll_number(rn VARCHAR)
RETURNS TABLE (
  batch_yr    SMALLINT,
  branch_code VARCHAR,
  seq         INT
)
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT
    SUBSTRING(rn FROM 1 FOR 2)::SMALLINT  AS batch_yr,
    SUBSTRING(rn FROM 5 FOR 1)            AS branch_code,
    SUBSTRING(rn FROM 7 FOR 4)::INT       AS seq;
$$;

-- ─── K. Row-Level Security ────────────────────────────────────────────────────

ALTER TABLE login_history  ENABLE ROW LEVEL SECURITY;
ALTER TABLE login_attempts ENABLE ROW LEVEL SECURITY;

-- service_role bypass (backend writes use the service role key)
DO $$ BEGIN
  CREATE POLICY "login_history_service_all" ON login_history
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE POLICY "login_attempts_service_all" ON login_attempts
    FOR ALL TO service_role USING (true) WITH CHECK (true);
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- College-scoped read policy for authenticated users (e.g. college admins)
DO $$ BEGIN
  CREATE POLICY "login_history_college_read" ON login_history
    FOR SELECT
    USING (
      college_id = NULLIF(current_setting('app.college_id', true), '')::UUID
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
