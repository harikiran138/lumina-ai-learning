-- =============================================================================
-- Lumina LMS — Unified Role Migration (Faculty -> Teacher)
-- Date: 2026-04-05
-- Description: Standardizes 'faculty' role into 'teacher' across the system.
--              Includes profile merging, column renaming, and role re-assignment.
-- =============================================================================

-- ─── 01. Prepare teacher_profiles for payload from faculty_profiles ─────────
-- Add missing columns to teacher_profiles if they exist in faculty_profiles
ALTER TABLE teacher_profiles 
ADD COLUMN IF NOT EXISTS employee_id TEXT,
ADD COLUMN IF NOT EXISTS institution_id UUID, -- Foreign key handled if institutions table exists
ADD COLUMN IF NOT EXISTS department TEXT,
ADD COLUMN IF NOT EXISTS designation TEXT,
ADD COLUMN IF NOT EXISTS verification_docs TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS office_hours TEXT,
ADD COLUMN IF NOT EXISTS faculty_notes TEXT, -- User wants to keep notes but maybe rename later? Keeping for data integrity.
ADD COLUMN IF NOT EXISTS grading_scale TEXT,
ADD COLUMN IF NOT EXISTS analytics_focus TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT FALSE;

-- ─── 02. Data Migration: Move faculty_profiles to teacher_profiles ──────
INSERT INTO teacher_profiles (
    user_id, full_name, employee_id, institution_id, department, designation, 
    subjects, experience_years, verification_docs, office_hours, 
    faculty_notes, grading_scale, analytics_focus, is_verified, created_at, updated_at
)
SELECT 
    user_id, full_name, employee_id, institution_id, department, designation, 
    subjects, experience_years, verification_docs, office_hours, 
    faculty_notes, grading_scale, analytics_focus, is_verified, created_at, updated_at
FROM faculty_profiles
ON CONFLICT (user_id) DO UPDATE SET
    employee_id = COALESCE(EXCLUDED.employee_id, teacher_profiles.employee_id),
    institution_id = COALESCE(EXCLUDED.institution_id, teacher_profiles.institution_id),
    department = COALESCE(EXCLUDED.department, teacher_profiles.department),
    designation = COALESCE(EXCLUDED.designation, teacher_profiles.designation),
    verification_docs = COALESCE(EXCLUDED.verification_docs, teacher_profiles.verification_docs),
    office_hours = COALESCE(EXCLUDED.office_hours, teacher_profiles.office_hours),
    faculty_notes = COALESCE(EXCLUDED.faculty_notes, teacher_profiles.faculty_notes),
    grading_scale = COALESCE(EXCLUDED.grading_scale, teacher_profiles.grading_scale),
    analytics_focus = COALESCE(EXCLUDED.analytics_focus, teacher_profiles.analytics_focus),
    is_verified = COALESCE(EXCLUDED.is_verified, teacher_profiles.is_verified);

-- Drop old faculty_profiles table
DROP TABLE IF EXISTS faculty_profiles CASCADE;

-- ─── 03. Rename columns and tables using 'faculty' ───────────────────────────
-- Tables
ALTER TABLE IF EXISTS faculty_applications RENAME TO teacher_applications;

-- Columns
ALTER TABLE IF EXISTS attendance_sessions RENAME COLUMN faculty_id TO teacher_id;
ALTER TABLE IF EXISTS video_analyses RENAME COLUMN faculty_id TO teacher_id;
ALTER TABLE IF EXISTS ai_answer_queue RENAME COLUMN faculty_note TO teacher_note;
ALTER TABLE IF EXISTS community_replies RENAME COLUMN is_faculty_reply TO is_teacher_reply;

-- ─── 04. Update Role Data ───────────────────────────────────────────────────
-- Re-assign users to 'teacher'
UPDATE users SET role = 'teacher' WHERE role = 'faculty';
UPDATE employees SET role = 'teacher' WHERE role = 'faculty';
ALTER TABLE employees ALTER COLUMN role SET DEFAULT 'teacher';

-- Update user_roles table re-assignment
DO $$
DECLARE
    t_id UUID;
    f_id UUID;
BEGIN
    SELECT id INTO t_id FROM roles WHERE name = 'teacher';
    SELECT id INTO f_id FROM roles WHERE name = 'faculty';
    
    IF f_id IS NOT NULL AND t_id IS NOT NULL THEN
        -- Insert new teacher role for users who only had faculty
        INSERT INTO user_roles (user_id, role_id, institution_id)
        SELECT DISTINCT user_id, t_id, institution_id
        FROM user_roles
        WHERE role_id = f_id
        ON CONFLICT (user_id, role_id, institution_id) DO NOTHING;
        
        -- Delete the old faculty role assignments
        DELETE FROM user_roles WHERE role_id = f_id;
        
        -- Finally delete the faculty role from roles definition
        DELETE FROM roles WHERE id = f_id;
    END IF;
END $$;

-- ─── 05. Update Constraints ─────────────────────────────────────────────────
-- Attendance Session index cleanup
DROP INDEX IF EXISTS idx_as_faculty;
CREATE INDEX IF NOT EXISTS idx_as_teacher ON attendance_sessions(teacher_id);

-- Video Analysis index cleanup
DROP INDEX IF EXISTS idx_va_faculty;
CREATE INDEX IF NOT EXISTS idx_va_teacher ON video_analyses(teacher_id);

-- Flashcards source constraint
ALTER TABLE flashcards DROP CONSTRAINT IF EXISTS flashcards_source_check;
ALTER TABLE flashcards ADD CONSTRAINT flashcards_source_check CHECK (source IN ('ai','teacher','student'));
UPDATE flashcards SET source = 'teacher' WHERE source = 'faculty';

-- ai_answer_queue status updates (merging escalated_to_faculty into pending)
-- (Only if they exist, but the code had them)
UPDATE ai_answer_queue SET status = 'pending' WHERE status = 'escalated_to_faculty';
ALTER TABLE ai_answer_queue DROP CONSTRAINT IF EXISTS chk_aaq_status;
ALTER TABLE ai_answer_queue ADD CONSTRAINT chk_aaq_status CHECK (status IN ('pending', 'approved', 'edited_approved', 'rejected', 'escalated_to_hod'));
