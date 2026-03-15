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
