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
