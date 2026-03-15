-- Lumina AI LMS - Missing Tables (Migration 004)
-- Version: 1.0.0
-- Description: Captures all Lumina tables that existed in Supabase but were
--              missing from local migration files. These include engagement tracking,
--              community features, assessment support, and session management tables.

-- 1. Behavior Logs (user interaction tracking)
CREATE TABLE IF NOT EXISTS behavior_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    event_type TEXT NOT NULL,
    event_data JSONB,
    session_duration_seconds INT,
    resource_id TEXT,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE behavior_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can insert own behavior logs" ON behavior_logs
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Students can view own behavior logs" ON behavior_logs
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Teachers can view behavior logs for their courses" ON behavior_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = behavior_logs.course_id AND courses.teacher_id = auth.uid()
        )
    );

-- 2. Agent Memory (AI tutor persistent memory per user)
CREATE TABLE IF NOT EXISTS agent_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    agent_type TEXT DEFAULT 'tutor',
    memory_key TEXT NOT NULL,
    memory_value JSONB NOT NULL,
    confidence NUMERIC DEFAULT 0.5,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own agent memory" ON agent_memory
    USING (auth.uid() = user_id);

-- 3. Study Groups
CREATE TABLE IF NOT EXISTS study_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    creator_id UUID REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    max_members INT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Study Group Members
CREATE TABLE IF NOT EXISTS study_group_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    study_group_id UUID REFERENCES study_groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role TEXT DEFAULT 'member',
    joined_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tutor Sessions (Formal AI tutor session records)
CREATE TABLE IF NOT EXISTS tutor_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
    topic TEXT,
    duration_seconds INT,
    message_count INT DEFAULT 0,
    student_satisfaction INT,
    ai_confidence NUMERIC,
    is_completed BOOLEAN DEFAULT FALSE,
    ended_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE tutor_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own tutor sessions" ON tutor_sessions
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own tutor sessions" ON tutor_sessions
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tutor sessions" ON tutor_sessions
    FOR UPDATE USING (auth.uid() = user_id);

-- 6. Analytics Events (raw event stream)
CREATE TABLE IF NOT EXISTS analytics_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID,
    course_id UUID,
    event_type TEXT NOT NULL,
    event_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. PPT Generations
CREATE TABLE IF NOT EXISTS ppt_generations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID,
    created_by_id UUID REFERENCES users(id) ON DELETE CASCADE,
    topic TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_url TEXT,
    slides_count INT,
    generation_time_seconds INT,
    is_public BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Feedback
CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID,
    related_type TEXT,
    related_id UUID,
    rating INT CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Leaderboard Entries
CREATE TABLE IF NOT EXISTS leaderboard_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    score NUMERIC DEFAULT 0,
    rank INT,
    period TEXT DEFAULT 'weekly',
    period_start DATE DEFAULT CURRENT_DATE,
    period_end DATE DEFAULT (CURRENT_DATE + INTERVAL '7 days'),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Teacher Stats (aggregated per teacher/course)
CREATE TABLE IF NOT EXISTS teacher_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    total_students INT DEFAULT 0,
    avg_mastery NUMERIC DEFAULT 0.0,
    avg_engagement NUMERIC DEFAULT 0.0,
    at_risk_count INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Student Stats (aggregated per student/course)
CREATE TABLE IF NOT EXISTS student_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    total_points INT DEFAULT 0,
    avg_score NUMERIC DEFAULT 0.0,
    completion_percentage NUMERIC DEFAULT 0.0,
    streak INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 12. Attendance
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    session_date DATE NOT NULL,
    status TEXT DEFAULT 'present',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 13. Intervention Logs
CREATE TABLE IF NOT EXISTS intervention_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    intervener_user_id UUID,
    course_id UUID,
    intervention_type TEXT DEFAULT 'low_mastery',
    description TEXT,
    action_taken TEXT,
    was_effective BOOLEAN,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE intervention_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage intervention logs" ON intervention_logs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('teacher', 'admin'))
    );
CREATE POLICY "Students can view own intervention logs" ON intervention_logs
    FOR SELECT USING (auth.uid() = student_user_id);

-- 14. Parent/Guardian relationships
CREATE TABLE IF NOT EXISTS parent_guardian (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    student_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    relationship TEXT,
    can_view_grades BOOLEAN DEFAULT TRUE,
    can_view_progress BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 15. Community Channels
CREATE TABLE IF NOT EXISTS community_channels (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 16. Community Messages
CREATE TABLE IF NOT EXISTS community_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id TEXT DEFAULT 'general',
    student_id TEXT,
    student_name TEXT,
    avatar TEXT,
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 17. Remediation Plans
CREATE TABLE IF NOT EXISTS remediation_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    triggered_by_score NUMERIC NOT NULL,
    course_id UUID,
    weak_concepts TEXT[] DEFAULT '{}',
    recommended_concepts TEXT[] DEFAULT '{}',
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'dismissed')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);
ALTER TABLE remediation_plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own remediation plans" ON remediation_plans
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Teachers can manage remediation plans" ON remediation_plans
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('teacher', 'admin'))
    );

-- 18. Inactivity Alerts
CREATE TABLE IF NOT EXISTS inactivity_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    last_activity_at TIMESTAMPTZ,
    hours_inactive NUMERIC NOT NULL,
    risk_level TEXT DEFAULT 'low',
    nudge_message TEXT,
    delivered BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE inactivity_alerts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own inactivity alerts" ON inactivity_alerts
    FOR SELECT USING (auth.uid() = user_id);

-- 19. Assignments (formal teacher-created assignments)
CREATE TABLE IF NOT EXISTS assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    description TEXT,
    due_date TIMESTAMPTZ,
    created_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view assignments for enrolled courses" ON assignments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM enrollments
            WHERE enrollments.course_id = assignments.course_id
              AND enrollments.student_id = auth.uid()
        )
    );
CREATE POLICY "Teachers can manage own assignments" ON assignments
    USING (auth.uid() = created_by);

-- 20. Sessions (user auth sessions tracking)
CREATE TABLE IF NOT EXISTS sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    device_type TEXT DEFAULT 'web',
    ip_address TEXT,
    user_agent TEXT,
    expires_at TIMESTAMPTZ NOT NULL,
    is_revoked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own sessions" ON sessions
    FOR SELECT USING (auth.uid() = user_id);

-- 21. Certificates
CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "courseId" TEXT,
    "courseName" TEXT,
    "issueDate" TIMESTAMPTZ DEFAULT NOW(),
    grade TEXT
);

-- 22. Question Bank
CREATE TABLE IF NOT EXISTS question_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT DEFAULT 'mcq',
    difficulty TEXT DEFAULT 'beginner',
    answer_options JSONB,
    correct_answer JSONB NOT NULL,
    explanation TEXT,
    point_value INT DEFAULT 1,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE question_bank ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers can manage question bank" ON question_bank
    USING (
        EXISTS (
            SELECT 1 FROM courses
            WHERE courses.id = question_bank.course_id
              AND courses.teacher_id = auth.uid()
        )
    );
CREATE POLICY "Students can view questions" ON question_bank
    FOR SELECT USING (TRUE);

-- 23. Submissions (simple file-based submissions)
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id TEXT NOT NULL,
    student_id TEXT NOT NULL,
    file_path TEXT,
    status TEXT DEFAULT 'pending',
    score FLOAT,
    feedback TEXT,
    ocr_text TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students can view own submissions" ON submissions
    FOR SELECT USING (auth.uid()::text = student_id);
CREATE POLICY "Students can insert own submissions" ON submissions
    FOR INSERT WITH CHECK (auth.uid()::text = student_id);

-- 24. Progress (legacy progress tracking)
CREATE TABLE IF NOT EXISTS progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "userId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    progress INT DEFAULT 0,
    mastery FLOAT DEFAULT 0,
    streak INT DEFAULT 0,
    "completedLessons" JSONB DEFAULT '[]',
    "lastAccessed" TIMESTAMPTZ,
    "hoursSpent" FLOAT DEFAULT 0,
    "enrolledAt" TIMESTAMPTZ DEFAULT NOW()
);

-- 25. JWT Blocklist (token invalidation/logout)
CREATE TABLE IF NOT EXISTS jwt_blocklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    token TEXT UNIQUE NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
ALTER TABLE jwt_blocklist ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Only admins can view blocklist" ON jwt_blocklist
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role = 'admin')
    );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_behavior_logs_user ON behavior_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_agent_memory_user ON agent_memory(user_id);
CREATE INDEX IF NOT EXISTS idx_tutor_sessions_user ON tutor_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user ON analytics_events(user_id);
CREATE INDEX IF NOT EXISTS idx_leaderboard_course ON leaderboard_entries(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_user ON attendance(user_id);
CREATE INDEX IF NOT EXISTS idx_remediation_user ON remediation_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_inactivity_user ON inactivity_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_course ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_jwt_blocklist_token ON jwt_blocklist(token);
CREATE INDEX IF NOT EXISTS idx_jwt_blocklist_expires ON jwt_blocklist(expires_at);
