-- Hardening migration: enforce Student -> Class -> Course linkage safely.
-- Uses defensive checks so it can run on partially provisioned environments.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'classes'
  ) THEN
    IF NOT EXISTS (
      SELECT 1
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'classes' AND column_name = 'course_id'
    ) THEN
      ALTER TABLE public.classes
      ADD COLUMN course_id uuid REFERENCES public.courses(id) ON DELETE SET NULL;
    END IF;

    CREATE INDEX IF NOT EXISTS idx_classes_course_id ON public.classes(course_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'student_enrollments'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_student_enrollments_class_id ON public.student_enrollments(class_id);
    CREATE INDEX IF NOT EXISTS idx_student_enrollments_student_class ON public.student_enrollments(student_id, class_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'teacher_assignments'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_teacher_assignments_teacher_class ON public.teacher_assignments(teacher_id, class_id);
  END IF;
END $$;
