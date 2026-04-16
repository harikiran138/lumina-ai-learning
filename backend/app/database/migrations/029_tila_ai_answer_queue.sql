-- Migration 029: TILA — Teacher-Initiated LLM Approval queue
-- Lumina AI LMS — Section D2
-- No AI-generated content reaches students without an explicit faculty APPROVE action.

CREATE TABLE IF NOT EXISTS ai_answer_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id),  -- HARD RULE: always institution-scoped
  student_id UUID NOT NULL REFERENCES users(id),
  course_id UUID REFERENCES courses(id),
  question_text TEXT NOT NULL,
  ai_generated_answer TEXT NOT NULL,
  ai_model_used TEXT NOT NULL,           -- e.g. 'claude-opus-4-6', 'gemini-2.0-flash'
  ai_confidence FLOAT CHECK (ai_confidence BETWEEN 0.0 AND 1.0),
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED', 'MODIFIED_APPROVED')),
  reviewed_by UUID REFERENCES users(id),     -- teacher who approved/rejected
  teacher_modification TEXT,                 -- edited AI answer before approving
  teacher_feedback TEXT,                     -- feedback sent to student on rejection
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  delivered_at TIMESTAMPTZ,                  -- when student actually saw the answer

  CONSTRAINT institution_student_match CHECK (
    institution_id = (SELECT institution_id FROM users WHERE id = student_id)
  )
);

ALTER TABLE ai_answer_queue ENABLE ROW LEVEL SECURITY;

-- Teachers see only their institution's pending items
DROP POLICY IF EXISTS "Teachers see their institution AI queue" ON ai_answer_queue;
CREATE POLICY "Teachers see their institution AI queue" ON ai_answer_queue
  FOR SELECT
  USING (
    institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid())
        IN ('teacher', 'supervisor', 'hod', 'admin', 'college_admin',
            'institution_admin', 'system_admin', 'super_admin')
  );

-- Students only see APPROVED answers addressed to them
DROP POLICY IF EXISTS "Students see only their approved answers" ON ai_answer_queue;
CREATE POLICY "Students see only their approved answers" ON ai_answer_queue
  FOR SELECT
  USING (
    student_id = auth.uid()
    AND status IN ('APPROVED', 'MODIFIED_APPROVED')
  );

-- Only teachers can UPDATE status (approve/reject)
DROP POLICY IF EXISTS "Teachers can approve or reject AI answers" ON ai_answer_queue;
CREATE POLICY "Teachers can approve or reject AI answers" ON ai_answer_queue
  FOR UPDATE
  USING (
    institution_id = (SELECT institution_id FROM users WHERE id = auth.uid())
    AND (SELECT role FROM users WHERE id = auth.uid())
        IN ('teacher', 'supervisor', 'hod', 'admin', 'college_admin',
            'institution_admin', 'system_admin', 'super_admin')
  )
  WITH CHECK (
    status IN ('APPROVED', 'REJECTED', 'MODIFIED_APPROVED')
    AND reviewed_by = auth.uid()
    AND reviewed_at IS NOT NULL
  );

-- Indexes for common queries
CREATE INDEX IF NOT EXISTS idx_ai_answer_queue_institution_status
  ON ai_answer_queue (institution_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_answer_queue_student
  ON ai_answer_queue (student_id, status);

CREATE INDEX IF NOT EXISTS idx_ai_answer_queue_pending
  ON ai_answer_queue (institution_id, created_at DESC)
  WHERE status = 'PENDING';
