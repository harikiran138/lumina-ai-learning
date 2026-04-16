# DB Cleanup Deploy Order

This document records the safe deployment order for the compatibility cleanup migration that deprecates the legacy `sections` table and aligns legacy `enrollments` access with the canonical `student_enrollments` model.

## What This Migration Does

- Renames a legacy `sections` table to `sections_legacy` when a real table still exists.
- Recreates `sections` as a compatibility view over `classes`.
- Recreates `enrollments` as a compatibility view over `student_enrollments`.
- Keeps the canonical write path unchanged: `classes` and `student_enrollments` remain the source of truth.

## Safe SQL Order

Run the following in order inside Supabase SQL Editor or via `psql` against the project database.

1. Check for an existing legacy `sections` table.

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('sections', 'sections_legacy', 'enrollments', 'enrollments_legacy');
```

2. Rename the legacy `sections` table only if it still exists and `sections_legacy` does not already exist.

```sql
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
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
```

3. Drop any stale `sections` view.

```sql
DROP VIEW IF EXISTS public.sections;
```

4. Create `sections` as a compatibility view over `classes`.

```sql
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
```

5. Add a comment to make the compatibility contract explicit.

```sql
COMMENT ON VIEW public.sections IS
  'Compatibility shim over classes. Legacy sections data, if any, is retained in sections_legacy.';
```

6. Drop any stale `enrollments` view.

```sql
DROP VIEW IF EXISTS public.enrollments;
```

7. Rename the legacy `enrollments` table only if it still exists and `enrollments_legacy` does not already exist.

```sql
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
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
```

8. Create `enrollments` as a compatibility view over `student_enrollments`.

```sql
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
```

9. Add a comment to make the canonical write path explicit.

```sql
COMMENT ON VIEW public.enrollments IS
  'Compatibility shim over student_enrollments. Canonical writes must target student_enrollments.';
```

10. Refresh the PostgREST schema cache.

```sql
NOTIFY pgrst, 'reload schema';
```

## Verification After Deployment

Run these checks after the migration:

```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('sections', 'sections_legacy', 'enrollments', 'enrollments_legacy');
```

Expected outcome:
- `sections` should be a view.
- `enrollments` should be a view or remain absent if the project does not expose it.
- `sections_legacy` may exist only if the legacy table existed before migration.
- No backend code should issue raw CRUD against `sections`.

## Notes on Remaining Compatibility Columns

- `section_id` is still tolerated as a compatibility field in a few data-normalization paths.
- `academic_year_id` remains part of the current academic model and is safe to keep while frontend/backends still read it.
- `batch` is a presentation-oriented compatibility field and should not become the primary persistence key for new code.

The canonical source of truth remains:
- `classes`
- `student_enrollments`
- `teacher_assignments`
