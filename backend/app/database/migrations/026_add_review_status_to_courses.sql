-- Migration 026: Add review_status to courses
-- Description: Adds the missing review_status column which is expected by the CourseStore but missing from the schema.

ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS review_status TEXT DEFAULT 'draft';

-- Ensure all mandatory columns have defaults or are handled
COMMENT ON COLUMN public.courses.review_status IS 'Tracks the approval workflow of the course (draft, in_review, approved, rejected)';
