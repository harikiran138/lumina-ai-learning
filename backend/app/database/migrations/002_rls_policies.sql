-- Lumina AI LMS - RLS Policies
-- Version: 1.0.0
-- Description: Basic Row-Level Security policies for core tables.

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE learner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_rubrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_scorecards ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_job_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE knowledge_nodes ENABLE ROW LEVEL SECURITY;

-- 1. Users Policies
-- Users can read their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

-- Admins can view all users (if we have an admin role check)
-- For now, let's keep it simple or allow service role
-- Note: Service role bypasses RLS anyway.

-- 2. Courses Policies
-- Anyone can view published courses
CREATE POLICY "Public can view published courses" ON courses
    FOR SELECT USING (is_published = TRUE);

-- Teachers can view and edit their own courses
CREATE POLICY "Teachers can manage own courses" ON courses
    USING (auth.uid() = teacher_id);

-- 3. Enrollments Policies
-- Users can view their own enrollments
CREATE POLICY "Users can view own enrollments" ON enrollments
    FOR SELECT USING (auth.uid() = student_id);

-- 4. Learner Profiles Policies
CREATE POLICY "Users can view and edit own profile" ON learner_profiles
    USING (auth.uid() = user_id);

-- 5. Learning Events Policies
CREATE POLICY "Users can insert own events" ON learning_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own events" ON learning_events
    FOR SELECT USING (auth.uid() = user_id);

-- 6. Assessment Sessions Policies
CREATE POLICY "Users can manage own assessment sessions" ON assessment_sessions
    USING (auth.uid() = user_id);

-- 7. Assignment Policies
-- Students can view rubrics for courses they are enrolled in
-- For simplification in v1:
CREATE POLICY "Anyone can view rubrics" ON assignment_rubrics
    FOR SELECT USING (TRUE);

-- Students can manage their own submissions
CREATE POLICY "Students can manage own submissions" ON assignment_submissions
    USING (auth.uid() = student_id);

-- 8. Intervention Recommendations
CREATE POLICY "Users can view own recommendations" ON intervention_recommendations
    FOR SELECT USING (auth.uid() = user_id);

-- 9. Knowledge Nodes
CREATE POLICY "Anyone can view knowledge nodes" ON knowledge_nodes
    FOR SELECT USING (TRUE);
