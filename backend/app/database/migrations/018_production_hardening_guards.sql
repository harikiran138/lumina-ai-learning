-- Production hardening guards for submission and AI approval flows.
-- Keep this migration non-destructive and idempotent so it can be applied safely
-- against partially aligned environments.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'assignment_submissions'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_id
      ON public.assignment_submissions(student_id);

    CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id
      ON public.assignment_submissions(assignment_id);

    IF NOT EXISTS (
      SELECT 1
      FROM public.assignment_submissions
      WHERE student_id IS NOT NULL
        AND assignment_id IS NOT NULL
      GROUP BY student_id, assignment_id
      HAVING COUNT(*) > 1
    ) THEN
      CREATE UNIQUE INDEX IF NOT EXISTS idx_assignment_submissions_student_assignment_unique
        ON public.assignment_submissions(student_id, assignment_id)
        WHERE student_id IS NOT NULL AND assignment_id IS NOT NULL;
    ELSE
      RAISE NOTICE 'Skipping unique assignment_submissions index because duplicate rows still exist.';
    END IF;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'ai_answer_queue'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_ai_answer_queue_status
      ON public.ai_answer_queue(status);

    CREATE INDEX IF NOT EXISTS idx_ai_answer_queue_question_id
      ON public.ai_answer_queue(question_id);
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'verified_answers_bank'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_verified_answers_bank_course_id
      ON public.verified_answers_bank(course_id);

    IF NOT EXISTS (
      SELECT 1
      FROM public.verified_answers_bank
      WHERE source_queue_id IS NOT NULL
      GROUP BY source_queue_id
      HAVING COUNT(*) > 1
    ) THEN
      CREATE UNIQUE INDEX IF NOT EXISTS idx_verified_answers_bank_source_queue_unique
        ON public.verified_answers_bank(source_queue_id)
        WHERE source_queue_id IS NOT NULL;
    ELSE
      RAISE NOTICE 'Skipping unique verified_answers_bank index because duplicate source_queue_id rows still exist.';
    END IF;
  END IF;
END $$;
