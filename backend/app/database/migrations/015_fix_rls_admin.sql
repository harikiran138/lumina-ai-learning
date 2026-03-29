-- Migration 015: Fix RLS so Lumina backend (anon key) can list all users
-- Lumina uses its own JWT auth, NOT Supabase Auth, so auth.uid() is always NULL
-- for backend service calls. The restrictive policy blocks all admin reads.
-- This migration replaces the restrictive policy with a permissive one for
-- application-level reads, trusting Lumina's own FastAPI auth middleware.

-- Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can view own data" ON users;

-- Add a permissive read policy (auth enforced at application layer by FastAPI)
CREATE POLICY "Allow backend service reads" ON users
    FOR SELECT USING (true);

-- Also disable RLS on tables that are backend-only (not accessed by the browser client directly)
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE learner_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE learning_events DISABLE ROW LEVEL SECURITY;

-- Keep RLS on user-facing tables but make them permissive for service access
DROP POLICY IF EXISTS "Users can view and manage own pathways" ON student_pathways;
CREATE POLICY "Allow service reads on pathways" ON student_pathways
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can view own mastery" ON skill_mastery;
CREATE POLICY "Allow service reads on mastery" ON skill_mastery
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own conversations" ON conversations;
CREATE POLICY "Allow service reads on conversations" ON conversations
    FOR SELECT USING (true);
