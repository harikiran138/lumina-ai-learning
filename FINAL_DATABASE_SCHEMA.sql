-- LUMINA FINAL DATABASE SCHEMA --

-- 001_init_schema.sql --
-- Lumina AI LMS - Core Database Schema
-- Version: 1.2.0
-- Description: Clean slate for Lumina tables to ensure type safety and standardization.

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop Lumina-related tables if they exist (CASCADE handles dependencies)
DROP TABLE IF EXISTS automation_job_logs CASCADE;
DROP TABLE IF EXISTS intervention_recommendations CASCADE;
DROP TABLE IF EXISTS submission_scorecards CASCADE;
DROP TABLE IF EXISTS assignment_submissions CASCADE;
DROP TABLE IF EXISTS assignment_rubrics CASCADE;
DROP TABLE IF EXISTS assessment_sessions CASCADE;
DROP TABLE IF EXISTS learning_events CASCADE;
DROP TABLE IF EXISTS learner_profiles CASCADE;
DROP TABLE IF EXISTS enrollments CASCADE;
DROP TABLE IF EXISTS knowledge_nodes CASCADE;
DROP TABLE IF EXISTS courses CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- 1. Users Table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'student',
    password_hash TEXT NOT NULL,
    phone TEXT DEFAULT 'N/A',
    avatar TEXT,
    status TEXT DEFAULT 'active',
    is_active BOOLEAN DEFAULT TRUE,
    onboarding_completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Courses Table
CREATE TABLE courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    course_name TEXT,
    code TEXT UNIQUE NOT NULL,
    course_code TEXT UNIQUE,
    description TEXT,
    subject TEXT,
    grade_level TEXT,
    modules JSONB DEFAULT '[]',
    is_published BOOLEAN DEFAULT FALSE,
    thumbnail_url TEXT,
    estimated_duration TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enrollments Table
CREATE TABLE enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    progress JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active',
    UNIQUE(student_id, course_id)
);

-- 4. Learner Profiles Table
CREATE TABLE learner_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    role TEXT,
    grade_level TEXT,
    goals JSONB DEFAULT '[]',
    preferences JSONB DEFAULT '{}',
    mastery_state JSONB DEFAULT '{}',
    weak_topics JSONB DEFAULT '[]',
    misconception_clusters JSONB DEFAULT '[]',
    behavior_signals JSONB DEFAULT '{}',
    engagement_summary JSONB DEFAULT '{}',
    performance_summary JSONB DEFAULT '{}',
    risk_summary JSONB DEFAULT '{}',
    tutor_summary JSONB DEFAULT '{}',
    assignment_summary JSONB DEFAULT '{}',
    assessment_summary JSONB DEFAULT '{}',
    learning_style TEXT,
    strengths JSONB DEFAULT '[]',
    weaknesses JSONB DEFAULT '[]',
    status TEXT DEFAULT 'active',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Learning Events Table
CREATE TABLE learning_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL,
    source TEXT,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    topic_id TEXT,
    session_id TEXT,
    payload JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Assessment Sessions Table
CREATE TABLE assessment_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    topic_id TEXT,
    status TEXT DEFAULT 'started',
    questions JSONB DEFAULT '[]',
    answers JSONB DEFAULT '{}',
    mastery_before JSONB DEFAULT '{}',
    mastery_after JSONB DEFAULT '{}',
    report JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 7. Assignment Rubrics
CREATE TABLE assignment_rubrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_slug TEXT UNIQUE,
    title TEXT NOT NULL,
    criteria JSONB DEFAULT '[]',
    version INT DEFAULT 1,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Assignment Submissions
CREATE TABLE assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    assignment_id TEXT,
    file_path TEXT,
    extracted_text TEXT,
    grade FLOAT,
    feedback TEXT,
    rubric_id UUID REFERENCES assignment_rubrics(id) ON DELETE SET NULL,
    graded_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. Submission Scorecards
CREATE TABLE submission_scorecards (
    submission_id UUID PRIMARY KEY REFERENCES assignment_submissions(id) ON DELETE CASCADE,
    overall_score FLOAT,
    confidence FLOAT,
    review_required BOOLEAN DEFAULT FALSE,
    rubric_scores JSONB DEFAULT '[]',
    rationale TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Intervention Recommendations
CREATE TABLE intervention_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    topic_id TEXT,
    priority TEXT DEFAULT 'medium',
    status TEXT DEFAULT 'pending',
    recommended_action TEXT,
    reason TEXT,
    confidence FLOAT,
    evidence JSONB DEFAULT '{}',
    created_by TEXT DEFAULT 'AI',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Automation Job Logs
CREATE TABLE automation_job_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    job_name TEXT NOT NULL,
    triggered_by TEXT,
    status TEXT,
    input JSONB DEFAULT '{}',
    output JSONB DEFAULT '{}',
    error TEXT,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- 12. Knowledge Nodes
CREATE TABLE knowledge_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES knowledge_nodes(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX idx_courses_code ON courses(code);
CREATE INDEX idx_learning_events_user_id ON learning_events(user_id);
CREATE INDEX idx_learning_events_type ON learning_events(event_type);
CREATE INDEX idx_learner_profiles_user_id ON learner_profiles(user_id);
CREATE INDEX idx_intervention_recommendations_user_id ON intervention_recommendations(user_id);
CREATE INDEX idx_assessment_sessions_user_id ON assessment_sessions(user_id);


-- 002_rls_policies.sql --
-- Lumina AI LMS - RLS Policies
-- Version: 1.1.0
-- Description: Comprehensive Row-Level Security policies for core tables complying with FERPA/GDPR.

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE learner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;

-- 1. Users Policies
CREATE POLICY "Users can read their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 2. Courses Policies
CREATE POLICY "Anyone can view published courses" ON courses
    FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Teachers can view all courses" ON courses
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('teacher', 'admin'))
    );

CREATE POLICY "Teachers can manage own courses" ON courses
    USING (auth.uid() = teacher_id);

-- 3. Enrollments Policies
CREATE POLICY "Students can view own enrollments" ON enrollments
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view enrollments for their courses" ON enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = enrollments.course_id AND courses.teacher_id = auth.uid()
        )
    );

-- 4. Learner Profiles Policies
CREATE POLICY "Students can view own profile" ON learner_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view profiles of their enrolled students" ON learner_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM enrollments
            JOIN courses ON enrollments.course_id = courses.id
            WHERE enrollments.student_id = learner_profiles.user_id 
              AND courses.teacher_id = auth.uid()
        )
    );

-- 5. Learning Events Policies
CREATE POLICY "Students can insert own events" ON learning_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can view own events" ON learning_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view events of their enrolled students" ON learning_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM enrollments
            JOIN courses ON enrollments.course_id = courses.id
            WHERE enrollments.student_id = learning_events.user_id 
              AND courses.teacher_id = auth.uid()
        )
    );

-- 6. Assessment Sessions Policies
CREATE POLICY "Students can manage own sessions" ON assessment_sessions
    USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view sessions for their courses" ON assessment_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = assessment_sessions.course_id AND courses.teacher_id = auth.uid()
        )
    );

-- 7. Assignment Policies
CREATE POLICY "Anyone can view rubrics" ON assignment_rubrics
    FOR SELECT USING (TRUE);

CREATE POLICY "Students can view own submissions" ON assignment_submissions
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own submissions" ON assignment_submissions
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers can manage submissions for their courses" ON assignment_submissions
    USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = assignment_submissions.course_id AND courses.teacher_id = auth.uid()
        )
    );

-- 8. Submission Scorecards
CREATE POLICY "Students can view scorecards for own submissions" ON submission_scorecards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assignment_submissions 
            WHERE assignment_submissions.id = submission_scorecards.submission_id 
              AND assignment_submissions.student_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can manage scorecards for their courses" ON submission_scorecards
    USING (
        EXISTS (
            SELECT 1 FROM assignment_submissions
            JOIN courses ON assignment_submissions.course_id = courses.id
            WHERE assignment_submissions.id = submission_scorecards.submission_id 
              AND courses.teacher_id = auth.uid()
        )
    );

-- 9. Intervention Recommendations
CREATE POLICY "Teachers can view and update recommendations for their courses" ON intervention_recommendations
    USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = intervention_recommendations.course_id AND courses.teacher_id = auth.uid()
        )
    );

-- 10. Automation Job Logs
CREATE POLICY "Only admins and teachers can view job logs" ON automation_job_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'teacher'))
    );

-- 11. Knowledge Nodes
CREATE POLICY "Anyone can view knowledge nodes" ON knowledge_nodes
    FOR SELECT USING (TRUE);


-- 003_advanced_features.sql --
-- Lumina AI LMS - Advanced Features Schema
-- Version: 1.0.0
-- Description: Formalizing tables for Pathways, Mastery, Quizzes, and Tutor sessions.

-- 1. Student Pathways table
CREATE TABLE IF NOT EXISTS student_pathways (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    pathway_nodes JSONB DEFAULT '[]',
    current_node_index INT DEFAULT 0,
    completion_percentage NUMERIC DEFAULT 0.0,
    is_adaptive BOOLEAN DEFAULT TRUE,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Skill Mastery table (Atomic skill tracking)
CREATE TABLE IF NOT EXISTS skill_mastery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    skill_name TEXT NOT NULL,
    mastery_score NUMERIC DEFAULT 0.0 CHECK (mastery_score >= 0 AND mastery_score <= 1),
    confidence NUMERIC DEFAULT 0.5,
    -- BKT Parameters (Bayesian Knowledge Tracing)
    bkt_p_l0 NUMERIC DEFAULT 0.1, -- Probability of initial knowledge
    bkt_p_t NUMERIC DEFAULT 0.2,  -- Probability of learning
    bkt_p_g NUMERIC DEFAULT 0.1,  -- Probability of guess
    bkt_p_s NUMERIC DEFAULT 0.1,  -- Probability of slip
    last_assessed TIMESTAMPTZ,
    assessment_count INT DEFAULT 0,
    -- SM-2 Spaced Repetition fields
    ease_factor NUMERIC DEFAULT 2.5,    -- SM-2 ease factor (min 1.3)
    repetitions INT DEFAULT 0,          -- Number of successful reviews
    interval_days INT DEFAULT 1,        -- Days until next review
    next_review_at TIMESTAMPTZ,         -- Scheduled next review date
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Quizzes Table
CREATE TABLE IF NOT EXISTS quizzes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    quiz_type TEXT DEFAULT 'formative', -- formative, summative, diagnostic
    total_questions INT DEFAULT 0,
    passing_score NUMERIC DEFAULT 0.7,
    time_limit_minutes INT,
    questions JSONB DEFAULT '[]',
    is_published BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Quiz Attempts Table
CREATE TABLE IF NOT EXISTS quiz_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    quiz_id UUID REFERENCES quizzes(id) ON DELETE CASCADE,
    assessment_session_id UUID REFERENCES assessment_sessions(id) ON DELETE SET NULL,
    score NUMERIC,
    is_passed BOOLEAN,
    answers JSONB DEFAULT '{}',
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Conversations (Tutor sessions audit)
CREATE TABLE IF NOT EXISTS conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    agent_id TEXT DEFAULT 'tutor',
    messages JSONB DEFAULT '[]',
    summary TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 6. User Data (Generic student metadata/progress)
CREATE TABLE IF NOT EXISTS user_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE UNIQUE,
    progress JSONB DEFAULT '{}',
    notes JSONB DEFAULT '[]',
    quiz_history JSONB DEFAULT '[]',
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_student_pathways_user ON student_pathways(user_id);
CREATE INDEX IF NOT EXISTS idx_skill_mastery_user ON skill_mastery(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_user_data_user ON user_data(user_id);


-- 004_advanced_rls.sql --
-- Lumina AI LMS - Advanced RLS Policies
-- Version: 1.0.3
-- Description: Row-Level Security policies with permissive INSERTs for seeding and signup.

-- 1. Cleanup Legacy Policies to avoid conflicts
DO $$ 
BEGIN 
    -- Users
    DROP POLICY IF EXISTS "Users can view own data" ON users;
    DROP POLICY IF EXISTS "Allow anon to insert users" ON users;
    
    -- Conversations
    DROP POLICY IF EXISTS conversations_own ON conversations;
    DROP POLICY IF EXISTS "Users can manage own conversations" ON conversations;
    
    -- Student Pathways
    DROP POLICY IF EXISTS student_pathways_own ON student_pathways;
    DROP POLICY IF EXISTS student_pathways_teacher_read ON student_pathways;
    DROP POLICY IF EXISTS "Users can view and manage own pathways" ON student_pathways;
    
    -- Skill Mastery
    DROP POLICY IF EXISTS skill_mastery_own ON skill_mastery;
    DROP POLICY IF EXISTS skill_mastery_teacher_read ON skill_mastery;
    DROP POLICY IF EXISTS "Users can view own mastery" ON skill_mastery;
    
    -- Quiz Attempts
    DROP POLICY IF EXISTS quiz_attempts_own ON quiz_attempts;
    DROP POLICY IF EXISTS quiz_attempts_teacher_read ON quiz_attempts;
    DROP POLICY IF EXISTS "Users can view own attempts" ON quiz_attempts;
    DROP POLICY IF EXISTS "Users can insert own attempts" ON quiz_attempts;
    
    -- User Data
    DROP POLICY IF EXISTS user_data_own ON user_data;
    DROP POLICY IF EXISTS "Users can view and edit own data" ON user_data;
    
    -- Quizzes
    DROP POLICY IF EXISTS "Anyone can view published quizzes" ON quizzes;
    DROP POLICY IF EXISTS "Teachers can manage own quizzes" ON quizzes;
END $$;

-- 2. Standardize types
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'conversations' AND column_name = 'user_id' AND data_type = 'text'
    ) THEN
        ALTER TABLE conversations ALTER COLUMN user_id TYPE UUID USING user_id::UUID;
    END IF;
END $$;

-- 3. Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_pathways ENABLE ROW LEVEL SECURITY;
ALTER TABLE skill_mastery ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;

-- 4. Apply Policies

-- Users
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Allow anon to insert users" ON users FOR INSERT WITH CHECK (true);

-- Student Pathways
CREATE POLICY "Users can view and manage own pathways" ON student_pathways
    FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL); -- Allow null for seeding

-- Skill Mastery
CREATE POLICY "Users can view own mastery" ON skill_mastery
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Quizzes
CREATE POLICY "Anyone can view published quizzes" ON quizzes
    FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Teachers can manage own quizzes" ON quizzes
    FOR ALL USING (true); -- Permissive for dev

-- Quiz Attempts
CREATE POLICY "Users can view own attempts" ON quiz_attempts
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can insert own attempts" ON quiz_attempts
    FOR INSERT WITH CHECK (true);

-- Conversations
CREATE POLICY "Users can manage own conversations" ON conversations
    FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- User Data
CREATE POLICY "Users can view and edit own data" ON user_data
    FOR ALL USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Enrollments (if not already handled)
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon enrollments" ON enrollments;
CREATE POLICY "Allow anon enrollments" ON enrollments FOR ALL USING (true);


-- 004_missing_lumina_tables.sql --
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
CREATE TABLE IF NOT EXISTS public.parent_guardian (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    student_user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    relationship TEXT,
    can_view_grades BOOLEAN DEFAULT TRUE,
    can_view_progress BOOLEAN DEFAULT TRUE,
    
    -- Verification Support (Item 1: Security)
    verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected')),
    verified_by_admin BOOLEAN DEFAULT false,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES public.users(id),
    verification_notes TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(parent_user_id, student_user_id)
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


-- 005_column_fixes.sql --
-- Lumina AI LMS - Column Discrepancy Fixes (Migration 005)
-- Version: 1.0.0
-- Description: Fixes column-level differences found between local migration files
--              and the actual Supabase schema.

-- FIX 1: quiz_attempts table
-- Local migration (003) defined: is_passed BOOLEAN, answers JSONB, completed_at
-- Supabase actual schema has:    correct_count INT, total_count INT, time_taken_seconds INT, attempted_at
-- Resolution: Drop deprecated columns, add correct ones
ALTER TABLE quiz_attempts
    ADD COLUMN IF NOT EXISTS correct_count INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_count INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS time_taken_seconds INT,
    ADD COLUMN IF NOT EXISTS attempted_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE quiz_attempts DROP COLUMN IF EXISTS is_passed;
ALTER TABLE quiz_attempts DROP COLUMN IF EXISTS answers;
ALTER TABLE quiz_attempts DROP COLUMN IF EXISTS completed_at;

-- Ensure score has a proper default
ALTER TABLE quiz_attempts ALTER COLUMN score SET DEFAULT 0;


-- 006_institution_hierarchy.sql --
-- Lumina AI LMS - Institution & Academic Hierarchy
-- Version: 1.0.0
-- Description: Adds institutions, departments, programs, classes, approvals, and AI verification queues.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) Institution Core
CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_name TEXT NOT NULL,
    email TEXT,
    onboarding_status TEXT DEFAULT 'PENDING',
    password_hash TEXT,
    refresh_token_hash TEXT,
    failed_attempts INT DEFAULT 0,
    locked_until TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS institution_details (
    institution_id UUID PRIMARY KEY REFERENCES institutions(id) ON DELETE CASCADE,
    type TEXT,
    status TEXT,
    established_year INT,
    affiliation TEXT,
    address TEXT,
    city TEXT,
    state TEXT,
    country TEXT,
    vision TEXT,
    mission TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2) Department & Program Hierarchy
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    department_name TEXT NOT NULL,
    description TEXT,
    hod_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS programs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    program_name TEXT NOT NULL,
    degree TEXT,
    level TEXT,
    intake INT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3) Semesters & Classes (Sections)
CREATE TABLE IF NOT EXISTS semesters (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    semester_number INTEGER NOT NULL,
    title TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(program_id, semester_number)
);

CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
    section_name TEXT NOT NULL,
    academic_year TEXT,
    batch_name TEXT,
    class_name TEXT,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    batch TEXT,
    section TEXT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    batch_year TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4) Academic Enrollment & Credits
CREATE TABLE IF NOT EXISTS student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    current_semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    year_of_study INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active',
    progress JSONB DEFAULT '{"completed_lessons": [], "mastery": 0, "hours_spent": 0, "streak": 0}',
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, course_id, class_id)
);

CREATE TABLE IF NOT EXISTS student_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    semester_id UUID NOT NULL REFERENCES semesters(id) ON DELETE CASCADE,
    earned_credits INT DEFAULT 0,
    total_credits INT DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, semester_id)
);

-- 5) Teacher Approvals & Class Assignments
CREATE TABLE IF NOT EXISTS teacher_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    message TEXT,
    status TEXT DEFAULT 'PENDING_HOD',
    hod_status TEXT DEFAULT 'PENDING',
    admin_status TEXT DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    hod_reviewed_at TIMESTAMPTZ,
    admin_reviewed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS teacher_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    is_primary BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(teacher_id, course_id, class_id)
);

-- 6) Course Concepts (for AI scope)
CREATE TABLE IF NOT EXISTS course_concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    concept_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7) Stakeholders (Institution connections)
CREATE TABLE IF NOT EXISTS stakeholders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    program_id UUID REFERENCES programs(id) ON DELETE SET NULL,
    institution_id UUID REFERENCES institutions(id) ON DELETE SET NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT,
    contact_no TEXT,
    organization TEXT,
    category TEXT NOT NULL,
    feedback_enabled BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8) Content Pipeline & AI Verification
CREATE TABLE IF NOT EXISTS content_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    original_filename TEXT NOT NULL,
    storage_url TEXT NOT NULL,
    file_type TEXT,
    file_size_bytes INT,
    processing_status TEXT DEFAULT 'queued',
    scaffold_json JSONB,
    scaffold_approved_at TIMESTAMPTZ,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ai_answer_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
    student_question TEXT,
    ai_generated_answer TEXT,
    teacher_edited_answer TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    verified_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS physical_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id TEXT,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    submission_images JSONB DEFAULT '[]',
    ocr_extracted_text JSONB,
    ai_assessment JSONB,
    total_ai_marks NUMERIC,
    assessment_status TEXT DEFAULT 'uploaded',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9) Schema Compatibility Enhancements
ALTER TABLE users ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS program_id UUID REFERENCES programs(id) ON DELETE SET NULL;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_code TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS course_name TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS grade_level TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '[]';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS estimated_duration TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS credits INT DEFAULT 3;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS knowledge_graph JSONB DEFAULT '{}';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;
ALTER TABLE student_enrollments ADD COLUMN IF NOT EXISTS class_id UUID REFERENCES classes(id) ON DELETE SET NULL;

-- 10) Indexes
CREATE INDEX IF NOT EXISTS idx_departments_institution ON departments(institution_id);
CREATE INDEX IF NOT EXISTS idx_programs_department ON programs(department_id);
CREATE INDEX IF NOT EXISTS idx_semesters_program ON semesters(program_id);
CREATE INDEX IF NOT EXISTS idx_classes_program ON classes(program_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_requests_department ON teacher_requests(department_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class ON teacher_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_course_concepts_course ON course_concepts(course_id);
CREATE INDEX IF NOT EXISTS idx_ai_answer_queue_teacher ON ai_answer_queue(teacher_id);


-- 007_ui_ux_sync.sql --
-- UI/UX Sync Migration: Align DB with current app requirements

-- Courses: allow optional program_id and add UI fields
ALTER TABLE courses ALTER COLUMN program_id DROP NOT NULL;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS grade_level TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS difficulty_level TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS modules JSONB DEFAULT '[]';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_published BOOLEAN DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS thumbnail_url TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS image_url TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS estimated_duration TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS credits INT DEFAULT 3;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS knowledge_graph JSONB DEFAULT '{}';
ALTER TABLE courses ADD COLUMN IF NOT EXISTS department_id UUID REFERENCES departments(id) ON DELETE SET NULL;

-- Classes: add compatibility fields for UI
ALTER TABLE classes ADD COLUMN IF NOT EXISTS class_name TEXT;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS batch TEXT;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS section TEXT;

-- Teacher requests: enforce HOD-first workflow
ALTER TABLE teacher_requests ALTER COLUMN status SET DEFAULT 'PENDING_HOD';
UPDATE teacher_requests SET status = 'PENDING_HOD' WHERE status = 'PENDING';


-- 008_ui_db_alignment.sql --
-- Align UI/UX payloads with legacy course/class fields

-- 1) Courses: keep title/code/course_name/course_code in sync
CREATE OR REPLACE FUNCTION sync_course_fields() RETURNS trigger AS $$
BEGIN
  NEW.course_name := COALESCE(NEW.course_name, NEW.title, NEW.name);
  NEW.title := COALESCE(NEW.title, NEW.course_name, NEW.name);
  NEW.course_code := COALESCE(NEW.course_code, NEW.code);
  NEW.code := COALESCE(NEW.code, NEW.course_code);
  NEW.name := COALESCE(NEW.name, NEW.course_name, NEW.title);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS courses_sync_fields ON courses;
CREATE TRIGGER courses_sync_fields
BEFORE INSERT OR UPDATE ON courses
FOR EACH ROW EXECUTE FUNCTION sync_course_fields();

-- Backfill existing rows
UPDATE courses
SET
  course_name = COALESCE(course_name, title, name),
  title = COALESCE(title, course_name, name),
  course_code = COALESCE(course_code, code),
  code = COALESCE(code, course_code),
  name = COALESCE(name, course_name, title)
WHERE
  course_name IS NULL OR title IS NULL OR course_code IS NULL OR code IS NULL OR name IS NULL;

-- 2) Classes: sync section_name/batch_name with class_name/batch/section
CREATE OR REPLACE FUNCTION sync_class_fields() RETURNS trigger AS $$
BEGIN
  NEW.section_name := COALESCE(NEW.section_name, NEW.class_name, NEW.section);
  NEW.class_name := COALESCE(NEW.class_name, NEW.section_name);
  NEW.batch_name := COALESCE(NEW.batch_name, NEW.batch, NEW.batch_year);
  NEW.batch := COALESCE(NEW.batch, NEW.batch_name);
  NEW.section := COALESCE(NEW.section, NEW.section_name);
  NEW.academic_year := COALESCE(NEW.academic_year, NEW.batch_year, NEW.batch_name);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS classes_sync_fields ON classes;
CREATE TRIGGER classes_sync_fields
BEFORE INSERT OR UPDATE ON classes
FOR EACH ROW EXECUTE FUNCTION sync_class_fields();

-- Backfill existing rows
UPDATE classes
SET
  section_name = COALESCE(section_name, class_name, section),
  class_name = COALESCE(class_name, section_name),
  batch_name = COALESCE(batch_name, batch, batch_year),
  batch = COALESCE(batch, batch_name),
  section = COALESCE(section, section_name),
  academic_year = COALESCE(academic_year, batch_year, batch_name)
WHERE
  section_name IS NULL OR class_name IS NULL OR batch_name IS NULL OR batch IS NULL OR section IS NULL OR academic_year IS NULL;


-- 008_unit_pdf_pipeline.sql --
-- Unit PDF -> Smart Content Pipeline

CREATE TABLE IF NOT EXISTS units (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    original_filename TEXT NOT NULL,
    source_file_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'parsing',
    parse_error TEXT,
    ppt_file_url TEXT,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS unit_modules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    sort_order INT NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS unit_topics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    module_id UUID NOT NULL REFERENCES unit_modules(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content_text TEXT,
    summary_bullets JSONB NOT NULL DEFAULT '[]',
    quiz_questions JSONB NOT NULL DEFAULT '[]',
    source_tables JSONB NOT NULL DEFAULT '[]',
    source_images JSONB NOT NULL DEFAULT '[]',
    detected_signals JSONB NOT NULL DEFAULT '[]',
    generation_status TEXT NOT NULL DEFAULT 'pending',
    generation_error TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS topic_assets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    topic_id UUID NOT NULL REFERENCES unit_topics(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
    title TEXT NOT NULL,
    file_url TEXT,
    is_generated BOOLEAN NOT NULL DEFAULT FALSE,
    generation_status TEXT NOT NULL DEFAULT 'ready',
    error_message TEXT,
    content_json JSONB NOT NULL DEFAULT '{}',
    metadata JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS unit_processing_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    unit_id UUID NOT NULL REFERENCES units(id) ON DELETE CASCADE,
    topic_id UUID REFERENCES unit_topics(id) ON DELETE CASCADE,
    job_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'queued',
    attempts INT NOT NULL DEFAULT 0,
    error_message TEXT,
    payload JSONB NOT NULL DEFAULT '{}',
    started_at TIMESTAMPTZ,
    finished_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_units_teacher_id ON units(teacher_id);
CREATE INDEX IF NOT EXISTS idx_units_status ON units(status);
CREATE INDEX IF NOT EXISTS idx_unit_modules_unit_id ON unit_modules(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_topics_unit_id ON unit_topics(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_topics_module_id ON unit_topics(module_id);
CREATE INDEX IF NOT EXISTS idx_unit_topics_generation_status ON unit_topics(generation_status);
CREATE INDEX IF NOT EXISTS idx_topic_assets_topic_id ON topic_assets(topic_id);
CREATE INDEX IF NOT EXISTS idx_topic_assets_unit_id ON topic_assets(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_processing_jobs_unit_id ON unit_processing_jobs(unit_id);
CREATE INDEX IF NOT EXISTS idx_unit_processing_jobs_topic_id ON unit_processing_jobs(topic_id);
CREATE INDEX IF NOT EXISTS idx_unit_processing_jobs_status ON unit_processing_jobs(status);


-- 009_admin_limits.sql --
-- Admin hierarchy limits + codes

ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS code TEXT;
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS teacher_limit INTEGER;
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS class_limit INTEGER;
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS course_limit INTEGER;
ALTER TABLE public.departments ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS student_limit INTEGER;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS teacher_limit INTEGER;
ALTER TABLE public.classes ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS teacher_limit INTEGER;


-- 010_compat_spec.sql --
-- Compatibility migration for Lumina Engineering College Architecture

-- 1) Colleges (institutions)
ALTER TABLE public.institutions
  ADD COLUMN IF NOT EXISTS code text,
  ADD COLUMN IF NOT EXISTS logo_url text,
  ADD COLUMN IF NOT EXISTS academic_year text,
  ADD COLUMN IF NOT EXISTS login_policy text DEFAULT 'email_only',
  ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;

-- 2) Departments
ALTER TABLE public.departments
  ADD COLUMN IF NOT EXISTS abbreviation text,
  ADD COLUMN IF NOT EXISTS intake_strength integer,
  ADD COLUMN IF NOT EXISTS established_year integer;

-- 3) Batches
CREATE TABLE IF NOT EXISTS public.batches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  college_id uuid REFERENCES public.institutions(id),
  dept_id uuid REFERENCES public.departments(id),
  year integer NOT NULL,
  label text NOT NULL,
  sections text[] DEFAULT '{}'::text[],
  current_semester integer DEFAULT 1,
  is_lateral boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- 4) Classes -> link to batch
ALTER TABLE public.classes
  ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.batches(id);

-- 5) Subjects (courses)
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS semester integer,
  ADD COLUMN IF NOT EXISTS type text,
  ADD COLUMN IF NOT EXISTS college_id uuid REFERENCES public.institutions(id);

-- 6) Subject assignments (teacher_assignments)
ALTER TABLE public.teacher_assignments
  ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.batches(id),
  ADD COLUMN IF NOT EXISTS section text,
  ADD COLUMN IF NOT EXISTS academic_year text,
  ADD COLUMN IF NOT EXISTS is_co_teacher boolean DEFAULT false;

-- 7) Users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS college_id uuid REFERENCES public.institutions(id),
  ADD COLUMN IF NOT EXISTS dept_id uuid REFERENCES public.departments(id),
  ADD COLUMN IF NOT EXISTS batch_id uuid REFERENCES public.batches(id),
  ADD COLUMN IF NOT EXISTS section text,
  ADD COLUMN IF NOT EXISTS student_roll text,
  ADD COLUMN IF NOT EXISTS employee_id text,
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS profile_photo_url text,
  ADD COLUMN IF NOT EXISTS onboarding_step integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_login_at timestamptz;

-- 8) Invite tokens + enrollment codes
CREATE TABLE IF NOT EXISTS public.invite_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id),
  token text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.enrollment_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id uuid REFERENCES public.batches(id),
  code text NOT NULL,
  expires_at timestamptz NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 9) Backfills (safe)
UPDATE public.users
SET full_name = COALESCE(full_name, name)
WHERE full_name IS NULL AND name IS NOT NULL;

UPDATE public.users
SET dept_id = COALESCE(dept_id, department_id)
WHERE dept_id IS NULL AND department_id IS NOT NULL;

UPDATE public.users u
SET college_id = d.institution_id
FROM public.departments d
WHERE u.college_id IS NULL
  AND d.id = u.department_id;

UPDATE public.courses c
SET college_id = d.institution_id
FROM public.departments d
WHERE c.college_id IS NULL
  AND c.department_id = d.id;


-- 011_user_password_flags.sql --
-- Add must_change_password flag for first-login enforcement
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS must_change_password boolean DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_users_must_change_password ON public.users(must_change_password);


-- 012_enrollment_code_fields.sql --
ALTER TABLE public.enrollment_codes
ADD COLUMN IF NOT EXISTS section text,
ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.users(id);

CREATE INDEX IF NOT EXISTS idx_enrollment_codes_batch_id ON public.enrollment_codes(batch_id);
CREATE INDEX IF NOT EXISTS idx_enrollment_codes_code ON public.enrollment_codes(code);


-- 013_academic_core_tables.sql --
-- Academic core tables for Lumina spec alignment

-- Assignments
CREATE TABLE IF NOT EXISTS public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid REFERENCES public.courses(id),
  teacher_id uuid REFERENCES public.users(id),
  batch_id uuid REFERENCES public.batches(id),
  section text,
  title text NOT NULL,
  description text,
  due_date timestamptz,
  max_marks integer DEFAULT 100,
  created_at timestamptz DEFAULT now()
);

-- Extend submissions for FK-based integrity (keep legacy columns)
ALTER TABLE public.submissions
ADD COLUMN IF NOT EXISTS assignment_uuid uuid REFERENCES public.assignments(id),
ADD COLUMN IF NOT EXISTS student_uuid uuid REFERENCES public.users(id),
ADD COLUMN IF NOT EXISTS content_url text,
ADD COLUMN IF NOT EXISTS text_content text,
ADD COLUMN IF NOT EXISTS marks integer,
ADD COLUMN IF NOT EXISTS graded_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON public.assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_teacher_id ON public.assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_submissions_assignment_uuid ON public.submissions(assignment_uuid);
CREATE INDEX IF NOT EXISTS idx_submissions_student_uuid ON public.submissions(student_uuid);

-- Attendance
CREATE TABLE IF NOT EXISTS public.attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id),
  teacher_id uuid NOT NULL REFERENCES public.users(id),
  student_id uuid NOT NULL REFERENCES public.users(id),
  batch_id uuid NOT NULL REFERENCES public.batches(id),
  section text NOT NULL,
  class_date date NOT NULL,
  is_present boolean NOT NULL DEFAULT false,
  created_at timestamptz DEFAULT now(),
  UNIQUE(course_id, student_id, class_date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_course_id ON public.attendance(course_id);
CREATE INDEX IF NOT EXISTS idx_attendance_student_id ON public.attendance(student_id);

-- Course materials
CREATE TABLE IF NOT EXISTS public.course_materials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.courses(id),
  teacher_id uuid NOT NULL REFERENCES public.users(id),
  title text NOT NULL,
  type text NOT NULL DEFAULT 'notes' CHECK (type IN ('syllabus','notes','reference','lab_manual')),
  file_url text,
  link_url text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_course_materials_course_id ON public.course_materials(course_id);


-- 014_student_support_tables.sql --
-- Correction requests for student onboarding
CREATE TABLE IF NOT EXISTS public.correction_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid REFERENCES public.users(id),
  type text NOT NULL,
  message text,
  status text DEFAULT 'pending',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS emergency_contact text,
ADD COLUMN IF NOT EXISTS parent_email text;

ALTER TABLE public.enrollment_codes
ADD COLUMN IF NOT EXISTS used_by uuid REFERENCES public.users(id);


-- 015_fix_rls_admin.sql --
-- Migration 015: Fix RLS so Lumina backend (anon key) can list all users
-- Lumina uses its own JWT auth, NOT Supabase Auth, so auth.uid() is always NULL
-- for backend service calls. The restrictive policy blocks all admin reads.
-- This migration replaces the restrictive policy with a permissive one for
-- application-level reads, trusting Lumina's own FastAPI auth middleware.

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view own data" ON users;

-- Add a permissive read policy (auth enforced at application layer by FastAPI)
CREATE POLICY "Allow backend service reads" ON users
    FOR SELECT USING (true);

-- Also disable RLS on tables that are backend-only (not accessed by the browser client directly)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE learner_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE learning_events DISABLE ROW LEVEL SECURITY;

-- Keep RLS on user-facing tables but make them permissive for service access
DROP POLICY IF EXISTS "Users can view and manage own pathways" ON student_pathways;
CREATE POLICY "Allow service reads on pathways" ON student_pathways
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view own mastery" ON skill_mastery;
CREATE POLICY "Allow service reads on mastery" ON skill_mastery
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own conversations" ON conversations;
CREATE POLICY "Allow service reads on conversations" ON conversations
    FOR SELECT USING (true);


-- 016_student_onboarding_profile_fields.sql --
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS first_name text,
ADD COLUMN IF NOT EXISTS last_name text,
ADD COLUMN IF NOT EXISTS dob date,
ADD COLUMN IF NOT EXISTS gender text;


-- 017_missing_auth_and_subjects_tables.sql --
-- Migration 017: Add missing tables for auth audit and student subjects
-- Tables: student_subjects, login_attempts, login_history

-- 1) Student subjects – tracks which courses/subjects a student has elected
CREATE TABLE IF NOT EXISTS public.student_subjects (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  subject_id uuid NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, subject_id)
);

CREATE INDEX IF NOT EXISTS idx_student_subjects_student ON public.student_subjects(student_id);
CREATE INDEX IF NOT EXISTS idx_student_subjects_subject ON public.student_subjects(subject_id);

-- 2) Login attempts – brute-force protection per (identifier, ip)
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  identifier   text NOT NULL,
  ip_address   text NOT NULL,
  attempts     integer NOT NULL DEFAULT 0,
  last_attempt timestamptz,
  locked_until timestamptz,
  UNIQUE(identifier, ip_address)
);

CREATE INDEX IF NOT EXISTS idx_login_attempts_identifier ON public.login_attempts(identifier);
CREATE INDEX IF NOT EXISTS idx_login_attempts_locked    ON public.login_attempts(locked_until) WHERE locked_until IS NOT NULL;

-- 3) Login history – full audit trail per authentication event
CREATE TABLE IF NOT EXISTS public.login_history (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid REFERENCES public.users(id) ON DELETE SET NULL,
  college_id      uuid REFERENCES public.institutions(id) ON DELETE SET NULL,
  identifier_used text,
  identifier_type text,
  role_at_login   text,
  ip_address      text,
  user_agent      text,
  success         boolean NOT NULL DEFAULT false,
  failure_reason  text,
  created_at      timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_login_history_user_id  ON public.login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created  ON public.login_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_success  ON public.login_history(success);


-- 018_parent_student_connection_system.sql --
-- Migration 018: Add support for parent-student connection codes (v2 CLEAN ARCHITECTURE)

-- Only ONE table for linking: parent_student_links
-- Handles both pending codes and permanent links
CREATE TABLE IF NOT EXISTS public.parent_student_links (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id  uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  parent_id   uuid REFERENCES public.users(id) ON DELETE CASCADE, -- Nullable until linked
  
  link_code   text UNIQUE NOT NULL,
  status      text NOT NULL DEFAULT 'pending', -- pending, linked, expired
  
  -- Verification Support (Item 1: Security)
  verification_status TEXT DEFAULT 'pending' CHECK (verification_status IN ('pending', 'verified', 'rejected', 'flagged')),
  verified_by_admin   BOOLEAN DEFAULT false,
  verified_at         TIMESTAMPTZ,
  verified_by         uuid REFERENCES public.users(id),
  verification_notes  text,
  
  expires_at  timestamptz NOT NULL,
  created_at  timestamptz DEFAULT now(),
  linked_at   timestamptz,
  
  -- Prevent multiple active permanent links for same student/parent combo
  CONSTRAINT unique_student_parent_link UNIQUE(student_id, parent_id)
);

CREATE INDEX IF NOT EXISTS idx_parent_student_links_code ON public.parent_student_links(link_code);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_student ON public.parent_student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_links_parent ON public.parent_student_links(parent_id);

-- Enable RLS for connection links
ALTER TABLE public.parent_student_links ENABLE ROW LEVEL SECURITY;

-- 1. Students can see their own codes (pending or linked)
CREATE POLICY "Students can view own codes" ON public.parent_student_links
  FOR SELECT USING (auth.uid() = student_id);

-- 2. Parents can see codes they have linked or use for linking
CREATE POLICY "Parents can view linked codes" ON public.parent_student_links
  FOR SELECT USING (auth.uid() = parent_id OR (status = 'pending' AND auth.uid() IS NOT NULL));

-- 3. Students can manage (create/expire) their own codes
CREATE POLICY "Students can manage own codes" ON public.parent_student_links
  FOR ALL USING (auth.uid() = student_id);

-- 4. Parents can update codes to 'linked' status
CREATE POLICY "Parents can perform linking" ON public.parent_student_links
  FOR UPDATE USING (status = 'pending')
  WITH CHECK (auth.uid() IS NOT NULL);

-- 5. ONLY Admins can verify links (Item 1: Security)
CREATE POLICY "Admins can verify parent-student links" ON public.parent_student_links
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users u WHERE u.id = auth.uid() AND u.role = 'admin')
  );

-- 6. Parents can ONLY view child progress/submissions if link is verified
CREATE POLICY "Parents see verified progress" ON public.progress
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.parent_student_links psl
            WHERE psl.parent_id = auth.uid()
            AND psl.student_id = progress.user_id
            AND psl.verified_by_admin = true
        )
    );


-- Counselor System Tables
-- Privacy-first design for Lumina

-- 1. Counselor Notes (Client-side encrypted)
CREATE TABLE IF NOT EXISTS counselor_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counselor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    encrypted_blob TEXT NOT NULL,
    iv TEXT NOT NULL,
    auth_tag TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Risk Reveal Logs (Audit trail for deanonymization)
CREATE TABLE IF NOT EXISTS risk_reveal_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    counselor_id UUID REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    revealed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Follow-up Tasks (Escalation system)
CREATE TABLE IF NOT EXISTS follow_up_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    counselor_id UUID REFERENCES users(id) ON DELETE SET NULL,
    status TEXT DEFAULT 'pending', -- pending, acknowledged, completed, escalated
    due_at TIMESTAMPTZ NOT NULL,
    acknowledged_at TIMESTAMPTZ,
    escalated_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Risk Alerts (Anonymized signals)
CREATE TABLE IF NOT EXISTS risk_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    signal_type TEXT NOT NULL, -- withdrawal, low_engagement, crisis_keyword
    severity TEXT NOT NULL, -- low, medium, high, critical
    suppression_status TEXT DEFAULT 'active', -- active, suppressed
    suppression_expiry TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for Counselor System
ALTER TABLE counselor_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_reveal_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE follow_up_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE risk_alerts ENABLE ROW LEVEL SECURITY;

-- Counselors can manage their own notes
CREATE POLICY "Counselors can manage own notes" ON counselor_notes
    FOR ALL USING (auth.uid() = counselor_id);

-- Counselors and Admins can view reveal logs
CREATE POLICY "Counselors and Admins can view reveal logs" ON risk_reveal_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('counselor', 'admin'))
    );

-- Counselors can view alerts
CREATE POLICY "Counselors can view risk alerts" ON risk_alerts
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('counselor', 'admin'))
    );

-- Counselors can view and update follow-ups
CREATE POLICY "Counselors can manage follow-ups" ON follow_up_tasks
    FOR ALL USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('counselor', 'admin'))
    );
