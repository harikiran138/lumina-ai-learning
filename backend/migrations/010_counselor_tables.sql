-- 010_counselor_tables.sql
-- Counselor System - Privacy-First Mental Health & Risk Tables
-- Description: Encrypted counseling notes, risk alerts, reveal audit logs,
--              follow-up task scheduling, and historical risk scoring.
--
-- Security model:
--   - counselor_notes:     AES-256-GCM encrypted blobs; plaintext never stored
--   - risk_reveal_logs:    Immutable audit trail; no UPDATE/DELETE allowed
--   - RLS enabled on all tables
--   - Admin check: public.user_profiles.role IN ('admin', 'super_admin')
--   - service_role bypasses RLS for background jobs

-- =============================================================================
-- 0. SHARED TRIGGER FUNCTION (updated_at)
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =============================================================================
-- 1. TABLE: counselor_notes
--    Stores AES-256-GCM encrypted session notes.
--    Plaintext is NEVER persisted here — only ciphertext + IV + auth-tag.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.counselor_notes (
    id               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    counselor_id     UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id       UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    encrypted_blob   TEXT        NOT NULL,   -- AES-256-GCM ciphertext (base64)
    iv               TEXT        NOT NULL,   -- Initialization vector (base64, 12 bytes)
    auth_tag         TEXT        NOT NULL,   -- GCM authentication tag (base64, 16 bytes)
    key_hint         TEXT,                   -- Optional hint for key retrieval (NOT the key)
    session_date     DATE,                   -- Session date for organisation
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.counselor_notes                IS 'AES-256-GCM encrypted counseling session notes. Plaintext is never stored.';
COMMENT ON COLUMN public.counselor_notes.encrypted_blob IS 'Base64-encoded AES-256-GCM ciphertext';
COMMENT ON COLUMN public.counselor_notes.iv             IS 'Base64-encoded 12-byte initialisation vector';
COMMENT ON COLUMN public.counselor_notes.auth_tag       IS 'Base64-encoded 16-byte GCM authentication tag';
COMMENT ON COLUMN public.counselor_notes.key_hint       IS 'Optional opaque hint for key-retrieval; must NOT contain the actual key';

-- =============================================================================
-- 2. TABLE: risk_alerts
--    Student risk signals. Student identity is decoupled from alert display.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.risk_alerts (
    id                   UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id           UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    institution_id       UUID,
    signal_type          TEXT        NOT NULL,
        -- 'no_activity_3d' | 'sentiment_drop' | 'grade_decline'
        -- | 'self_harm_signal' | 'engagement_drop'
    severity             TEXT        NOT NULL DEFAULT 'low'
        CHECK (severity IN ('low', 'medium', 'high', 'critical')),
    signal_details       JSONB       DEFAULT '{}',          -- Anonymised additional context
    suppression_status   TEXT        NOT NULL DEFAULT 'active'
        CHECK (suppression_status IN ('active', 'suppressed', 'resolved')),
    suppression_expiry   TIMESTAMPTZ,                       -- When suppression lifts
    suppressed_by        UUID        REFERENCES auth.users(id),
    resolved_at          TIMESTAMPTZ,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.risk_alerts                    IS 'Student risk signals. Student identity is decoupled from alert display for privacy.';
COMMENT ON COLUMN public.risk_alerts.signal_type        IS 'no_activity_3d | sentiment_drop | grade_decline | self_harm_signal | engagement_drop';
COMMENT ON COLUMN public.risk_alerts.signal_details     IS 'Anonymised context JSONB blob — no PII should be stored here';
COMMENT ON COLUMN public.risk_alerts.suppression_status IS 'active | suppressed | resolved';
COMMENT ON COLUMN public.risk_alerts.suppression_expiry IS 'Timestamp at which a suppression expires and the alert becomes active again';

-- =============================================================================
-- 3. TABLE: risk_reveal_logs
--    Immutable audit trail for every identity deanonymisation action.
--    Intentionally no updated_at — records must never be altered.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.risk_reveal_logs (
    id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    counselor_id UUID        NOT NULL REFERENCES auth.users(id),
    student_id   UUID        NOT NULL REFERENCES auth.users(id),
    alert_id     UUID        REFERENCES public.risk_alerts(id),
    reason       TEXT        NOT NULL,   -- Mandatory justification (enforced: min 10 chars)
    ip_address   INET,                   -- For compliance audit
    revealed_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
    -- No updated_at — this is an immutable audit record
);

ALTER TABLE public.risk_reveal_logs
    ADD CONSTRAINT risk_reveal_reason_min_length CHECK (char_length(reason) >= 10);

COMMENT ON TABLE  public.risk_reveal_logs             IS 'Immutable audit trail of every counselor identity-reveal action. No UPDATE or DELETE permitted.';
COMMENT ON COLUMN public.risk_reveal_logs.reason      IS 'Mandatory free-text justification; minimum 10 characters enforced by check constraint';
COMMENT ON COLUMN public.risk_reveal_logs.ip_address  IS 'Source IP captured at reveal time for compliance purposes';

-- =============================================================================
-- 4. TABLE: follow_up_tasks
--    Follow-up scheduling with escalation and reminder tracking.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.follow_up_tasks (
    id                    UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id            UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    counselor_id          UUID        REFERENCES auth.users(id),
    alert_id              UUID        REFERENCES public.risk_alerts(id),
    task_type             TEXT        NOT NULL DEFAULT 'check_in',
        -- 'check_in' | 'session' | 'referral' | 'escalation'
    notes                 TEXT,
    due_at                TIMESTAMPTZ NOT NULL,
    status                TEXT        NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'acknowledged', 'completed', 'escalated', 'missed')),
    acknowledged_at       TIMESTAMPTZ,
    completed_at          TIMESTAMPTZ,
    escalated_at          TIMESTAMPTZ,
    escalated_to          UUID        REFERENCES auth.users(id),   -- Admin who received escalation
    reminder_sent_at      TIMESTAMPTZ,                             -- T+2 h reminder timestamp
    escalation_sent_at    TIMESTAMPTZ,                             -- T+24 h escalation timestamp
    created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.follow_up_tasks                    IS 'Counselor follow-up tasks with reminder and escalation tracking.';
COMMENT ON COLUMN public.follow_up_tasks.task_type          IS 'check_in | session | referral | escalation';
COMMENT ON COLUMN public.follow_up_tasks.escalated_to       IS 'Admin user who received the escalation notification';
COMMENT ON COLUMN public.follow_up_tasks.reminder_sent_at   IS 'Timestamp when the T+2h automated reminder was dispatched';
COMMENT ON COLUMN public.follow_up_tasks.escalation_sent_at IS 'Timestamp when the T+24h automated escalation was dispatched';

-- =============================================================================
-- 5. TABLE: student_risk_scores
--    Historical risk scoring records produced by background jobs.
-- =============================================================================

CREATE TABLE IF NOT EXISTS public.student_risk_scores (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id       UUID           NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    institution_id   UUID,
    risk_score       NUMERIC(5, 2)  NOT NULL DEFAULT 0,   -- 0–100
    risk_level       TEXT           NOT NULL DEFAULT 'low'
        CHECK (risk_level IN ('low', 'medium', 'high', 'critical')),
    attendance_score  NUMERIC(5, 2),   -- Component score
    academic_score    NUMERIC(5, 2),   -- Component score
    engagement_score  NUMERIC(5, 2),   -- Component score
    reasons           JSONB          DEFAULT '[]',         -- Array of reason strings
    detected_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    created_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.student_risk_scores             IS 'Historical risk scoring snapshots; INSERT-only via service role background jobs.';
COMMENT ON COLUMN public.student_risk_scores.risk_score  IS 'Composite risk score 0–100';
COMMENT ON COLUMN public.student_risk_scores.reasons     IS 'JSONB array of human-readable reason strings explaining the score';

-- =============================================================================
-- 6. INDEXES
-- =============================================================================

-- counselor_notes
CREATE INDEX IF NOT EXISTS idx_counselor_notes_counselor
    ON public.counselor_notes(counselor_id);
CREATE INDEX IF NOT EXISTS idx_counselor_notes_student
    ON public.counselor_notes(student_id);
CREATE INDEX IF NOT EXISTS idx_counselor_notes_session_date
    ON public.counselor_notes(session_date DESC);

-- risk_alerts
CREATE INDEX IF NOT EXISTS idx_risk_alerts_student
    ON public.risk_alerts(student_id);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_severity
    ON public.risk_alerts(severity);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_status
    ON public.risk_alerts(suppression_status);
CREATE INDEX IF NOT EXISTS idx_risk_alerts_created
    ON public.risk_alerts(created_at DESC);

-- risk_reveal_logs
CREATE INDEX IF NOT EXISTS idx_risk_reveal_logs_counselor
    ON public.risk_reveal_logs(counselor_id);
CREATE INDEX IF NOT EXISTS idx_risk_reveal_logs_student
    ON public.risk_reveal_logs(student_id);
CREATE INDEX IF NOT EXISTS idx_risk_reveal_logs_revealed
    ON public.risk_reveal_logs(revealed_at DESC);

-- follow_up_tasks
CREATE INDEX IF NOT EXISTS idx_follow_up_tasks_counselor
    ON public.follow_up_tasks(counselor_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_tasks_student
    ON public.follow_up_tasks(student_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_tasks_status
    ON public.follow_up_tasks(status);
CREATE INDEX IF NOT EXISTS idx_follow_up_tasks_due
    ON public.follow_up_tasks(due_at ASC);

-- student_risk_scores
CREATE INDEX IF NOT EXISTS idx_risk_scores_student
    ON public.student_risk_scores(student_id);
CREATE INDEX IF NOT EXISTS idx_risk_scores_level
    ON public.student_risk_scores(risk_level);
CREATE INDEX IF NOT EXISTS idx_risk_scores_detected
    ON public.student_risk_scores(detected_at DESC);

-- =============================================================================
-- 7. AUTO-UPDATE TRIGGERS (updated_at)
--    Note: risk_reveal_logs and student_risk_scores intentionally excluded
--    (immutable / append-only respectively).
-- =============================================================================

CREATE TRIGGER update_counselor_notes_updated_at
    BEFORE UPDATE ON public.counselor_notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_risk_alerts_updated_at
    BEFORE UPDATE ON public.risk_alerts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_follow_up_tasks_updated_at
    BEFORE UPDATE ON public.follow_up_tasks
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- 8. ROW LEVEL SECURITY — Enable on all tables
-- =============================================================================

ALTER TABLE public.counselor_notes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_alerts         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.risk_reveal_logs    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follow_up_tasks     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.student_risk_scores ENABLE ROW LEVEL SECURITY;

-- Helper expression reused across policies:
--   (SELECT role FROM public.user_profiles WHERE id = auth.uid()) IN ('admin','super_admin')

-- =============================================================================
-- 8a. RLS: counselor_notes
--     - Counselors SELECT / INSERT their own rows only (append-only)
--     - No UPDATE, No DELETE (integrity)
--     - Admins can SELECT all
-- =============================================================================

-- Counselors: read own notes
CREATE POLICY counselor_notes_select_own
    ON public.counselor_notes
    FOR SELECT
    USING (counselor_id = auth.uid());

-- Counselors: insert own notes
CREATE POLICY counselor_notes_insert_own
    ON public.counselor_notes
    FOR INSERT
    WITH CHECK (counselor_id = auth.uid());

-- Admins: read all notes
CREATE POLICY counselor_notes_select_admin
    ON public.counselor_notes
    FOR SELECT
    USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid())
            IN ('admin', 'super_admin')
    );

-- =============================================================================
-- 8b. RLS: risk_alerts
--     - Counselors can SELECT all alerts (need full triage picture)
--     - Counselors can UPDATE suppression fields only (via app-layer enforcement)
--     - Only service_role (background jobs) can INSERT
--     - Admins can do everything
-- =============================================================================

-- Counselors: read all alerts for triage
CREATE POLICY risk_alerts_select_counselor
    ON public.risk_alerts
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Counselors: update suppression_status (app layer must restrict columns)
CREATE POLICY risk_alerts_update_counselor
    ON public.risk_alerts
    FOR UPDATE
    USING (auth.role() = 'authenticated')
    WITH CHECK (auth.role() = 'authenticated');

-- Admins: full access
CREATE POLICY risk_alerts_all_admin
    ON public.risk_alerts
    FOR ALL
    USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid())
            IN ('admin', 'super_admin')
    )
    WITH CHECK (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid())
            IN ('admin', 'super_admin')
    );

-- =============================================================================
-- 8c. RLS: risk_reveal_logs
--     - Counselors can INSERT their own reveal entries
--     - Counselors can SELECT their own entries only
--     - Admins can SELECT all
--     - No UPDATE, No DELETE (immutable audit)
-- =============================================================================

-- Counselors: insert own reveal logs
CREATE POLICY risk_reveal_logs_insert_own
    ON public.risk_reveal_logs
    FOR INSERT
    WITH CHECK (counselor_id = auth.uid());

-- Counselors: read own reveal logs
CREATE POLICY risk_reveal_logs_select_own
    ON public.risk_reveal_logs
    FOR SELECT
    USING (counselor_id = auth.uid());

-- Admins: read all reveal logs
CREATE POLICY risk_reveal_logs_select_admin
    ON public.risk_reveal_logs
    FOR SELECT
    USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid())
            IN ('admin', 'super_admin')
    );

-- =============================================================================
-- 8d. RLS: follow_up_tasks
--     - Counselors can SELECT / INSERT / UPDATE their own tasks
--     - Admins can SELECT all + UPDATE all
-- =============================================================================

-- Counselors: read own tasks
CREATE POLICY follow_up_tasks_select_own
    ON public.follow_up_tasks
    FOR SELECT
    USING (counselor_id = auth.uid());

-- Counselors: insert tasks they create
CREATE POLICY follow_up_tasks_insert_own
    ON public.follow_up_tasks
    FOR INSERT
    WITH CHECK (counselor_id = auth.uid());

-- Counselors: update status on own tasks
CREATE POLICY follow_up_tasks_update_own
    ON public.follow_up_tasks
    FOR UPDATE
    USING (counselor_id = auth.uid())
    WITH CHECK (counselor_id = auth.uid());

-- Admins: full read + update
CREATE POLICY follow_up_tasks_all_admin
    ON public.follow_up_tasks
    FOR ALL
    USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid())
            IN ('admin', 'super_admin')
    )
    WITH CHECK (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid())
            IN ('admin', 'super_admin')
    );

-- =============================================================================
-- 8e. RLS: student_risk_scores
--     - INSERT via service_role only (background scoring job)
--     - Counselors can SELECT all (need full picture for triage)
--     - Admins can SELECT all
-- =============================================================================

-- Counselors: read all risk scores
CREATE POLICY risk_scores_select_counselor
    ON public.student_risk_scores
    FOR SELECT
    USING (auth.role() = 'authenticated');

-- Admins: read all risk scores
CREATE POLICY risk_scores_select_admin
    ON public.student_risk_scores
    FOR SELECT
    USING (
        (SELECT role FROM public.user_profiles WHERE id = auth.uid())
            IN ('admin', 'super_admin')
    );

-- Service role INSERT is implicitly allowed because service_role bypasses RLS.
-- No explicit INSERT policy is created for authenticated users,
-- ensuring only the service role (background jobs) can write rows.
