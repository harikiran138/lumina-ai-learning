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
