import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ Error: Missing DATABASE_URL in .env")
    exit(1)

SQL_MIGRATION = """
-- Add missing columns to courses if they don't exist
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='review_status') THEN
        ALTER TABLE courses ADD COLUMN review_status TEXT DEFAULT 'draft';
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='courses' AND column_name='designer_notes') THEN
        ALTER TABLE courses ADD COLUMN designer_notes TEXT DEFAULT '';
    END IF;
END $$;

-- 1. Question Bank
CREATE TABLE IF NOT EXISTS question_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type TEXT DEFAULT 'mcq',
    difficulty TEXT DEFAULT 'beginner',
    answer_options JSONB,
    correct_answer JSONB NOT NULL,
    explanation TEXT,
    point_value INT DEFAULT 1,
    is_ai_generated BOOLEAN DEFAULT FALSE,
    usage_count INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Handwritten Assignments (Base table for teacher metadata)
CREATE TABLE IF NOT EXISTS handwritten_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    total_marks INT DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Handwritten Questions (Reference to specific handwritten questions)
CREATE TABLE IF NOT EXISTS handwritten_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES handwritten_assignments(id) ON DELETE CASCADE,
    number INT NOT NULL,
    text TEXT NOT NULL,
    max_marks INT NOT NULL,
    rubric JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Handwritten Submissions (Base table for student records)
CREATE TABLE IF NOT EXISTS handwritten_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES handwritten_assignments(id) ON DELETE CASCADE,
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    original_file_path TEXT NOT NULL,
    file_type TEXT,
    ai_total_score NUMERIC DEFAULT 0.0,
    teacher_total_score NUMERIC DEFAULT 0.0,
    final_score NUMERIC,
    processing_log JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    finalized_at TIMESTAMPTZ
);

-- 5. Handwritten Submission Questions (Detailed per-question AI/Teacher evaluation)
CREATE TABLE IF NOT EXISTS handwritten_submission_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES handwritten_submissions(id) ON DELETE CASCADE,
    question_id UUID REFERENCES handwritten_questions(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending',
    ocr_raw_text TEXT,
    ocr_confidence NUMERIC DEFAULT 0.0,
    ocr_is_flagged BOOLEAN DEFAULT FALSE,
    segment_image_path TEXT,
    ai_score NUMERIC DEFAULT 0.0,
    ai_reasoning TEXT,
    ai_feedback TEXT,
    ai_confidence NUMERIC DEFAULT 0.0,
    teacher_score NUMERIC,
    teacher_feedback TEXT,
    teacher_override_reason TEXT,
    overridden_at TIMESTAMPTZ,
    final_score NUMERIC,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_question_bank_course ON question_bank(course_id);
CREATE INDEX IF NOT EXISTS idx_hw_assignments_teacher ON handwritten_assignments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_hw_submissions_student ON handwritten_submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_hw_submission_questions_sub ON handwritten_submission_questions(submission_id);

-- 6. Parent Feature Schema
ALTER TABLE users ADD COLUMN IF NOT EXISTS parent_link_code VARCHAR(15);

CREATE TABLE IF NOT EXISTS parent_student_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID REFERENCES users(id) ON DELETE SET NULL,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    link_code TEXT UNIQUE,
    status TEXT DEFAULT 'pending',
    verified_by_admin BOOLEAN DEFAULT FALSE,
    expires_at TIMESTAMPTZ,
    linked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS parent_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    child_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    goal_text TEXT NOT NULL,
    status VARCHAR(50) DEFAULT 'pending_student_approval',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS parent_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES users(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'unread',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS inactivity_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    risk_level VARCHAR(20) DEFAULT 'medium',
    reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_parent_links_student ON parent_student_links(student_id);
CREATE INDEX IF NOT EXISTS idx_parent_links_code ON parent_student_links(link_code);
CREATE INDEX IF NOT EXISTS idx_parent_goals_parent ON parent_goals(parent_id);
CREATE INDEX IF NOT EXISTS idx_parent_messages_parent ON parent_messages(parent_id);
"""

def apply_migrations():
    try:
        conn = psycopg2.connect(DATABASE_URL)
        conn.autocommit = True
        cur = conn.cursor()
        
        print("🚀 Applying missing database schema...")
        cur.execute(SQL_MIGRATION)
        
        print("✅ Success: Missing tables created/verified.")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"❌ Error applying migration: {e}")

if __name__ == "__main__":
    apply_migrations()
