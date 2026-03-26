-- Lumina AI LMS - Institution & Academic Hierarchy
-- Version: 1.0.0
-- Description: Adds institutions, departments, programs, classes, approvals, and AI verification queues.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1) Institution Core
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

-- 2) Department & Program Hierarchy
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

-- 3) Semesters & Classes (Sections)
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

-- 4) Academic Enrollment & Credits
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

-- 5) Teacher Approvals & Class Assignments
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

-- 6) Course Concepts (for AI scope)
CREATE TABLE IF NOT EXISTS course_concepts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    concept_name TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7) Stakeholders (Institution connections)
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

-- 8) Content Pipeline & AI Verification
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

-- 9) Schema Compatibility Enhancements
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

-- 10) Indexes
CREATE INDEX IF NOT EXISTS idx_departments_institution ON departments(institution_id);
CREATE INDEX IF NOT EXISTS idx_programs_department ON programs(department_id);
CREATE INDEX IF NOT EXISTS idx_semesters_program ON semesters(program_id);
CREATE INDEX IF NOT EXISTS idx_classes_program ON classes(program_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_student ON student_enrollments(student_id);
CREATE INDEX IF NOT EXISTS idx_teacher_requests_department ON teacher_requests(department_id);
CREATE INDEX IF NOT EXISTS idx_teacher_assignments_class ON teacher_assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_course_concepts_course ON course_concepts(course_id);
CREATE INDEX IF NOT EXISTS idx_ai_answer_queue_teacher ON ai_answer_queue(teacher_id);
