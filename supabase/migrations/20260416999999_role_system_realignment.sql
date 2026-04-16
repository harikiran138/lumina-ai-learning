-- ============================================================================
-- Migration: Role System Realignment (B.Tech Edition)
-- Date: 2026-04-16
-- Description: Standardizes the role system to exactly 9 roles.
--              Removes redundant or duplicate roles.
-- ============================================================================

-- 1. CLEANUP: Delete roles that are NOT in the new 9-role system
DELETE FROM roles 
WHERE name NOT IN (
  'student', 
  'faculty', 
  'hod', 
  'admin', 
  'parent', 
  'counselor', 
  'peer_mentor', 
  'alumni', 
  'super_admin'
);

-- 2. ADD/UPDATE: Ensure the 9 core roles exist with correct descriptions
INSERT INTO roles (name, description) VALUES
  ('student',       'AI Tutor, Adaptive Learning, Knowledge Graph, SM-2 Flashcards, Streak Tracking'),
  ('faculty',       'AI Verification Queue, Syllabus AI, Auto-grading, Class Knowledge Graph'),
  ('hod',           'Department Analytics, Faculty Performance, Syllabus Tracking, Intervention Tools'),
  ('admin',         'User Lifecycle, AI Cost Dashboard, Policy Manager, Alert Config, Integrations'),
  ('parent',        'Student Progress, Alerts, Weekly Reports, Faculty Communication'),
  ('counselor',     'At-risk Feed, Behavioral Analytics, Private Notes, Intervention Tracker'),
  ('peer_mentor',   'Q&A Forum, Study Group Hosting, Credit System, Faculty Escalation'),
  ('alumni',        'Mentorship, Mock Interviews, Job Board, Curriculum Feedback'),
  ('super_admin',   'Institution Management, AI Model Control, Billing, Audit Logs')
ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description;

-- 3. MIGRATION: Update users with legacy roles to their new equivalents
UPDATE users SET role = 'peer_mentor' WHERE role = 'mentor';
UPDATE users SET role = 'peer_mentor' WHERE role = 'peer_tutor';
UPDATE users SET role = 'student'     WHERE role = 'researcher';
UPDATE users SET role = 'faculty'     WHERE role = 'teacher';
UPDATE users SET role = 'admin'       WHERE role IN ('college_admin', 'institution_admin', 'system_admin');

-- 4. Final Cleanup of invalid roles in users table (default to student if unknown)
UPDATE users 
SET role = 'student' 
WHERE role NOT IN (SELECT name FROM roles);
