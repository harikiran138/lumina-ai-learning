-- Lumina Community PostgreSQL Vector Database Schema
-- Requires pgvector extension for vector operations
-- Version 2.0: Added structured learning tables (courses, lessons, assessments, progress)

-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enum types
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE course_status AS ENUM ('draft', 'published', 'archived');
CREATE TYPE group_type AS ENUM ('general', 'study-group', 'course', 'project');
CREATE TYPE message_type AS ENUM ('text', 'file', 'image', 'system');

-- Users table with vector embeddings
CREATE TABLE users (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    role user_role NOT NULL DEFAULT 'student',
    avatar VARCHAR(10) DEFAULT 'U',
    color VARCHAR(20) DEFAULT 'bg-blue-500',
    skills TEXT[] DEFAULT '{}',
    interests TEXT[] DEFAULT '{}',
    bio TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,

    -- Vector embeddings for semantic search
    name_vector vector(384),         -- Name semantic embedding
    skills_vector vector(384),       -- Skills semantic embedding
    bio_vector vector(384),          -- Bio semantic embedding
    combined_vector vector(384)      -- Combined profile embedding
);

-- Courses table for structured learning content
CREATE TABLE courses (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    description TEXT,
    teacher_id VARCHAR(50) NOT NULL REFERENCES users(id),
    status course_status NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Vector embeddings for search and recommendations
    name_vector vector(384),
    description_vector vector(384)
);

-- Lessons table, part of a course
CREATE TABLE lessons (
    id BIGSERIAL PRIMARY KEY,
    course_id VARCHAR(50) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT,
    "order" INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Assessments table for quizzes, exams, etc.
CREATE TABLE assessments (
    id BIGSERIAL PRIMARY KEY,
    course_id VARCHAR(50) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id BIGINT REFERENCES lessons(id),
    title VARCHAR(200) NOT NULL,
    type VARCHAR(50) NOT NULL DEFAULT 'quiz', -- 'quiz', 'exam', 'assignment'
    questions JSONB, -- Store questions as JSON
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Groups table with vector embeddings
CREATE TABLE groups (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type group_type NOT NULL DEFAULT 'study-group',
    avatar VARCHAR(10) DEFAULT '📚',
    color VARCHAR(20) DEFAULT 'bg-green-500',
    created_by VARCHAR(50) NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    max_members INTEGER DEFAULT 50,
    is_private BOOLEAN DEFAULT false,
    
    -- Vector embeddings for semantic search
    name_vector vector(384),         -- Group name embedding
    description_vector vector(384),  -- Description embedding
    topic_vector vector(384),        -- Combined topic embedding
    
    -- Metadata
    member_count INTEGER DEFAULT 0,
    message_count INTEGER DEFAULT 0
);

-- Group members junction table
CREATE TABLE group_members (
    group_id VARCHAR(50) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    role VARCHAR(20) DEFAULT 'member', -- member, moderator, admin
    is_active BOOLEAN DEFAULT true,
    
    PRIMARY KEY (group_id, user_id)
);

-- Messages table with vector embeddings
CREATE TABLE messages (
    id BIGSERIAL PRIMARY KEY,
    group_id VARCHAR(50) NOT NULL REFERENCES groups(id) ON DELETE CASCADE,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id),
    content TEXT NOT NULL,
    type message_type DEFAULT 'text',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_edited BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    
    -- Vector embedding for semantic search
    content_vector vector(384),      -- Message content embedding
    
    -- Metadata
    reply_to BIGINT REFERENCES messages(id),
    mentions VARCHAR(50)[] DEFAULT '{}',
    attachments JSONB DEFAULT '[]'
);

-- Student Progress table
CREATE TABLE student_progress (
    id BIGSERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id VARCHAR(50) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    completed_lessons BIGINT[] DEFAULT '{}',
    mastery_score FLOAT DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(student_id, course_id)
);

-- Assessment Scores table
CREATE TABLE assessment_scores (
    id BIGSERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    assessment_id BIGINT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    score FLOAT NOT NULL,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    feedback TEXT,
    is_graded BOOLEAN DEFAULT false
);

-- Attendance table for tracking student attendance
CREATE TABLE attendance (
    id BIGSERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    course_id VARCHAR(50) NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    lesson_id BIGINT REFERENCES lessons(id),
    check_in_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    check_out_time TIMESTAMP WITH TIME ZONE,
    duration_minutes INTEGER,
    attendance_type VARCHAR(20) DEFAULT 'lesson', -- 'lesson', 'office_hours', 'study_session'
    location VARCHAR(100), -- physical location or 'online'
    notes TEXT,
    is_present BOOLEAN DEFAULT true,
    face_embedding vector(512), -- ArcFace embedding for verification
    confidence_score FLOAT -- confidence of face recognition
);

-- Streaks table for tracking learning streaks
CREATE TABLE streaks (
    id BIGSERIAL PRIMARY KEY,
    student_id VARCHAR(50) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    streak_type VARCHAR(50) NOT NULL, -- 'daily_login', 'course_completion', 'assessment_streak'
    current_streak INTEGER DEFAULT 0,
    longest_streak INTEGER DEFAULT 0,
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    streak_start_date DATE,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}' -- additional streak-specific data
);

-- User interactions for recommendations
CREATE TABLE user_interactions (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id),
    target_user_id VARCHAR(50) REFERENCES users(id),
    target_group_id VARCHAR(50) REFERENCES groups(id),
    target_message_id BIGINT REFERENCES messages(id),
    interaction_type VARCHAR(20) NOT NULL, -- view, like, share, message, join
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Vector context for interaction
    context_vector vector(384)
);

-- Indexes for performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_name_vector ON users USING ivfflat (name_vector vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_users_skills_vector ON users USING ivfflat (skills_vector vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_users_combined_vector ON users USING ivfflat (combined_vector vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX idx_courses_status ON courses(status);

CREATE INDEX idx_lessons_course_id ON lessons(course_id);

CREATE INDEX idx_assessments_course_id ON assessments(course_id);
CREATE INDEX idx_assessments_lesson_id ON assessments(lesson_id);

CREATE INDEX idx_groups_type ON groups(type);
CREATE INDEX idx_groups_active ON groups(is_active);
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_groups_last_activity ON groups(last_activity DESC);
CREATE INDEX idx_groups_name_vector ON groups USING ivfflat (name_vector vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_groups_topic_vector ON groups USING ivfflat (topic_vector vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_group_members_active ON group_members(is_active);

CREATE INDEX idx_messages_group ON messages(group_id);
CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_content_vector ON messages USING ivfflat (content_vector vector_cosine_ops) WITH (lists = 100);

CREATE INDEX idx_student_progress_student_course ON student_progress(student_id, course_id);

CREATE INDEX idx_assessment_scores_student_assessment ON assessment_scores(student_id, assessment_id);
CREATE INDEX idx_assessment_scores_assessment_id ON assessment_scores(assessment_id);

CREATE INDEX idx_attendance_student_course ON attendance(student_id, course_id);
CREATE INDEX idx_attendance_check_in ON attendance(check_in_time DESC);
CREATE INDEX idx_attendance_lesson ON attendance(lesson_id);

CREATE INDEX idx_streaks_student_type ON streaks(student_id, streak_type);
CREATE INDEX idx_streaks_active ON streaks(is_active);

CREATE INDEX idx_interactions_user ON user_interactions(user_id);
CREATE INDEX idx_interactions_type ON user_interactions(interaction_type);
CREATE INDEX idx_interactions_created ON user_interactions(created_at DESC);

-- Functions for vector operations

-- Function to generate embeddings (placeholder - in real implementation, would call embedding service)
CREATE OR REPLACE FUNCTION generate_embedding(text_input TEXT)
RETURNS vector(384) AS $$
BEGIN
    -- This is a placeholder. In production, you would:
    -- 1. Call an embedding service (OpenAI, Sentence Transformers, etc.)
    -- 2. Return the actual vector embedding
    -- For now, return a random vector for testing
    RETURN array_fill(random()::real, ARRAY[384])::vector(384);
END;
$$ LANGUAGE plpgsql;

-- Function to update user vectors
CREATE OR REPLACE FUNCTION update_user_vectors()
RETURNS TRIGGER AS $$
BEGIN
    NEW.name_vector = generate_embedding(NEW.name);
    NEW.skills_vector = generate_embedding(array_to_string(NEW.skills, ' '));
    NEW.bio_vector = generate_embedding(COALESCE(NEW.bio, ''));
    NEW.combined_vector = generate_embedding(
        NEW.name || ' ' || 
        array_to_string(NEW.skills, ' ') || ' ' || 
        COALESCE(NEW.bio, '')
    );
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update group vectors
CREATE OR REPLACE FUNCTION update_course_vectors()
RETURNS TRIGGER AS $$
BEGIN
    NEW.name_vector = generate_embedding(NEW.name);
    NEW.description_vector = generate_embedding(COALESCE(NEW.description, ''));
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION update_group_vectors()
RETURNS TRIGGER AS $$
BEGIN
    NEW.name_vector = generate_embedding(NEW.name);
    NEW.description_vector = generate_embedding(COALESCE(NEW.description, ''));
    NEW.topic_vector = generate_embedding(
        NEW.name || ' ' || COALESCE(NEW.description, '')
    );
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update message vectors
CREATE OR REPLACE FUNCTION update_message_vectors()
RETURNS TRIGGER AS $$
BEGIN
    NEW.content_vector = generate_embedding(NEW.content);
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function to update group stats
CREATE OR REPLACE FUNCTION update_group_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        IF TG_TABLE_NAME = 'group_members' THEN
            UPDATE groups 
            SET member_count = member_count + 1,
                last_activity = NOW()
            WHERE id = NEW.group_id;
        ELSIF TG_TABLE_NAME = 'messages' THEN
            UPDATE groups 
            SET message_count = message_count + 1,
                last_activity = NOW()
            WHERE id = NEW.group_id;
        END IF;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        IF TG_TABLE_NAME = 'group_members' THEN
            UPDATE groups 
            SET member_count = member_count - 1
            WHERE id = OLD.group_id;
        ELSIF TG_TABLE_NAME = 'messages' THEN
            UPDATE groups 
            SET message_count = message_count - 1
            WHERE id = OLD.group_id;
        END IF;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Triggers
CREATE TRIGGER tr_users_vectors
    BEFORE INSERT OR UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_user_vectors();

CREATE TRIGGER tr_courses_vectors
    BEFORE INSERT OR UPDATE ON courses
    FOR EACH ROW
    EXECUTE FUNCTION update_course_vectors();

CREATE TRIGGER tr_groups_vectors
    BEFORE INSERT OR UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_group_vectors();

CREATE TRIGGER tr_messages_vectors
    BEFORE INSERT OR UPDATE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_message_vectors();

CREATE TRIGGER tr_group_member_stats
    AFTER INSERT OR DELETE ON group_members
    FOR EACH ROW
    EXECUTE FUNCTION update_group_stats();

CREATE TRIGGER tr_message_stats
    AFTER INSERT OR DELETE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_group_stats();

-- Views for common queries

-- Active groups with member counts
CREATE VIEW active_groups AS
SELECT 
    g.*,
    COUNT(gm.user_id) as actual_member_count,
    u.name as creator_name
FROM groups g
LEFT JOIN group_members gm ON g.id = gm.group_id AND gm.is_active = true
LEFT JOIN users u ON g.created_by = u.id
WHERE g.is_active = true
GROUP BY g.id, u.name;

-- User profiles with skills
CREATE VIEW user_profiles AS
SELECT 
    u.*,
    COUNT(DISTINCT gm.group_id) as groups_joined,
    COUNT(DISTINCT m.id) as messages_sent
FROM users u
LEFT JOIN group_members gm ON u.id = gm.user_id AND gm.is_active = true
LEFT JOIN messages m ON u.id = m.user_id AND m.is_deleted = false
WHERE u.is_active = true
GROUP BY u.id;

-- Recent messages with user info
CREATE VIEW recent_messages AS
SELECT 
    m.*,
    u.name as sender_name,
    u.avatar as sender_avatar,
    u.color as sender_color,
    u.role as sender_role,
    g.name as group_name
FROM messages m
JOIN users u ON m.user_id = u.id
JOIN groups g ON m.group_id = g.id
WHERE m.is_deleted = false
ORDER BY m.created_at DESC;

-- Semantic search functions

-- Find similar users based on vector similarity
CREATE OR REPLACE FUNCTION find_similar_users(
    target_user_id VARCHAR(50),
    similarity_threshold FLOAT DEFAULT 0.7,
    result_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
    user_id VARCHAR(50),
    name VARCHAR(100),
    similarity_score FLOAT,
    shared_skills TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        1 - (target.combined_vector <=> u.combined_vector) as similarity,
        ARRAY(
            SELECT unnest(target.skills) 
            INTERSECT 
            SELECT unnest(u.skills)
        ) as shared_skills
    FROM users u
    CROSS JOIN (SELECT * FROM users WHERE id = target_user_id) target
    WHERE u.id != target_user_id 
        AND u.is_active = true
        AND 1 - (target.combined_vector <=> u.combined_vector) >= similarity_threshold
    ORDER BY similarity DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Find recommended groups for a user
CREATE OR REPLACE FUNCTION recommend_groups(
    target_user_id VARCHAR(50),
    similarity_threshold FLOAT DEFAULT 0.6,
    result_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
    group_id VARCHAR(50),
    name VARCHAR(100),
    description TEXT,
    similarity_score FLOAT,
    member_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.name,
        g.description,
        1 - (u.combined_vector <=> g.topic_vector) as similarity,
        g.member_count
    FROM groups g
    CROSS JOIN (SELECT * FROM users WHERE id = target_user_id) u
    WHERE g.is_active = true
        AND g.id NOT IN (
            SELECT group_id FROM group_members 
            WHERE user_id = target_user_id AND is_active = true
        )
        AND 1 - (u.combined_vector <=> g.topic_vector) >= similarity_threshold
    ORDER BY similarity DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Semantic search for messages
CREATE OR REPLACE FUNCTION search_messages(
    search_query TEXT,
    target_group_id VARCHAR(50) DEFAULT NULL,
    similarity_threshold FLOAT DEFAULT 0.6,
    result_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
    message_id BIGINT,
    content TEXT,
    group_id VARCHAR(50),
    user_id VARCHAR(50),
    sender_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE,
    similarity_score FLOAT
) AS $$
DECLARE
    query_vector vector(384);
BEGIN
    query_vector := generate_embedding(search_query);
    
    RETURN QUERY
    SELECT 
        m.id,
        m.content,
        m.group_id,
        m.user_id,
        u.name,
        m.created_at,
        1 - (query_vector <=> m.content_vector) as similarity
    FROM messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.is_deleted = false
        AND (target_group_id IS NULL OR m.group_id = target_group_id)
        AND 1 - (query_vector <=> m.content_vector) >= similarity_threshold
    ORDER BY similarity DESC, m.created_at DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Sample data insertion
INSERT INTO users (id, name, email, role, avatar, color, skills, bio) VALUES
('admin_001', 'Admin User', 'admin@lumina.com', 'admin', 'A', 'bg-red-500', ARRAY['leadership', 'management', 'education'], 'Platform administrator'),
('teacher_001', 'Dr. Sarah Wilson', 'sarah@lumina.com', 'teacher', 'S', 'bg-indigo-500', ARRAY['physics', 'mathematics', 'research', 'teaching'], 'Physics professor with 10+ years experience'),
('student_001', 'Alex Turner', 'alex@student.lumina.com', 'student', 'A', 'bg-amber-500', ARRAY['programming', 'mathematics', 'physics'], 'Computer Science student passionate about AI'),
('student_002', 'Emma Davis', 'emma@student.lumina.com', 'student', 'E', 'bg-green-500', ARRAY['biology', 'chemistry', 'research'], 'Pre-med student interested in biochemistry'),
('student_003', 'Michael Chen', 'michael@student.lumina.com', 'student', 'M', 'bg-purple-500', ARRAY['computer science', 'mathematics', 'algorithms'], 'Software engineering student');

INSERT INTO courses (id, name, description, teacher_id, status) VALUES
('qm_001', 'Quantum Mechanics', 'An introductory course on the principles of quantum mechanics.', 'teacher_001', 'published'),
('cs_101', 'Intro to Computer Science', 'Fundamentals of programming and computer science.', 'admin_001', 'published');

INSERT INTO lessons (course_id, title, "order") VALUES
('qm_001', 'The Wave Function', 1),
('qm_001', 'The Schrödinger Equation', 2),
('cs_101', 'What is Programming?', 1);

INSERT INTO groups (id, name, description, type, avatar, color, created_by) VALUES
('general', 'General Discussion', 'Welcome to Lumina! Chat with students and teachers from all subjects.', 'general', '💬', 'bg-blue-500', 'admin_001'),
('study_buddies', 'Study Buddies', 'Find study partners and form study groups!', 'study-group', '📚', 'bg-green-500', 'admin_001'),
('physics_help', 'Physics Help Desk', 'Get help with physics concepts and homework.', 'course', '⚛️', 'bg-purple-500', 'teacher_001'),
('announcements', 'Announcements', 'Important updates and announcements from teachers and admins.', 'general', '📢', 'bg-amber-500', 'admin_001');

INSERT INTO group_members (group_id, user_id) VALUES
('general', 'admin_001'),
('general', 'teacher_001'),
('general', 'student_001'),
('general', 'student_002'),
('general', 'student_003'),
('study_buddies', 'student_001'),
('study_buddies', 'student_002'),
('study_buddies', 'student_003'),
('physics_help', 'teacher_001'),
('physics_help', 'student_001'),
('physics_help', 'student_002'),
('announcements', 'admin_001'),
('announcements', 'teacher_001'),
('announcements', 'student_001'),
('announcements', 'student_002'),
('announcements', 'student_003');

INSERT INTO messages (group_id, user_id, content) VALUES
('general', 'admin_001', 'Welcome to Lumina Community! 🎉 Feel free to introduce yourselves and connect with fellow learners.'),
('general', 'student_001', 'Hi everyone! Excited to be here. Looking forward to learning together! 📚'),
('study_buddies', 'student_002', 'Anyone want to form a study group for the upcoming physics exam?'),
('physics_help', 'teacher_001', 'Physics help desk is now open! Drop your questions here and I''ll help you out. 🔬'),
('announcements', 'admin_001', '📢 New AI Tutor feature is now available! Check it out in the navigation menu.');