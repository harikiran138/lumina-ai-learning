-- Normalize legacy academic endpoints onto the canonical class/enrollment model.
--
-- The live schema still exposes a standalone `sections` table. That duplicates the
-- canonical `classes` model and is not aligned with the current backend path, which
-- treats classes as the source of truth and uses sections only as a compatibility
-- route.
--
-- This migration preserves backward compatibility by:
-- 1. Renaming the legacy `sections` table to `sections_legacy` when it exists.
-- 2. Recreating `sections` as a compatibility view over `classes`.
-- 3. Recreating `enrollments` as a compatibility view over `student_enrollments`.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'sections'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.views
    WHERE table_schema = 'public'
      AND table_name = 'sections'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'sections_legacy'
  ) THEN
    EXECUTE 'ALTER TABLE public.sections RENAME TO sections_legacy';
  END IF;
END $$;

DROP VIEW IF EXISTS public.sections;
CREATE VIEW public.sections AS
SELECT
  c.id,
  c.id AS class_id,
  c.program_id,
  c.semester_id,
  c.section_name AS name,
  c.section_name,
  c.batch_id,
  c.academic_year_id,
  c.batch_year,
  NULL::text AS room_number,
  NULL::integer AS capacity,
  c.created_at
FROM public.classes c;

COMMENT ON VIEW public.sections IS
  'Compatibility shim over classes. Legacy sections data, if any, is retained in sections_legacy.';

DROP VIEW IF EXISTS public.enrollments;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'enrollments'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.views
    WHERE table_schema = 'public'
      AND table_name = 'enrollments'
  ) AND NOT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = 'enrollments_legacy'
  ) THEN
    EXECUTE 'ALTER TABLE public.enrollments RENAME TO enrollments_legacy';
  END IF;
END $$;

CREATE VIEW public.enrollments AS
SELECT
  se.id,
  se.student_id,
  se.program_id,
  se.current_semester_id,
  se.class_id,
  se.year_of_study,
  se.status,
  se.enrolled_at,
  se.updated_at,
  se.section_id,
  se.academic_year_id,
  se.enrolled_at AS created_at
FROM public.student_enrollments se;

COMMENT ON VIEW public.enrollments IS
  'Compatibility shim over student_enrollments. Canonical writes must target student_enrollments.';
