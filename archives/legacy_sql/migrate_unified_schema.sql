-- Lumina AI LMS - Unified Schema Migration
-- Version: 2.0.0
-- Description: Unifies duplicate tables (submissions, attendance) and standardizes soft deletes.

BEGIN;

-- 1. ADVICE ON ROLES: Standardize users.role
-- Ensure users table has consistent role column (already exists in most migrations)
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 2. UNIFY ATTENDANCE
-- Create Unified Attendance Sessions
CREATE TABLE IF NOT EXISTS public.attendance_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL,
    section TEXT,
    class_date DATE NOT NULL,
    metadata JSONB DEFAULT '{}',
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(course_id, batch_id, section, class_date)
);

-- Create Unified Attendance Records
CREATE TABLE IF NOT EXISTS public.attendance_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES public.attendance_sessions(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    is_present BOOLEAN DEFAULT FALSE,
    remark TEXT,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(session_id, student_id)
);

ALTER TABLE public.attendance_sessions ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.attendance_sessions ADD COLUMN IF NOT EXISTS batch_id UUID REFERENCES public.batches(id) ON DELETE SET NULL;
ALTER TABLE public.attendance_sessions ADD COLUMN IF NOT EXISTS section TEXT;
ALTER TABLE public.attendance_sessions ADD COLUMN IF NOT EXISTS class_date DATE;
ALTER TABLE public.attendance_sessions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.attendance_sessions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.attendance_sessions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.attendance_sessions ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE public.attendance_records ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();


-- Migrate Data from legacy attendance (if exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'attendance') THEN
        -- Link old records to new sessions (create session if none)
        INSERT INTO attendance_sessions (course_id, teacher_id, batch_id, section, class_date)
        SELECT DISTINCT course_id, teacher_id, batch_id, section, class_date
        FROM public.attendance
        ON CONFLICT DO NOTHING;

        INSERT INTO attendance_records (session_id, student_id, is_present, created_at)
        SELECT s.id, a.student_id, a.is_present, a.created_at
        FROM public.attendance a
        JOIN attendance_sessions s ON s.course_id = a.course_id AND s.batch_id = a.batch_id AND s.section = a.section AND s.class_date = a.class_date
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 3. UNIFY SUBMISSIONS
-- Create Unified Assignment Submissions
CREATE TABLE IF NOT EXISTS public.assignment_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES public.assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    submission_type TEXT NOT NULL DEFAULT 'online' CHECK (submission_type IN ('online', 'physical', 'handwritten')),
    content_url TEXT,
    text_content TEXT,
    metadata JSONB DEFAULT '{}',
    status TEXT DEFAULT 'pending',
    marks INTEGER,
    feedback TEXT,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    graded_at TIMESTAMPTZ,
    is_deleted BOOLEAN DEFAULT FALSE,
    deleted_at TIMESTAMPTZ
);

ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS submission_type TEXT NOT NULL DEFAULT 'online';
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS content_url TEXT;
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS text_content TEXT;
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}';
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS marks INTEGER;
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS feedback TEXT;
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS graded_at TIMESTAMPTZ;
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE public.assignment_submissions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- Migrate Data from legacy submissions
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'submissions') THEN
        INSERT INTO assignment_submissions (id, assignment_id, student_id, content_url, status, marks, feedback, text_content, submitted_at)
        SELECT 
            id, 
            assignment_uuid, -- use the UUID column if populated
            student_uuid,
            content_url,
            'pending' AS status,
            marks,
            NULL AS feedback,
            text_content,
            COALESCE(created_at, NOW())
        FROM public.submissions
        WHERE assignment_uuid IS NOT NULL AND student_uuid IS NOT NULL
        ON CONFLICT DO NOTHING;
    END IF;

    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'physical_submissions') THEN
        INSERT INTO assignment_submissions (id, assignment_id, student_id, submission_type, metadata, status, marks, submitted_at)
        SELECT 
            id, 
            NULL, -- physical_submissions assignment_id was TEXT in legacy
            student_id,
            'physical',
            jsonb_build_object('images', submission_images, 'ocr', ocr_extracted_text, 'ai_assessment', ai_assessment),
            assessment_status,
            total_ai_marks,
            created_at
        FROM public.physical_submissions
        ON CONFLICT DO NOTHING;
    END IF;
END $$;

-- 4. SOFT DELETE COLUMNS FOR OTHER CORE TABLES
ALTER TABLE courses ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE courses ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE assignments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE assignments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE institutions ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE institutions ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE departments ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE departments ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE programs ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE classes ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE classes ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

ALTER TABLE batches ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN DEFAULT FALSE;
ALTER TABLE batches ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

-- 5. CLEANUP LEGACY (Comment out if you want to keep them for safety during transition)
-- DROP TABLE IF EXISTS attendance CASCADE;
-- DROP TABLE IF EXISTS submissions CASCADE;
-- DROP TABLE IF EXISTS physical_submissions CASCADE;

COMMIT;
