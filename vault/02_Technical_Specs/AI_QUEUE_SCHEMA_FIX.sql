-- SQL Script to reconcile AI Queue Schema
-- Target: Supabase / PostgreSQL

-- 1. AI Answer Queue (Base table for all AI responses)
CREATE TABLE IF NOT EXISTS ai_answer_queue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id),
    teacher_id UUID REFERENCES users(id),
    course_id UUID REFERENCES courses(id),
    concept_id UUID REFERENCES knowledge_graph_nodes(id),
    
    student_question TEXT NOT NULL,
    ai_generated_answer TEXT,
    ai_confidence NUMERIC(4,3),
    ai_model_used VARCHAR(50),
    safety_score NUMERIC(4,3) DEFAULT 1.0,
    
    status VARCHAR(50) DEFAULT 'pending',  -- 'pending', 'ai_answered', 'approved', 'rejected', 'edited_approved', 'escalated_to_faculty', 'escalated_to_hod'
    request_mode VARCHAR(20) DEFAULT 'NORMAL', -- 'NORMAL', 'PROVISIONAL', 'RESTRICTED'
    
    teacher_edited_answer TEXT,
    teacher_custom_answer TEXT,
    teacher_rejection_reason TEXT,
    teacher_note TEXT,
    teacher_suggestion TEXT,
    faculty_note TEXT,
    
    reviewed_by UUID REFERENCES users(id),
    verified_at TIMESTAMPTZ,
    
    released_to_student BOOLEAN DEFAULT FALSE,
    released_at TIMESTAMPTZ,
    
    added_to_bank BOOLEAN DEFAULT FALSE,
    bank_question_id UUID, -- Placeholder if linking to another bank
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    priority_score INTEGER DEFAULT 0
);

-- 2. AI Answer Decisions (Individual decision traces for analytics)
CREATE TABLE IF NOT EXISTS ai_answer_decisions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    queue_id UUID REFERENCES ai_answer_queue(id),
    status VARCHAR(50) NOT NULL,
    confidence NUMERIC(4,3),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ
);

-- 3. AI Answer Review (Detailed teacher feedback)
CREATE TABLE IF NOT EXISTS ai_answer_review (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    decision_id UUID REFERENCES ai_answer_decisions(id),
    teacher_id UUID REFERENCES users(id),
    comment TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Queue Metrics (Daily aggregated statistics)
CREATE TABLE IF NOT EXISTS queue_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    date DATE UNIQUE NOT NULL,
    auto_approved_count INTEGER DEFAULT 0,
    provisional_count INTEGER DEFAULT 0,
    pending_count INTEGER DEFAULT 0,
    rejected_count INTEGER DEFAULT 0,
    approved_count INTEGER DEFAULT 0,
    avg_response_time_seconds NUMERIC(10,2) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. AI Model Metrics (Model-specific performance tracking)
CREATE TABLE IF NOT EXISTS ai_model_metrics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    model_id VARCHAR(50),
    question_type VARCHAR(50),
    original_confidence NUMERIC(4,3),
    adjusted_confidence NUMERIC(4,3),
    teacher_feedback VARCHAR(20), -- 'approved', 'rejected'
    latency_ms INTEGER,
    token_count INTEGER,
    cost NUMERIC(10,5),
    recorded_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Verified Answers Bank (Knowledge base of clean Q&A)
CREATE TABLE IF NOT EXISTS verified_answers_bank (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    source_queue_id UUID REFERENCES ai_answer_queue(id),
    question_signature TEXT,
    question_text TEXT NOT NULL,
    answer_content TEXT NOT NULL,
    course_id UUID REFERENCES courses(id),
    approved_by UUID REFERENCES users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices for performance
CREATE INDEX IF NOT EXISTS idx_ai_queue_status ON ai_answer_queue(status);
CREATE INDEX IF NOT EXISTS idx_ai_queue_teacher ON ai_answer_queue(teacher_id);
CREATE INDEX IF NOT EXISTS idx_ai_queue_student ON ai_answer_queue(student_id);
CREATE INDEX IF NOT EXISTS idx_ai_decisions_queue ON ai_answer_decisions(queue_id);
CREATE INDEX IF NOT EXISTS idx_metrics_date ON queue_metrics(date);
