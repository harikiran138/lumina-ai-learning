-- 009_peer_tutor_rls.sql
-- Peer Tutor System - Row-Level Security Policies
-- Description: FERPA/GDPR-compliant RLS policies for peer tutoring tables

-- Enable RLS on all peer tutor tables
ALTER TABLE peer_tutor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_session_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE peer_coaching_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE misconception_bank ENABLE ROW LEVEL SECURITY;
ALTER TABLE tutor_eligibility_cache ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 1. PEER_TUTOR_SESSIONS Policies
-- ============================================================================

-- Tutors can view their own sessions
CREATE POLICY "Tutors can view own sessions" ON peer_tutor_sessions
    FOR SELECT USING (auth.uid() = tutor_id);

-- Tutees can view sessions where they are the tutee
CREATE POLICY "Tutees can view own sessions" ON peer_tutor_sessions
    FOR SELECT USING (auth.uid() = tutee_id);

-- Teachers can view sessions of their enrolled students
CREATE POLICY "Teachers can view enrolled student sessions" ON peer_tutor_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
              AND users.role IN ('teacher', 'admin')
        )
        AND (
            EXISTS (
                SELECT 1 FROM enrollments
                JOIN courses ON enrollments.course_id = courses.id
                WHERE courses.teacher_id = auth.uid()
                  AND (enrollments.student_id = peer_tutor_sessions.tutor_id 
                       OR enrollments.student_id = peer_tutor_sessions.tutee_id)
            )
        )
    );

-- Admins can view all sessions
CREATE POLICY "Admins can view all sessions" ON peer_tutor_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
              AND users.role = 'admin'
        )
    );

-- Users can create sessions where they are tutor
CREATE POLICY "Users can create sessions as tutor" ON peer_tutor_sessions
    FOR INSERT WITH CHECK (auth.uid() = tutor_id);

-- Participants can update their own sessions
CREATE POLICY "Participants can update sessions" ON peer_tutor_sessions
    FOR UPDATE USING (
        auth.uid() = tutor_id OR auth.uid() = tutee_id
    );

-- ============================================================================
-- 2. PEER_SESSION_MESSAGES Policies
-- ============================================================================

-- Users can view messages only in their sessions
CREATE POLICY "Users can view session messages" ON peer_session_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM peer_tutor_sessions
            WHERE peer_tutor_sessions.id = peer_session_messages.session_id
              AND (peer_tutor_sessions.tutor_id = auth.uid() 
                   OR peer_tutor_sessions.tutee_id = auth.uid())
        )
    );

-- Teachers can view messages of enrolled students' sessions
CREATE POLICY "Teachers can view enrolled student messages" ON peer_session_messages
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
              AND users.role IN ('teacher', 'admin')
        )
        AND EXISTS (
            SELECT 1 FROM peer_tutor_sessions pts
            JOIN enrollments e1 ON e1.student_id = pts.tutor_id
            JOIN enrollments e2 ON e2.student_id = pts.tutee_id
            JOIN courses c1 ON e1.course_id = c1.id
            JOIN courses c2 ON e2.course_id = c2.id
            WHERE pts.id = peer_session_messages.session_id
              AND (c1.teacher_id = auth.uid() OR c2.teacher_id = auth.uid())
        )
    );

-- Users can insert messages in their sessions
CREATE POLICY "Users can send messages in sessions" ON peer_session_messages
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM peer_tutor_sessions
            WHERE peer_tutor_sessions.id = peer_session_messages.session_id
              AND (peer_tutor_sessions.tutor_id = auth.uid() 
                   OR peer_tutor_sessions.tutee_id = auth.uid())
              AND peer_tutor_sessions.status = 'active'
        )
        AND auth.uid() = sender_id
    );

-- ============================================================================
-- 3. PEER_COACHING_LOGS Policies (CRITICAL: Tutor-only visibility)
-- ============================================================================

-- Only tutors can see coaching logs for their sessions
-- SECURITY: Tutees must NEVER see these logs
CREATE POLICY "Only tutors can view coaching logs" ON peer_coaching_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM peer_tutor_sessions
            WHERE peer_tutor_sessions.id = peer_coaching_logs.session_id
              AND peer_tutor_sessions.tutor_id = auth.uid()
        )
    );

-- Teachers and admins can view coaching logs for enrolled students
CREATE POLICY "Teachers can view coaching logs" ON peer_coaching_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
              AND users.role IN ('teacher', 'admin')
        )
        AND EXISTS (
            SELECT 1 FROM peer_tutor_sessions pts
            JOIN enrollments e ON e.student_id = pts.tutor_id
            JOIN courses c ON e.course_id = c.id
            WHERE pts.id = peer_coaching_logs.session_id
              AND c.teacher_id = auth.uid()
        )
    );

-- System can insert coaching logs (service role)
CREATE POLICY "System can insert coaching logs" ON peer_coaching_logs
    FOR INSERT WITH CHECK (true);

-- Tutors can update tutor_saw flag
CREATE POLICY "Tutors can mark coaching logs as seen" ON peer_coaching_logs
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM peer_tutor_sessions
            WHERE peer_tutor_sessions.id = peer_coaching_logs.session_id
              AND peer_tutor_sessions.tutor_id = auth.uid()
        )
    );

-- ============================================================================
-- 4. MISCONCEPTION_BANK Policies
-- ============================================================================

-- Teachers and admins can read misconception bank
CREATE POLICY "Teachers can read misconception bank" ON misconception_bank
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
              AND users.role IN ('teacher', 'admin')
        )
    );

-- System can write to misconception bank (anonymized only)
CREATE POLICY "System can write misconceptions" ON misconception_bank
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update misconceptions" ON misconception_bank
    FOR UPDATE USING (true);

-- ============================================================================
-- 5. TUTOR_ELIGIBILITY_CACHE Policies
-- ============================================================================

-- Users can read their own eligibility
CREATE POLICY "Users can read own eligibility" ON tutor_eligibility_cache
    FOR SELECT USING (auth.uid() = tutor_id);

-- Teachers can read eligibility of enrolled students
CREATE POLICY "Teachers can read student eligibility" ON tutor_eligibility_cache
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
              AND users.role IN ('teacher', 'admin')
        )
        AND EXISTS (
            SELECT 1 FROM enrollments
            JOIN courses ON enrollments.course_id = courses.id
            WHERE courses.teacher_id = auth.uid()
              AND enrollments.student_id = tutor_eligibility_cache.tutor_id
        )
    );

-- System can write eligibility cache
CREATE POLICY "System can write eligibility cache" ON tutor_eligibility_cache
    FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update eligibility cache" ON tutor_eligibility_cache
    FOR UPDATE USING (true);

CREATE POLICY "System can delete eligibility cache" ON tutor_eligibility_cache
    FOR DELETE USING (true);

-- Comments for documentation
COMMENT ON POLICY "Only tutors can view coaching logs" ON peer_coaching_logs IS 'CRITICAL: Prevents tutees from seeing AI coaching messages';
COMMENT ON POLICY "System can write misconceptions" ON misconception_bank IS 'Allows backend service to insert anonymized misconceptions';
COMMENT ON POLICY "Users can read own eligibility" ON tutor_eligibility_cache IS 'Users can check their own eligibility status';
