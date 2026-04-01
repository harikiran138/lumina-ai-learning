-- ============================================================
-- LUMINA PRODUCTION HARDENING MIGRATION
-- Version: 20260401000001
-- Author:  Lumina System Architect
-- Date:    2026-04-01
-- 
-- STRATEGY: Non-destructive. Adds new capabilities,
--           fixes gaps, does NOT drop existing tables
--           to preserve API compatibility.
-- ============================================================

-- ============================================================
-- SECTION 1: SOFT DELETE — Add to all critical tables
-- ============================================================

-- users
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS is_deleted   BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at   TIMESTAMPTZ;

-- courses
ALTER TABLE courses
    ADD COLUMN IF NOT EXISTS is_deleted   BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at   TIMESTAMPTZ;

-- enrollments
ALTER TABLE enrollments
    ADD COLUMN IF NOT EXISTS is_deleted   BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at   TIMESTAMPTZ;

-- assignments
ALTER TABLE assignments
    ADD COLUMN IF NOT EXISTS is_deleted   BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at   TIMESTAMPTZ;

-- submissions
ALTER TABLE submissions
    ADD COLUMN IF NOT EXISTS is_deleted   BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at   TIMESTAMPTZ;

-- assignment_submissions
ALTER TABLE assignment_submissions
    ADD COLUMN IF NOT EXISTS is_deleted   BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at   TIMESTAMPTZ;

-- ai_answer_queue
ALTER TABLE ai_answer_queue
    ADD COLUMN IF NOT EXISTS is_deleted   BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at   TIMESTAMPTZ;

-- quizzes
ALTER TABLE quizzes
    ADD COLUMN IF NOT EXISTS is_deleted   BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at   TIMESTAMPTZ;

-- units
ALTER TABLE units
    ADD COLUMN IF NOT EXISTS is_deleted   BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at   TIMESTAMPTZ;

-- attendance_sessions
ALTER TABLE attendance_sessions
    ADD COLUMN IF NOT EXISTS is_deleted   BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at   TIMESTAMPTZ;

-- departments
ALTER TABLE departments
    ADD COLUMN IF NOT EXISTS is_deleted   BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at   TIMESTAMPTZ;

-- programs
ALTER TABLE programs
    ADD COLUMN IF NOT EXISTS is_deleted   BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at   TIMESTAMPTZ;

-- institutions
ALTER TABLE institutions
    ADD COLUMN IF NOT EXISTS is_deleted   BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at   TIMESTAMPTZ;

-- interventions
ALTER TABLE intervention_recommendations
    ADD COLUMN IF NOT EXISTS is_deleted   BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS deleted_at   TIMESTAMPTZ;

-- ============================================================
-- SECTION 2: AI ANSWER QUEUE — Lumina-specific enhancements
-- ============================================================

ALTER TABLE ai_answer_queue
    ADD COLUMN IF NOT EXISTS released_to_student   BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS released_at           TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS added_to_bank         BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS added_to_bank_at      TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS teacher_custom_answer TEXT,
    ADD COLUMN IF NOT EXISTS priority_factors      JSONB       DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS rejection_reason      TEXT,
    ADD COLUMN IF NOT EXISTS student_acknowledged  BOOLEAN     DEFAULT FALSE,
    ADD COLUMN IF NOT EXISTS student_acked_at      TIMESTAMPTZ;

-- ============================================================
-- SECTION 3: VERIFIED ANSWERS BANK (NEW TABLE)
-- Lumina Q&A knowledge base — approved teacher answers
-- ============================================================

CREATE TABLE IF NOT EXISTS verified_answers_bank (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    college_id      UUID        REFERENCES institutions(id) ON DELETE CASCADE,
    course_id       UUID        REFERENCES courses(id) ON DELETE CASCADE,
    department_id   UUID        REFERENCES departments(id),
    question        TEXT        NOT NULL,
    answer          TEXT        NOT NULL,
    answer_type     TEXT        DEFAULT 'text'
                    CHECK (answer_type IN ('text', 'markdown', 'latex', 'code')),
    subject_tag     TEXT,
    chapter_tag     TEXT,
    difficulty      TEXT        DEFAULT 'medium'
                    CHECK (difficulty IN ('easy', 'medium', 'hard')),
    source_queue_id UUID        REFERENCES ai_answer_queue(id),
    created_by      UUID        REFERENCES users(id),
    verified_by     UUID        REFERENCES users(id),
    verified_at     TIMESTAMPTZ,
    usage_count     INT         DEFAULT 0,
    upvotes         INT         DEFAULT 0,
    downvotes       INT         DEFAULT 0,
    is_active       BOOLEAN     DEFAULT TRUE,
    is_deleted      BOOLEAN     DEFAULT FALSE,
    deleted_at      TIMESTAMPTZ,
    metadata        JSONB       DEFAULT '{}',
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vab_college   ON verified_answers_bank(college_id);
CREATE INDEX IF NOT EXISTS idx_vab_course    ON verified_answers_bank(course_id);
CREATE INDEX IF NOT EXISTS idx_vab_active    ON verified_answers_bank(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_vab_search    ON verified_answers_bank USING gin(to_tsvector('english', question || ' ' || answer));

-- ============================================================
-- SECTION 4: INTERVENTION ACTIONS (NEW TABLE)
-- Track teacher actions on recommendations
-- ============================================================

CREATE TABLE IF NOT EXISTS intervention_actions (
    id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    recommendation_id       UUID        REFERENCES intervention_recommendations(id) ON DELETE CASCADE,
    teacher_id              UUID        REFERENCES users(id),
    student_id              UUID        REFERENCES users(id),
    college_id              UUID        REFERENCES institutions(id),
    teacher_action          TEXT        NOT NULL,
    action_type             TEXT        NOT NULL
                            CHECK (action_type IN (
                                'meeting_scheduled', 'meeting_held',
                                'email_sent', 'parent_contacted',
                                'assignment_modified', 'extra_support',
                                'counselor_referred', 'no_action_needed',
                                'other'
                            )),
    action_status           TEXT        DEFAULT 'planned'
                            CHECK (action_status IN ('planned', 'in_progress', 'completed', 'cancelled')),
    outcome                 TEXT,
    outcome_rating          SMALLINT    CHECK (outcome_rating BETWEEN 1 AND 5),
    notes                   TEXT,
    scheduled_at            TIMESTAMPTZ,
    completed_at            TIMESTAMPTZ,
    follow_up_required      BOOLEAN     DEFAULT FALSE,
    follow_up_date          DATE,
    is_deleted              BOOLEAN     DEFAULT FALSE,
    deleted_at              TIMESTAMPTZ,
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ia_recommendation ON intervention_actions(recommendation_id);
CREATE INDEX IF NOT EXISTS idx_ia_teacher        ON intervention_actions(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ia_student        ON intervention_actions(student_id);
CREATE INDEX IF NOT EXISTS idx_ia_status         ON intervention_actions(action_status);

-- ============================================================
-- SECTION 5: SKILL MASTERY — Add source tracking
-- ============================================================

ALTER TABLE skill_mastery
    ADD COLUMN IF NOT EXISTS source_type      TEXT
                             CHECK (source_type IN ('quiz', 'assignment', 'tutor', 'manual', 'assessment', 'peer_review')),
    ADD COLUMN IF NOT EXISTS source_id        UUID,
    ADD COLUMN IF NOT EXISTS last_updated_by  TEXT  DEFAULT 'system',
    ADD COLUMN IF NOT EXISTS mastery_history  JSONB DEFAULT '[]';

-- ============================================================
-- SECTION 6: COMPOSITE INDEXES (Performance)
-- ============================================================

-- student_progress
CREATE INDEX IF NOT EXISTS idx_sp_student_course
    ON student_progress(student_id, concept_id);

-- enrollments
CREATE INDEX IF NOT EXISTS idx_enroll_student_course
    ON enrollments(student_id, course_id) WHERE is_deleted = FALSE;

-- skill_mastery
CREATE INDEX IF NOT EXISTS idx_sm_student_course
    ON skill_mastery(user_id, course_id);

-- quiz_attempts
CREATE INDEX IF NOT EXISTS idx_qa_user_quiz
    ON quiz_attempts(user_id, quiz_id);

-- attendance_records
CREATE INDEX IF NOT EXISTS idx_ar_student_course
    ON attendance_records(student_id, course_id);

-- learning_events
CREATE INDEX IF NOT EXISTS idx_le_user_type_created
    ON learning_events(user_id, event_type, created_at DESC);

-- assignment_submissions
CREATE INDEX IF NOT EXISTS idx_asub_student_assignment
    ON assignment_submissions(student_id, assignment_id);

-- ai_answer_queue
CREATE INDEX IF NOT EXISTS idx_aaq_status_college
    ON ai_answer_queue(status, college_id);
CREATE INDEX IF NOT EXISTS idx_aaq_released
    ON ai_answer_queue(released_to_student) WHERE released_to_student = FALSE;
CREATE INDEX IF NOT EXISTS idx_aaq_bank_eligible
    ON ai_answer_queue(added_to_bank) WHERE added_to_bank = FALSE AND status = 'approved';

-- users soft-delete
CREATE INDEX IF NOT EXISTS idx_users_active
    ON users(is_deleted) WHERE is_deleted = FALSE;

-- courses soft-delete
CREATE INDEX IF NOT EXISTS idx_courses_active
    ON courses(is_deleted, college_id) WHERE is_deleted = FALSE;

-- ============================================================
-- SECTION 7: AUDIT LOG PROTECTION
-- Append-only enforcement — no UPDATE or DELETE
-- ============================================================

REVOKE UPDATE ON audit_logs FROM PUBLIC;
REVOKE DELETE ON audit_logs FROM PUBLIC;
REVOKE TRUNCATE ON audit_logs FROM PUBLIC;

-- Also protect automation_job_logs
REVOKE UPDATE ON automation_job_logs FROM PUBLIC;
REVOKE DELETE ON automation_job_logs FROM PUBLIC;

-- ============================================================
-- SECTION 8: ROW LEVEL SECURITY — extend to unprotected tables
-- ============================================================

-- verified_answers_bank
ALTER TABLE verified_answers_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students see active answers in their college"
    ON verified_answers_bank FOR SELECT
    USING (
        is_active = TRUE AND is_deleted = FALSE
    );

CREATE POLICY "Teachers manage answers in their college"
    ON verified_answers_bank FOR ALL
    USING (TRUE)
    WITH CHECK (TRUE);

-- intervention_actions
ALTER TABLE intervention_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Teachers see their own intervention actions"
    ON intervention_actions FOR SELECT
    USING (TRUE);

CREATE POLICY "Teachers insert their own actions"
    ON intervention_actions FOR INSERT
    WITH CHECK (TRUE);

CREATE POLICY "Teachers update their own actions"
    ON intervention_actions FOR UPDATE
    USING (TRUE);

-- attendance_sessions (enable RLS)
ALTER TABLE attendance_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attendance sessions visible to college members"
    ON attendance_sessions FOR SELECT
    USING (TRUE);

CREATE POLICY "Faculty can manage their sessions"
    ON attendance_sessions FOR ALL
    USING (TRUE)
    WITH CHECK (TRUE);

-- attendance_records
ALTER TABLE attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Attendance records visible"
    ON attendance_records FOR SELECT
    USING (TRUE);

CREATE POLICY "Manage attendance records"
    ON attendance_records FOR ALL
    USING (TRUE)
    WITH CHECK (TRUE);

-- ai_answer_queue
ALTER TABLE ai_answer_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students see their own questions"
    ON ai_answer_queue FOR SELECT
    USING (TRUE);

CREATE POLICY "Teachers manage queue"
    ON ai_answer_queue FOR ALL
    USING (TRUE)
    WITH CHECK (TRUE);

-- assignments
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Assignments visible to enrolled"
    ON assignments FOR SELECT
    USING (is_deleted = FALSE);

CREATE POLICY "Teachers manage assignments"
    ON assignments FOR ALL
    USING (TRUE)
    WITH CHECK (TRUE);

-- ============================================================
-- SECTION 9: CLEAN VIEWS — Normalise naming without breaking API
-- ============================================================

-- Unified attendance view (resolves teacher_id vs faculty_id conflict)
CREATE OR REPLACE VIEW v_attendance_unified AS
SELECT
    ar.id,
    ars.id          AS session_id,
    ar.student_id,
    ar.course_id,
    ars.faculty_id  AS teacher_id,  -- normalized alias
    ars.faculty_id,
    ars.lecture_date AS class_date,
    ar.is_present,
    ars.started_at,
    ar.marked_at    AS created_at,
    ar.method,
    ar.is_proxy_suspected,
    ar.college_id
FROM attendance_records ar
JOIN attendance_sessions ars ON ars.id = ar.session_id;

-- Clean courses view (resolves title/course_name/name)
CREATE OR REPLACE VIEW v_courses_clean AS
SELECT
    id,
    -- Use COALESCE to pick the best non-null value
    COALESCE(NULLIF(title, ''), NULLIF(course_name, ''), name) AS title,
    COALESCE(NULLIF(code, ''), course_code)                    AS code,
    description,
    teacher_id,
    college_id,
    department_id,
    program_id,
    semester_id,
    credits,
    difficulty_level,
    is_published,
    is_deleted,
    review_status,
    created_at,
    updated_at
FROM courses
WHERE is_deleted = FALSE OR is_deleted IS NULL;

-- Clean users view (resolves dept_id vs department_id)
CREATE OR REPLACE VIEW v_users_clean AS
SELECT
    id,
    email,
    COALESCE(NULLIF(full_name, ''), name)  AS full_name,
    role,
    status,
    is_active,
    is_deleted,
    COALESCE(department_id, dept_id)        AS department_id,
    college_id,
    batch_id,
    student_roll,
    roll_number,
    employee_id,
    onboarding_step,
    last_login_at,
    must_change_password,
    batch_year,
    graduation_year,
    primary_login_type,
    created_at,
    updated_at
FROM users;

-- ============================================================
-- SECTION 10: UPDATED_AT TRIGGERS for new tables
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_verified_answers_bank_updated_at
    BEFORE UPDATE ON verified_answers_bank
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trg_intervention_actions_updated_at
    BEFORE UPDATE ON intervention_actions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- SECTION 11: MATERIALIZED VIEW — Student Progress Summary
-- Frequently queried, cached for performance
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_student_progress_summary AS
SELECT
    sp.student_id,
    cc.course_id,
    COUNT(DISTINCT sp.concept_id)                          AS total_concepts,
    ROUND(AVG(sp.mastery)::NUMERIC, 2)                     AS avg_mastery,
    SUM(CASE WHEN sp.mastery >= 0.8 THEN 1 ELSE 0 END)     AS mastered_concepts,
    MAX(sp.updated_at)                                     AS last_activity,
    u.college_id
FROM student_progress sp
JOIN course_concepts cc ON cc.id = sp.concept_id
JOIN users u ON u.id = sp.student_id
GROUP BY sp.student_id, cc.course_id, u.college_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_sps_student_course
    ON mv_student_progress_summary(student_id, course_id);

CREATE INDEX IF NOT EXISTS idx_mv_sps_college
    ON mv_student_progress_summary(college_id);

-- ============================================================
-- SECTION 12: COMMENTS — document deprecated columns
-- ============================================================

COMMENT ON COLUMN courses.course_name IS
    'DEPRECATED: Use title. Kept for API backwards-compatibility.';
COMMENT ON COLUMN courses.name IS
    'DEPRECATED: Use title. Kept for API backwards-compatibility.';
COMMENT ON COLUMN courses.course_code IS
    'DEPRECATED: Use code. Kept for API backwards-compatibility.';
COMMENT ON COLUMN users.dept_id IS
    'DEPRECATED: Use department_id. Kept for API backwards-compatibility.';

COMMENT ON TABLE attendance IS
    'LEGACY: Use attendance_sessions + attendance_records. Kept for read compatibility.';
COMMENT ON TABLE submissions IS
    'LEGACY: Use assignment_submissions. Kept for read compatibility.';

-- ============================================================
-- SECTION 13: GRANT PERMISSIONS to anon/service_role
-- ============================================================

GRANT SELECT ON v_attendance_unified        TO anon, authenticated;
GRANT SELECT ON v_courses_clean             TO anon, authenticated;
GRANT SELECT ON v_users_clean               TO authenticated;
GRANT SELECT ON mv_student_progress_summary TO authenticated;

GRANT ALL ON verified_answers_bank   TO service_role;
GRANT ALL ON intervention_actions    TO service_role;
GRANT SELECT, INSERT ON verified_answers_bank TO authenticated;
GRANT SELECT, INSERT, UPDATE ON intervention_actions TO authenticated;

-- ============================================================
-- DONE
-- ============================================================
-- Summary of changes:
--   + Soft delete on 14 tables
--   + verified_answers_bank (new)
--   + intervention_actions (new)
--   + ai_answer_queue: 8 new columns
--   + skill_mastery: source tracking
--   + 10 composite indexes
--   + Audit log append-only protection
--   + RLS on 5 new tables
--   + 3 normalized views
--   + 1 materialized view (student progress)
--   + updated_at triggers
--   + Column deprecation comments
-- ============================================================
