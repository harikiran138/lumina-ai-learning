# Database Schema Additions — Lumina v2.0

This document covers all new tables and schema changes required for the features described in this specification.

---

## New Tables

### Content Pipeline Tables

```sql
-- Tracks textbook/syllabus uploads and processing status
CREATE TABLE content_uploads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES users(id) NOT NULL,
    institution_id UUID REFERENCES institutions(id),
    original_filename TEXT,
    storage_url TEXT NOT NULL,
    file_type VARCHAR(20),          -- 'textbook', 'syllabus', 'notes', 'article'
    file_size_bytes BIGINT,
    processing_status VARCHAR(30) DEFAULT 'queued',
    -- queued → extracting → scaffolding → ready_for_review → approved → failed
    extracted_content JSONB,        -- structured extraction result
    scaffold_json JSONB,            -- AI-generated course scaffold
    scaffold_approved_at TIMESTAMPTZ,
    course_id UUID REFERENCES courses(id), -- set after teacher approves
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated course materials
CREATE TABLE generated_materials (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lesson_id UUID REFERENCES lessons(id) NOT NULL,
    teacher_id UUID REFERENCES users(id) NOT NULL,
    material_type VARCHAR(20) NOT NULL,  -- 'ppt', 'pdf_student', 'pdf_teacher'
    difficulty_level VARCHAR(20),         -- 'basic', 'standard', 'advanced'
    language VARCHAR(10) DEFAULT 'en',
    storage_url TEXT,
    generation_status VARCHAR(20) DEFAULT 'pending',
    generated_at TIMESTAMPTZ,
    download_count INTEGER DEFAULT 0,
    last_downloaded TIMESTAMPTZ
);

-- Question bank (teacher-verified questions)
CREATE TABLE question_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID REFERENCES users(id) NOT NULL,
    institution_id UUID REFERENCES institutions(id),
    course_id UUID REFERENCES courses(id),
    concept_id UUID REFERENCES knowledge_graph_nodes(id),
    question_text TEXT NOT NULL,
    question_type VARCHAR(30),
    -- 'mcq', 'short_answer', 'long_answer', 'fill_blank', 'essay', 'teach_back', 'diagram'
    difficulty_level NUMERIC(3,2),        -- 0.00–1.00 IRT-based
    blooms_level VARCHAR(20),
    -- 'remember', 'understand', 'apply', 'analyse', 'evaluate', 'create'
    model_answer TEXT,
    answer_key JSONB,                      -- MCQ: {options: [], correct: 0}
    marking_rubric JSONB,
    common_mistakes TEXT[],
    verification_status VARCHAR(20) DEFAULT 'pending',
    -- 'pending', 'verified', 'rejected'
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    rejection_reason TEXT,
    source VARCHAR(30),
    -- 'manual', 'textbook_upload', 'ai_tutor_session', 'ai_generated'
    times_used INTEGER DEFAULT 0,
    avg_student_score NUMERIC(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assignments table (extended)
CREATE TABLE assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    course_id UUID REFERENCES courses(id) NOT NULL,
    teacher_id UUID REFERENCES users(id) NOT NULL,
    title TEXT NOT NULL,
    assignment_type VARCHAR(30),
    submission_type VARCHAR(20) DEFAULT 'physical',  -- 'physical', 'digital', 'both'
    total_marks NUMERIC(5,2),
    time_limit_minutes INTEGER,
    deadline TIMESTAMPTZ,
    questions JSONB,                -- array of question_bank IDs with mark allocation
    student_pdf_url TEXT,
    teacher_pdf_url TEXT,
    ai_tutor_restricted BOOLEAN DEFAULT TRUE,
    published_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI answer verification queue
CREATE TABLE ai_answer_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) NOT NULL,
    teacher_id UUID REFERENCES users(id) NOT NULL,
    course_id UUID REFERENCES courses(id),
    concept_id UUID REFERENCES knowledge_graph_nodes(id),
    student_question TEXT NOT NULL,
    ai_generated_answer TEXT NOT NULL,
    ai_confidence NUMERIC(4,3),
    ai_model_used VARCHAR(50),
    status VARCHAR(20) DEFAULT 'pending',
    teacher_edited_answer TEXT,
    teacher_custom_answer TEXT,
    rejection_reason TEXT,
    verified_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    released_to_student BOOLEAN DEFAULT FALSE,
    released_at TIMESTAMPTZ,
    added_to_bank BOOLEAN DEFAULT FALSE,
    bank_question_id UUID REFERENCES question_bank(id),
    priority_score INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Physical assignment submissions
CREATE TABLE physical_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id UUID REFERENCES assignments(id) NOT NULL,
    student_id UUID REFERENCES users(id) NOT NULL,
    teacher_id UUID REFERENCES users(id) NOT NULL,
    submission_images TEXT[],          -- MinIO URLs
    ocr_extracted_text JSONB,          -- per-question extracted text
    ai_assessment JSONB,               -- per-question AI marks + feedback
    teacher_assessment JSONB,          -- teacher final marks + comments
    total_ai_marks NUMERIC(5,2),
    total_teacher_marks NUMERIC(5,2),
    max_marks NUMERIC(5,2),
    assessment_status VARCHAR(30) DEFAULT 'not_submitted',
    -- not_submitted → uploaded → ai_assessed → teacher_reviewed → finalised → returned
    returned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Guardian agent content moderation log
CREATE TABLE guardian_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID,
    user_id UUID REFERENCES users(id),
    institution_id UUID REFERENCES institutions(id),
    trigger_type VARCHAR(40),
    -- 'hallucination', 'off_topic', 'pii_detected', 'inappropriate', 'prompt_injection'
    flagged_content TEXT,
    ai_response_id UUID,
    confidence_score NUMERIC(4,3),
    auto_blocked BOOLEAN DEFAULT FALSE,
    admin_action VARCHAR(30),
    -- 'pending', 'dismissed', 'sent_to_teacher', 'escalated', 'blocked_topic'
    admin_user_id UUID REFERENCES users(id),
    admin_action_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## Indexes for Performance

```sql
-- Verification queue — teachers need fast access to pending items
CREATE INDEX idx_ai_queue_teacher_pending ON ai_answer_queue(teacher_id, status) WHERE status = 'pending';
CREATE INDEX idx_ai_queue_priority ON ai_answer_queue(priority_score DESC) WHERE status = 'pending';

-- Physical submissions — batch processing
CREATE INDEX idx_submissions_assignment ON physical_submissions(assignment_id, assessment_status);
CREATE INDEX idx_submissions_teacher ON physical_submissions(teacher_id, assessment_status);

-- Question bank — fast lookup by concept and difficulty
CREATE INDEX idx_qbank_concept ON question_bank(concept_id, verification_status, difficulty_level);
CREATE INDEX idx_qbank_teacher ON question_bank(teacher_id, verification_status);

-- Guardian log — admin review
CREATE INDEX idx_guardian_pending ON guardian_log(institution_id, admin_action) WHERE admin_action = 'pending';
```
