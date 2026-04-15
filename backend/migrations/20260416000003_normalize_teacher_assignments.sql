-- Phase 3: Normalize teacher_assignments to use class_id exclusively

-- Ensure class_id column exists and is indexed
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name='teacher_assignments' AND column_name='class_id'
  ) THEN
    ALTER TABLE teacher_assignments ADD COLUMN class_id UUID REFERENCES classes(id);
    -- Backfill from section_id if it exists
    UPDATE teacher_assignments ta
    SET class_id = s.id
    FROM classes s
    WHERE ta.section_id = s.id AND ta.class_id IS NULL;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class_id
  ON teacher_assignments(class_id);

CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_class
  ON teacher_assignments(teacher_id, class_id);

-- Ensure student_enrollments also has the right indexes
CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_class
  ON student_enrollments(student_id, class_id);

CREATE INDEX IF NOT EXISTS idx_student_enrollments_class_status
  ON student_enrollments(class_id, status);
