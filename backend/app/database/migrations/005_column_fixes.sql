-- Lumina AI LMS - Column Discrepancy Fixes (Migration 005)
-- Version: 1.0.0
-- Description: Fixes column-level differences found between local migration files
--              and the actual Supabase schema.

-- FIX 1: quiz_attempts table
-- Local migration (003) defined: is_passed BOOLEAN, answers JSONB, completed_at
-- Supabase actual schema has:    correct_count INT, total_count INT, time_taken_seconds INT, attempted_at
-- Resolution: Drop deprecated columns, add correct ones
ALTER TABLE quiz_attempts
    ADD COLUMN IF NOT EXISTS correct_count INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS total_count INT DEFAULT 0,
    ADD COLUMN IF NOT EXISTS time_taken_seconds INT,
    ADD COLUMN IF NOT EXISTS attempted_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE quiz_attempts DROP COLUMN IF EXISTS is_passed;
ALTER TABLE quiz_attempts DROP COLUMN IF EXISTS answers;
ALTER TABLE quiz_attempts DROP COLUMN IF EXISTS completed_at;

-- Ensure score has a proper default
ALTER TABLE quiz_attempts ALTER COLUMN score SET DEFAULT 0;
