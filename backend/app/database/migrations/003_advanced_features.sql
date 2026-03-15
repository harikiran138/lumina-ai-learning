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
