-- Migration 031: GIN indexes for JSONB columns + composite indexes for multi-tenant queries
-- Lumina AI LMS — Section B3, B4

-- ─── GIN indexes for JSONB columns used in WHERE clauses ─────────────────────

CREATE INDEX IF NOT EXISTS idx_learner_profiles_metadata
  ON learner_profiles USING GIN (metadata);

CREATE INDEX IF NOT EXISTS idx_courses_modules
  ON courses USING GIN (modules);

CREATE INDEX IF NOT EXISTS idx_users_metadata
  ON users USING GIN (metadata);

-- Expression indexes for single JSONB key lookups (faster than GIN for single keys)
CREATE INDEX IF NOT EXISTS idx_courses_price
  ON courses ((metadata->>'price'));

CREATE INDEX IF NOT EXISTS idx_learner_profiles_bio_length
  ON learner_profiles ((length(metadata->>'bio')));

-- ─── Composite indexes (institution_id first — most selective in multi-tenant) ─

CREATE INDEX IF NOT EXISTS idx_users_institution_role
  ON users (institution_id, role);

CREATE INDEX IF NOT EXISTS idx_enrollments_institution_student
  ON enrollments (institution_id, student_id);

CREATE INDEX IF NOT EXISTS idx_courses_institution_published
  ON courses (institution_id, is_published);

CREATE INDEX IF NOT EXISTS idx_audit_logs_institution_timestamp
  ON audit_logs (institution_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_submission_scorecards_course_review
  ON submission_scorecards (course_id, review_required)
  WHERE review_required = true;

-- ─── institution_id scoping: add standard policy to tables missing it ─────────

-- knowledge_nodes — ensure institution-scoped select
DROP POLICY IF EXISTS "institution_scoped_knowledge_nodes" ON knowledge_nodes;
CREATE POLICY "institution_scoped_knowledge_nodes" ON knowledge_nodes
  FOR SELECT
  USING (
    institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
    OR (SELECT role FROM users WHERE id = auth.uid()) IN ('super_admin', 'system_admin')
  );

-- learning_paths
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'learning_paths'
  ) THEN
    EXECUTE $policy$
      DROP POLICY IF EXISTS "institution_scoped_learning_paths" ON learning_paths;
      CREATE POLICY "institution_scoped_learning_paths" ON learning_paths
        FOR SELECT
        USING (
          institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
          OR (SELECT role FROM users WHERE id = auth.uid()) IN ('super_admin', 'system_admin')
        );
    $policy$;
  END IF;
END
$$;

-- quiz_attempts
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'quiz_attempts'
  ) THEN
    EXECUTE $policy$
      DROP POLICY IF EXISTS "institution_scoped_quiz_attempts" ON quiz_attempts;
      CREATE POLICY "institution_scoped_quiz_attempts" ON quiz_attempts
        FOR SELECT
        USING (
          institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
          OR (SELECT role FROM users WHERE id = auth.uid()) IN ('super_admin', 'system_admin')
        );
    $policy$;
  END IF;
END
$$;

-- spaced_repetition_cards
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'spaced_repetition_cards'
  ) THEN
    EXECUTE $policy$
      DROP POLICY IF EXISTS "institution_scoped_spaced_repetition_cards" ON spaced_repetition_cards;
      CREATE POLICY "institution_scoped_spaced_repetition_cards" ON spaced_repetition_cards
        FOR SELECT
        USING (
          institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
          OR (SELECT role FROM users WHERE id = auth.uid()) IN ('super_admin', 'system_admin')
        );
    $policy$;
  END IF;
END
$$;

-- ─── Fix course code uniqueness: institution-scoped, not global ───────────────

ALTER TABLE courses DROP CONSTRAINT IF EXISTS courses_code_key;
CREATE UNIQUE INDEX IF NOT EXISTS idx_courses_code_institution
  ON courses (code, institution_id);

-- ─── Price must be non-negative ───────────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'courses_price_positive'
      AND table_name = 'courses'
  ) THEN
    ALTER TABLE courses ADD CONSTRAINT courses_price_positive
      CHECK ((metadata->>'price') IS NULL OR (metadata->>'price')::NUMERIC >= 0);
  END IF;
END
$$;

-- ─── Modules must be a valid JSON array ───────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'courses_modules_is_array'
      AND table_name = 'courses'
  ) THEN
    ALTER TABLE courses ADD CONSTRAINT courses_modules_is_array
      CHECK (modules IS NULL OR jsonb_typeof(modules) = 'array');
  END IF;
END
$$;

-- ─── Skill uniqueness per student ─────────────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'skill_mastery'
  ) THEN
    EXECUTE $idx$
      CREATE UNIQUE INDEX IF NOT EXISTS idx_skill_mastery_unique_skill
        ON skill_mastery (student_id, institution_id, skill_name);
    $idx$;
  END IF;
END
$$;
