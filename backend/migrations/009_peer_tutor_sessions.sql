-- 009_peer_tutor_sessions.sql
-- Peer Tutor System - Session Tables
-- Description: Core tables for peer tutoring sessions, messages, and coaching logs

-- 1. Peer Tutor Sessions Table
CREATE TABLE IF NOT EXISTS peer_tutor_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tutor_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tutee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    concept_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'escalated')),
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    quality_score NUMERIC CHECK (quality_score >= 0 AND quality_score <= 1),
    tutee_feedback_score INTEGER CHECK (tutee_feedback_score >= 1 AND tutee_feedback_score <= 5),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT different_users CHECK (tutor_id != tutee_id),
    CONSTRAINT valid_end_time CHECK (ended_at IS NULL OR ended_at >= started_at)
);

-- 2. Peer Session Messages Table
CREATE TABLE IF NOT EXISTS peer_session_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES peer_tutor_sessions(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    message_text TEXT NOT NULL,
    message_type TEXT NOT NULL CHECK (message_type IN ('question', 'explanation', 'hint', 'answer')),
    semantic_similarity_score NUMERIC CHECK (semantic_similarity_score >= 0 AND semantic_similarity_score <= 1),
    flagged_direct_answer BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Peer Coaching Logs Table (tutor-only, private AI coaching)
CREATE TABLE IF NOT EXISTS peer_coaching_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES peer_tutor_sessions(id) ON DELETE CASCADE,
    coach_message TEXT NOT NULL,
    trigger_reason TEXT NOT NULL CHECK (trigger_reason IN ('direct_answer_detected', 'session_start', 'scaffolding_tip', 'tutee_struggling', 'manual_request')),
    tutor_saw BOOLEAN DEFAULT FALSE,
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for Performance
-- Sessions: Lookup by tutor and status for "my active sessions"
CREATE INDEX IF NOT EXISTS idx_peer_tutor_sessions_tutor_status 
    ON peer_tutor_sessions(tutor_id, status);

-- Sessions: Lookup by tutee and concept for "help I've received on this topic"
CREATE INDEX IF NOT EXISTS idx_peer_tutor_sessions_tutee_concept 
    ON peer_tutor_sessions(tutee_id, concept_id);

-- Sessions: Lookup by status for global session management
CREATE INDEX IF NOT EXISTS idx_peer_tutor_sessions_status 
    ON peer_tutor_sessions(status) WHERE status = 'active';

-- Messages: Chronological retrieval for session timeline
CREATE INDEX IF NOT EXISTS idx_peer_session_messages_session_timestamp 
    ON peer_session_messages(session_id, timestamp);

-- Messages: Flagged direct answers for analytics
CREATE INDEX IF NOT EXISTS idx_peer_session_messages_flagged 
    ON peer_session_messages(session_id, flagged_direct_answer) 
    WHERE flagged_direct_answer = TRUE;

-- Coaching Logs: Retrieval by session chronologically
CREATE INDEX IF NOT EXISTS idx_peer_coaching_logs_session_timestamp 
    ON peer_coaching_logs(session_id, timestamp);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_peer_tutor_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER peer_tutor_sessions_updated_at_trigger
    BEFORE UPDATE ON peer_tutor_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_peer_tutor_sessions_updated_at();

-- Comments for documentation
COMMENT ON TABLE peer_tutor_sessions IS 'Peer tutoring session metadata with quality tracking';
COMMENT ON TABLE peer_session_messages IS 'Message exchange between tutor and tutee with semantic analysis';
COMMENT ON TABLE peer_coaching_logs IS 'Private AI coaching messages visible only to tutors';
COMMENT ON COLUMN peer_session_messages.semantic_similarity_score IS 'Cosine similarity to model answer (0-1), used for direct answer detection';
COMMENT ON COLUMN peer_coaching_logs.trigger_reason IS 'Why the coaching message was generated';
