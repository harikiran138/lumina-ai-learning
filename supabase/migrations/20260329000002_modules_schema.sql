-- =============================================================================
-- Lumina LMS — Modules Schema Migration
-- Date: 2026-03-29
-- Description: Adds course Q&A / AI answer queue, flashcards / FSRS,
--              QR-based attendance sessions, dropout risk scores,
--              and community tables. All changes are additive.
-- =============================================================================

-- ─── 01. Course Q&A ──────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_questions (
  id          SERIAL       PRIMARY KEY,
  course_id   UUID         REFERENCES courses(id)  ON DELETE CASCADE,
  student_id  UUID         REFERENCES users(id)    ON DELETE CASCADE,
  college_id  UUID,
  question_text TEXT       NOT NULL,
  context_lecture_id UUID,
  created_at  TIMESTAMPTZ  DEFAULT NOW(),
  is_resolved BOOLEAN      DEFAULT FALSE
);
CREATE INDEX IF NOT EXISTS idx_cq_course    ON course_questions(course_id);
CREATE INDEX IF NOT EXISTS idx_cq_student   ON course_questions(student_id);
CREATE INDEX IF NOT EXISTS idx_cq_college   ON course_questions(college_id);

-- ─── 02. AI Answer Queue (enhanced if table exists from prior migration) ──────
-- The 20260327 schema already creates ai_answer_queue; extend it here.
ALTER TABLE ai_answer_queue ADD COLUMN IF NOT EXISTS question_id      INT  REFERENCES course_questions(id) ON DELETE CASCADE;
ALTER TABLE ai_answer_queue ADD COLUMN IF NOT EXISTS ai_model         VARCHAR(60);
ALTER TABLE ai_answer_queue ADD COLUMN IF NOT EXISTS ai_confidence    NUMERIC(4,3);
ALTER TABLE ai_answer_queue ADD COLUMN IF NOT EXISTS ai_sources       JSONB;
ALTER TABLE ai_answer_queue ADD COLUMN IF NOT EXISTS final_answer     TEXT;
ALTER TABLE ai_answer_queue ADD COLUMN IF NOT EXISTS faculty_note     TEXT;
ALTER TABLE ai_answer_queue ADD COLUMN IF NOT EXISTS college_id       UUID;
ALTER TABLE ai_answer_queue ADD COLUMN IF NOT EXISTS reviewed_by      UUID  REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE ai_answer_queue ADD COLUMN IF NOT EXISTS reviewed_at      TIMESTAMPTZ;

-- Add ai_draft as alias column (keep student_question for backward compat)
ALTER TABLE ai_answer_queue ADD COLUMN IF NOT EXISTS ai_draft TEXT;

-- Ensure status has correct values (existing data may have old values — skip constraint if data conflicts)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'ai_answer_queue' AND constraint_name = 'chk_aaq_status'
  ) THEN
    -- Reset any old status values first
    UPDATE ai_answer_queue SET status = 'pending' WHERE status NOT IN ('pending','approved','edited_approved','rejected');
    ALTER TABLE ai_answer_queue
      ADD CONSTRAINT chk_aaq_status
        CHECK (status IN ('pending','approved','edited_approved','rejected'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_aaq_pending  ON ai_answer_queue(status) WHERE status = 'pending';
CREATE INDEX IF NOT EXISTS idx_aaq_course   ON ai_answer_queue(course_id);
CREATE INDEX IF NOT EXISTS idx_aaq_college  ON ai_answer_queue(college_id);

-- ─── 03. Flashcards ───────────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS flashcards (
  id          SERIAL       PRIMARY KEY,
  course_id   UUID         REFERENCES courses(id) ON DELETE CASCADE,
  lecture_id  UUID,
  college_id  UUID,
  created_by  UUID         REFERENCES users(id) ON DELETE SET NULL,
  front       TEXT         NOT NULL,
  back        TEXT         NOT NULL,
  topic_tags  TEXT[]       DEFAULT '{}',
  source      VARCHAR(20)  DEFAULT 'ai'
                           CHECK (source IN ('ai','faculty','student')),
  is_active   BOOLEAN      DEFAULT TRUE,
  created_at  TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_fc_course   ON flashcards(course_id);
CREATE INDEX IF NOT EXISTS idx_fc_college  ON flashcards(college_id);

-- ─── 04. Student Flashcard Progress (FSRS v5) ────────────────────────────────
CREATE TABLE IF NOT EXISTS student_flashcard_progress (
  id           SERIAL       PRIMARY KEY,
  student_id   UUID         REFERENCES users(id)     ON DELETE CASCADE,
  flashcard_id INT          REFERENCES flashcards(id) ON DELETE CASCADE,
  college_id   UUID,
  -- FSRS v5 fields
  stability    NUMERIC(8,4) DEFAULT 1.0,
  difficulty   NUMERIC(4,3) DEFAULT 0.3,
  due_date     DATE         NOT NULL DEFAULT CURRENT_DATE,
  last_review  TIMESTAMPTZ,
  review_count INT          DEFAULT 0,
  lapses       INT          DEFAULT 0,
  state        VARCHAR(12)  DEFAULT 'new'
                            CHECK (state IN ('new','learning','review','relearning')),
  created_at   TIMESTAMPTZ  DEFAULT NOW(),
  updated_at   TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(student_id, flashcard_id)
);
CREATE INDEX IF NOT EXISTS idx_sfp_due    ON student_flashcard_progress(student_id, due_date);
CREATE INDEX IF NOT EXISTS idx_sfp_state  ON student_flashcard_progress(student_id, state);

-- ─── 05. Attendance Sessions (QR-based) ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance_sessions (
  id              SERIAL      PRIMARY KEY,
  course_id       UUID        REFERENCES courses(id) ON DELETE CASCADE,
  faculty_id      UUID        REFERENCES users(id)   ON DELETE SET NULL,
  college_id      UUID,
  lecture_date    DATE        NOT NULL,
  started_at      TIMESTAMPTZ,
  ended_at        TIMESTAMPTZ,
  total_students  INT         DEFAULT 0,
  present_count   INT         DEFAULT 0,
  qr_code_token   VARCHAR(64) UNIQUE,
  qr_expires_at   TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_as_course   ON attendance_sessions(course_id);
CREATE INDEX IF NOT EXISTS idx_as_faculty  ON attendance_sessions(faculty_id);

-- ─── 06. Attendance Records (enhanced) ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS attendance_records (
  id                  SERIAL      PRIMARY KEY,
  session_id          INT         REFERENCES attendance_sessions(id) ON DELETE CASCADE,
  student_id          UUID        REFERENCES users(id) ON DELETE CASCADE,
  course_id           UUID,
  college_id          UUID,
  marked_at           TIMESTAMPTZ DEFAULT NOW(),
  method              VARCHAR(20) DEFAULT 'manual'
                                  CHECK (method IN ('manual','qr','proxy_flagged')),
  is_present          BOOLEAN     DEFAULT TRUE,
  is_proxy_suspected  BOOLEAN     DEFAULT FALSE,
  proxy_evidence      JSONB,
  UNIQUE(session_id, student_id)
);
CREATE INDEX IF NOT EXISTS idx_ar_session  ON attendance_records(session_id);
CREATE INDEX IF NOT EXISTS idx_ar_student  ON attendance_records(student_id);
CREATE INDEX IF NOT EXISTS idx_ar_course   ON attendance_records(course_id, student_id);

-- Attendance summary materialized view
CREATE MATERIALIZED VIEW IF NOT EXISTS student_attendance_summary AS
SELECT
  student_id,
  course_id,
  college_id,
  COUNT(*) FILTER (WHERE is_present = TRUE)                        AS present_count,
  COUNT(*)                                                          AS total_sessions,
  ROUND(
    COUNT(*) FILTER (WHERE is_present = TRUE)::NUMERIC
    / NULLIF(COUNT(*), 0) * 100, 2
  )                                                                 AS attendance_pct
FROM attendance_records
GROUP BY student_id, course_id, college_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_sas_student_course
  ON student_attendance_summary(student_id, course_id);

-- ─── 07. Student Risk Scores (dropout prediction) ────────────────────────────
CREATE TABLE IF NOT EXISTS student_risk_scores (
  id             SERIAL       PRIMARY KEY,
  student_id     UUID         REFERENCES users(id) ON DELETE CASCADE,
  college_id     UUID,
  department_id  UUID,
  risk_score     NUMERIC(4,3) NOT NULL CHECK (risk_score BETWEEN 0 AND 1),
  risk_level     VARCHAR(10)  NOT NULL CHECK (risk_level IN ('low','medium','high')),
  shap_values    JSONB        NOT NULL DEFAULT '{}',
  top_risk_factors TEXT[]     DEFAULT '{}',
  computed_at    TIMESTAMPTZ  DEFAULT NOW(),
  semester       VARCHAR(10)
);
CREATE INDEX IF NOT EXISTS idx_srs_college   ON student_risk_scores(college_id, risk_level);
CREATE INDEX IF NOT EXISTS idx_srs_student   ON student_risk_scores(student_id, computed_at DESC);

-- ─── 08. Community (enhanced) ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS community_posts (
  id            SERIAL       PRIMARY KEY,
  college_id    UUID         NOT NULL,
  author_id     UUID         REFERENCES users(id) ON DELETE SET NULL,
  department_id UUID,
  category      VARCHAR(30)  NOT NULL
                             CHECK (category IN ('general','academic','placement','events','projects')),
  title         VARCHAR(255) NOT NULL,
  body          TEXT         NOT NULL,
  tags          TEXT[]       DEFAULT '{}',
  upvotes       INT          DEFAULT 0,
  is_pinned     BOOLEAN      DEFAULT FALSE,
  is_anonymous  BOOLEAN      DEFAULT FALSE,
  is_moderated  BOOLEAN      DEFAULT FALSE,
  created_at    TIMESTAMPTZ  DEFAULT NOW(),
  updated_at    TIMESTAMPTZ  DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cp_college   ON community_posts(college_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_cp_category  ON community_posts(college_id, category);

CREATE TABLE IF NOT EXISTS community_replies (
  id               SERIAL      PRIMARY KEY,
  post_id          INT         REFERENCES community_posts(id) ON DELETE CASCADE,
  college_id       UUID,
  author_id        UUID        REFERENCES users(id) ON DELETE SET NULL,
  body             TEXT        NOT NULL,
  upvotes          INT         DEFAULT 0,
  is_faculty_reply BOOLEAN     DEFAULT FALSE,
  is_anonymous     BOOLEAN     DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_cr_post ON community_replies(post_id);

CREATE TABLE IF NOT EXISTS post_votes (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  post_id INT  REFERENCES community_posts(id) ON DELETE CASCADE,
  PRIMARY KEY (user_id, post_id)
);

-- ─── 09. Video Analyses (MLFD) ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS video_analyses (
  id                SERIAL      PRIMARY KEY,
  lecture_id        INT,
  faculty_id        UUID        REFERENCES users(id) ON DELETE SET NULL,
  college_id        UUID,
  minio_object_key  TEXT        NOT NULL,
  status            VARCHAR(20) DEFAULT 'queued'
                               CHECK (status IN ('queued','processing','done','failed')),
  duration_seconds  INT,
  frame_count       INT,
  results_json      JSONB,
  error_message     TEXT,
  queued_at         TIMESTAMPTZ DEFAULT NOW(),
  started_at        TIMESTAMPTZ,
  completed_at      TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_va_faculty ON video_analyses(faculty_id);

-- ─── 10. Lecture Progress ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lecture_progress (
  id               SERIAL      PRIMARY KEY,
  student_id       UUID        REFERENCES users(id) ON DELETE CASCADE,
  lecture_id       UUID        NOT NULL,
  course_id        UUID,
  watched_seconds  INT         DEFAULT 0,
  completed        BOOLEAN     DEFAULT FALSE,
  last_watched_at  TIMESTAMPTZ,
  UNIQUE(student_id, lecture_id)
);
CREATE INDEX IF NOT EXISTS idx_lp_student ON lecture_progress(student_id);
CREATE INDEX IF NOT EXISTS idx_lp_course  ON lecture_progress(student_id, course_id);
