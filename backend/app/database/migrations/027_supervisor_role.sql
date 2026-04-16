-- Migration 027: Add supervisor role and associated RLS policies
-- Lumina AI LMS — NSRIT Capstone Defense
-- Supervisor sits between HOD (60) and Teacher (40) in the role hierarchy.

-- 1. Add supervisor to the user_role enum (safe — IF NOT EXISTS guard)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'supervisor'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'supervisor';
  END IF;
END
$$;

-- Also add auditor and finance if not present (referenced in RBAC)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'auditor'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'auditor';
  END IF;
END
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum
    WHERE enumlabel = 'finance'
      AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'user_role')
  ) THEN
    ALTER TYPE user_role ADD VALUE 'finance';
  END IF;
END
$$;

-- 2. Supervisors can override grades in their courses
DROP POLICY IF EXISTS "Supervisors can override grades in their courses" ON submission_scorecards;
CREATE POLICY "Supervisors can override grades in their courses" ON submission_scorecards
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM course_faculty_assignments cfa
      JOIN users u ON u.id = auth.uid()
      WHERE cfa.course_id = submission_scorecards.course_id
        AND cfa.user_id = auth.uid()
        AND u.role = 'supervisor'
        AND cfa.institution_id = u.institution_id
    )
  );

-- 3. Supervisors can view all sections of their courses (institution-scoped)
DROP POLICY IF EXISTS "Supervisors can view all sections of their courses" ON course_sections;
CREATE POLICY "Supervisors can view all sections of their courses" ON course_sections
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM course_faculty_assignments cfa
      JOIN users u ON u.id = auth.uid()
      WHERE cfa.course_id = course_sections.course_id
        AND cfa.user_id = auth.uid()
        AND u.role IN ('supervisor', 'hod', 'admin', 'super_admin', 'college_admin', 'institution_admin', 'system_admin')
        AND cfa.institution_id = u.institution_id
    )
  );

-- 4. Admins/super_admins can read all users (institution-scoped for admin, global for super_admin)
DROP POLICY IF EXISTS "Admins can view all users in their institution" ON users;
CREATE POLICY "Admins can view all users in their institution" ON users
  FOR SELECT
  USING (
    auth.uid() = id
    OR (
      SELECT role FROM users WHERE id = auth.uid()
    ) IN ('super_admin', 'system_admin')
    OR (
      institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
      AND (SELECT role FROM users WHERE id = auth.uid()) IN (
        'admin', 'college_admin', 'institution_admin', 'hod', 'supervisor'
      )
    )
  );
