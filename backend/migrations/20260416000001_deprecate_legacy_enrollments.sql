-- Phase 1: Deprecate legacy `enrollments` table
-- Add redirect view so any unmigrated query still works.
-- This is a safety net only — all code must be migrated before this view is removed.

CREATE OR REPLACE VIEW enrollments AS
  SELECT
    id,
    student_id,
    class_id,
    semester_id,
    status,
    created_at
  FROM student_enrollments;

COMMENT ON VIEW enrollments IS
  'Compatibility shim. Will be dropped after all code migrated to student_enrollments.';
