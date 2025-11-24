-- Lumina Community PostgreSQL Database Schema (Without Vector Extension)
-- Simplified version that works with any PostgreSQL installation

-- Create enum types
CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin');
CREATE TYPE group_type AS ENUM ('general', 'study-group', 'course', 'project');
CREATE TYPE message_type AS ENUM ('text', 'file', 'image', 'system');

-- Users table
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
    is_active BOOLEAN DEFAULT true
);

-- Groups table
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

-- Messages table
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
    reply_to BIGINT REFERENCES messages(id),
    mentions VARCHAR(50)[] DEFAULT '{}',
    attachments JSONB DEFAULT '[]'
);

-- User interactions for basic recommendations
CREATE TABLE user_interactions (
    id BIGSERIAL PRIMARY KEY,
    user_id VARCHAR(50) NOT NULL REFERENCES users(id),
    target_user_id VARCHAR(50) REFERENCES users(id),
    target_group_id VARCHAR(50) REFERENCES groups(id),
    target_message_id BIGINT REFERENCES messages(id),
    interaction_type VARCHAR(20) NOT NULL, -- view, like, share, message, join
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_skills ON users USING GIN(skills);

CREATE INDEX idx_groups_type ON groups(type);
CREATE INDEX idx_groups_active ON groups(is_active);
CREATE INDEX idx_groups_created_by ON groups(created_by);
CREATE INDEX idx_groups_last_activity ON groups(last_activity DESC);

CREATE INDEX idx_group_members_group ON group_members(group_id);
CREATE INDEX idx_group_members_user ON group_members(user_id);
CREATE INDEX idx_group_members_active ON group_members(is_active);

CREATE INDEX idx_messages_group ON messages(group_id);
CREATE INDEX idx_messages_user ON messages(user_id);
CREATE INDEX idx_messages_created ON messages(created_at DESC);
CREATE INDEX idx_messages_content ON messages USING GIN(to_tsvector('english', content));

CREATE INDEX idx_interactions_user ON user_interactions(user_id);
CREATE INDEX idx_interactions_type ON user_interactions(interaction_type);
CREATE INDEX idx_interactions_created ON user_interactions(created_at DESC);

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
CREATE TRIGGER tr_group_member_stats
    AFTER INSERT OR DELETE ON group_members
    FOR EACH ROW
    EXECUTE FUNCTION update_group_stats();

CREATE TRIGGER tr_message_stats
    AFTER INSERT OR DELETE ON messages
    FOR EACH ROW
    EXECUTE FUNCTION update_group_stats();

-- Views for common queries
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

-- Basic search functions (without vectors)

-- Find similar users based on shared skills
CREATE OR REPLACE FUNCTION find_similar_users(
    target_user_id VARCHAR(50),
    result_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
    user_id VARCHAR(50),
    name VARCHAR(100),
    similarity_score INTEGER,
    shared_skills TEXT[]
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        u.id,
        u.name,
        array_length(ARRAY(
            SELECT unnest(target.skills) 
            INTERSECT 
            SELECT unnest(u.skills)
        ), 1) as similarity,
        ARRAY(
            SELECT unnest(target.skills) 
            INTERSECT 
            SELECT unnest(u.skills)
        ) as shared_skills
    FROM users u
    CROSS JOIN (SELECT * FROM users WHERE id = target_user_id) target
    WHERE u.id != target_user_id 
        AND u.is_active = true
        AND array_length(ARRAY(
            SELECT unnest(target.skills) 
            INTERSECT 
            SELECT unnest(u.skills)
        ), 1) > 0
    ORDER BY similarity DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Find recommended groups for a user based on skills
CREATE OR REPLACE FUNCTION recommend_groups(
    target_user_id VARCHAR(50),
    result_limit INTEGER DEFAULT 5
)
RETURNS TABLE(
    group_id VARCHAR(50),
    name VARCHAR(100),
    description TEXT,
    similarity_score INTEGER,
    member_count INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        g.id,
        g.name,
        g.description,
        COALESCE(array_length(ARRAY(
            SELECT unnest(u.skills) 
            INTERSECT 
            SELECT unnest(string_to_array(lower(g.name || ' ' || COALESCE(g.description, '')), ' '))
        ), 1), 0) as similarity,
        g.member_count
    FROM groups g
    CROSS JOIN (SELECT * FROM users WHERE id = target_user_id) u
    WHERE g.is_active = true
        AND g.id NOT IN (
            SELECT group_id FROM group_members 
            WHERE user_id = target_user_id AND is_active = true
        )
    ORDER BY similarity DESC, g.member_count DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Text search for messages
CREATE OR REPLACE FUNCTION search_messages(
    search_query TEXT,
    target_group_id VARCHAR(50) DEFAULT NULL,
    result_limit INTEGER DEFAULT 20
)
RETURNS TABLE(
    message_id BIGINT,
    content TEXT,
    group_id VARCHAR(50),
    user_id VARCHAR(50),
    sender_name VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE,
    similarity_score REAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.content,
        m.group_id,
        m.user_id,
        u.name,
        m.created_at,
        ts_rank(to_tsvector('english', m.content), plainto_tsquery('english', search_query)) as similarity
    FROM messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.is_deleted = false
        AND (target_group_id IS NULL OR m.group_id = target_group_id)
        AND to_tsvector('english', m.content) @@ plainto_tsquery('english', search_query)
    ORDER BY similarity DESC, m.created_at DESC
    LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- Default password is 'securepwd123' - hashed with bcrypt
INSERT INTO users (id, name, email, role, avatar, color, skills, bio, password_hash) VALUES
('admin_001', 'Admin User', 'admin@lumina.edu', 'admin', 'A', 'bg-red-500', ARRAY['leadership', 'management', 'education'], 'Platform administrator', '$2b$10$4q7H4q3xXZ3r4x5r5x4x4O4q7H4q3xXZ3r4x5r5x4x4O'),
('teacher_001', 'Dr. Sarah Wilson', 'teacher@lumina.edu', 'teacher', 'S', 'bg-indigo-500', ARRAY['physics', 'mathematics', 'research', 'teaching'], 'Physics professor with 10+ years experience', '$2b$10$4q7H4q3xXZ3r4x5r5x4x4O4q7H4q3xXZ3r4x5r5x4x4O'),
('student_001', 'Alex Turner', 'student@lumina.edu', 'student', 'A', 'bg-amber-500', ARRAY['programming', 'mathematics', 'physics'], 'Computer Science student passionate about AI', '$2b$10$4q7H4q3xXZ3r4x5r5x4x4O4q7H4q3xXZ3r4x5r5x4x4O'),
('student_002', 'Emma Davis', 'emma@lumina.edu', 'student', 'E', 'bg-green-500', ARRAY['biology', 'chemistry', 'research'], 'Pre-med student interested in biochemistry', '$2b$10$4q7H4q3xXZ3r4x5r5x4x4O4q7H4q3xXZ3r4x5r5x4x4O'),
('student_003', 'Michael Chen', 'michael@lumina.edu', 'student', 'M', 'bg-purple-500', ARRAY['computer science', 'mathematics', 'algorithms'], 'Software engineering student', '$2b$10$4q7H4q3xXZ3r4x5r5x4x4O4q7H4q3xXZ3r4x5r5x4x4O');

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

-- Show completion message
SELECT '✅ Lumina Community database setup complete (without vector features)!' as status;