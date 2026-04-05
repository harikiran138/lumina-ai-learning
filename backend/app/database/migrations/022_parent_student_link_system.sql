-- Migration: 022_parent_student_link_system.sql
-- Description: Adds unique parent link codes for students and a mapping table for parent-child relationships.

-- 1. Add parent_link_code column to users table
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='parent_link_code') THEN
        ALTER TABLE users ADD COLUMN parent_link_code VARCHAR(8) UNIQUE;
    END IF;
END $$;

-- 2. Create parent_student mapping table
CREATE TABLE IF NOT EXISTS parent_student (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Prevent duplicate linking
    UNIQUE(parent_id, student_id)
);

-- 3. Add index for faster child lookups by parent
CREATE INDEX IF NOT EXISTS idx_parent_student_parent ON parent_student(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_student_link_code ON users(parent_link_code) WHERE parent_link_code IS NOT NULL;

-- 4. Set RLS Policies for parent_student
ALTER TABLE parent_student ENABLE ROW LEVEL SECURITY;

-- Parents can view their own links
CREATE POLICY "Parents can view their own child links" ON parent_student
    FOR SELECT USING (auth.uid() = parent_id);

-- Parents can create their own links
CREATE POLICY "Parents can create their own child links" ON parent_student
    FOR INSERT WITH CHECK (auth.uid() = parent_id);
