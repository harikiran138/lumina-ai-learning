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
    USING (auth.uid() = user_id OR auth.uid() IS NULL); -- Allow null for seeding

-- Skill Mastery
CREATE POLICY "Users can view own mastery" ON skill_mastery
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Quizzes
CREATE POLICY "Anyone can view published quizzes" ON quizzes
    FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Teachers can manage own quizzes" ON quizzes
    ALL USING (true); -- Permissive for dev

-- Quiz Attempts
CREATE POLICY "Users can view own attempts" ON quiz_attempts
    FOR SELECT USING (auth.uid() = user_id OR auth.uid() IS NULL);

CREATE POLICY "Users can insert own attempts" ON quiz_attempts
    FOR INSERT WITH CHECK (true);

-- Conversations
CREATE POLICY "Users can manage own conversations" ON conversations
    USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- User Data
CREATE POLICY "Users can view and edit own data" ON user_data
    USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- Enrollments (if not already handled)
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow anon enrollments" ON enrollments;
CREATE POLICY "Allow anon enrollments" ON enrollments ALL USING (true);
