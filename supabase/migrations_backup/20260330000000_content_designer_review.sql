-- =============================================================================
-- Lumina LMS — Content Designer Review Workflow
-- Date: 2026-03-30
-- Description: Adds review states and versioning support to courses
-- =============================================================================

-- ─── 01. Update Courses Table ────────────────────────────────────────────────
-- Add review_status column 
ALTER TABLE courses ADD COLUMN IF NOT EXISTS review_status VARCHAR(20) DEFAULT 'draft';
ALTER TABLE courses ADD CONSTRAINT chk_courses_review_status CHECK (review_status IN ('draft', 'in_review', 'published', 'rejected'));

-- Add designer_notes column
ALTER TABLE courses ADD COLUMN IF NOT EXISTS designer_notes TEXT;

-- Create an index to quickly pull up queues
CREATE INDEX IF NOT EXISTS idx_courses_review_status ON courses(review_status);

-- ─── 02. Course Versions Table ───────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS course_versions (
  id             SERIAL       PRIMARY KEY,
  course_id      UUID         REFERENCES courses(id) ON DELETE CASCADE,
  version_number INT          NOT NULL,
  snapshot_data  JSONB        NOT NULL,
  published_by   UUID         REFERENCES users(id) ON DELETE SET NULL,
  published_at   TIMESTAMPTZ  DEFAULT NOW(),
  UNIQUE(course_id, version_number)
);

CREATE INDEX IF NOT EXISTS idx_course_versions_course ON course_versions(course_id, version_number DESC);
