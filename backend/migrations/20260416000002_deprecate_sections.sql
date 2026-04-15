-- Phase 2: Deprecate legacy `sections` table
-- Maps sections columns to classes columns so any unmigrated query still resolves.

CREATE OR REPLACE VIEW sections AS
  SELECT
    id,
    name,
    program_id,
    semester_id,
    academic_year_id,
    batch_id,
    id AS class_id,   -- expose canonical class_id alias
    created_at
  FROM classes;

COMMENT ON VIEW sections IS
  'Compatibility shim. Will be dropped after schedule.py and ai_tutor_store.py migrated to classes.';
