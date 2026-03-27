-- Lumina AI LMS - Core Database Schema
-- Version: 1.2.0
-- Description: Clean slate for Lumina tables to ensure type safety and standardization.

-- Enable Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Drop Lumina-related tables if they exist (CASCADE handles dependencies)

-- 1. Users Table
CREATE TABLE IF NOT EXISTS users (
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
CREATE TABLE IF NOT EXISTS courses (
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
CREATE TABLE IF NOT EXISTS enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    progress JSONB DEFAULT '{}',
    status TEXT DEFAULT 'active',
    UNIQUE(student_id, course_id)
);

-- 4. Learner Profiles Table
CREATE TABLE IF NOT EXISTS learner_profiles (
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
CREATE TABLE IF NOT EXISTS learning_events (
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
CREATE TABLE IF NOT EXISTS assessment_sessions (
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
CREATE TABLE IF NOT EXISTS assignment_rubrics (
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
CREATE TABLE IF NOT EXISTS assignment_submissions (
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
CREATE TABLE IF NOT EXISTS submission_scorecards (
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
CREATE TABLE IF NOT EXISTS intervention_recommendations (
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
CREATE TABLE IF NOT EXISTS automation_job_logs (
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
CREATE TABLE IF NOT EXISTS knowledge_nodes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES knowledge_nodes(id) ON DELETE SET NULL,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create Indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX IF NOT EXISTS idx_courses_code ON courses(code);
CREATE INDEX IF NOT EXISTS idx_learning_events_user_id ON learning_events(user_id);
CREATE INDEX IF NOT EXISTS idx_learning_events_type ON learning_events(event_type);
CREATE INDEX IF NOT EXISTS idx_learner_profiles_user_id ON learner_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_intervention_recommendations_user_id ON intervention_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_sessions_user_id ON assessment_sessions(user_id);
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

-- ================================================================
-- Lumina Institution & Academic Hierarchy (Single-Institution LMS)
-- ================================================================

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
    batch TEXT,
    section TEXT,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    batch_year TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS student_enrollments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
    current_semester_id UUID REFERENCES semesters(id) ON DELETE SET NULL,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    year_of_study INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active',
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(student_id, program_id)
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

CREATE TABLE IF NOT EXISTS course_concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    concept_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE INDEX IF NOT EXISTS idx_departments_institution ON departments(institution_id);
CREATE INDEX IF NOT EXISTS idx_programs_department ON programs(department_id);
CREATE INDEX IF NOT EXISTS idx_semesters_program ON semesters(program_id);
CREATE INDEX IF NOT EXISTS idx_classes_program ON classes(program_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_requests_department ON teacher_requests(department_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class ON teacher_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_course_concepts_course ON course_concepts(course_id);
CREATE INDEX IF NOT EXISTS idx_ai_answer_queue_teacher ON ai_answer_queue(teacher_id);

-- ================================================================
-- UI/UX Sync Migration: Align DB with current app requirements
-- ================================================================
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

ALTER TABLE classes ADD COLUMN IF NOT EXISTS class_name TEXT;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS batch TEXT;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS section TEXT;

ALTER TABLE teacher_requests ALTER COLUMN status SET DEFAULT 'PENDING_HOD';
UPDATE teacher_requests SET status = 'PENDING_HOD' WHERE status = 'PENDING';

-- ================================================================
-- UI/UX Alignment Triggers: courses + classes
-- ================================================================
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

UPDATE courses
SET
  course_name = COALESCE(course_name, title, name),
  title = COALESCE(title, course_name, name),
  course_code = COALESCE(course_code, code),
  code = COALESCE(code, course_code),
  name = COALESCE(name, course_name, title)
WHERE
  course_name IS NULL OR title IS NULL OR course_code IS NULL OR code IS NULL OR name IS NULL;

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
