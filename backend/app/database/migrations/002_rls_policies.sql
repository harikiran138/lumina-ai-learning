-- Lumina AI LMS - RLS Policies
-- Version: 1.1.0
-- Description: Comprehensive Row-Level Security policies for core tables complying with FERPA/GDPR.

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
CREATE POLICY "Users can read their own profile" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 2. Courses Policies
CREATE POLICY "Anyone can view published courses" ON courses
    FOR SELECT USING (is_published = TRUE);

CREATE POLICY "Teachers can view all courses" ON courses
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('teacher', 'admin'))
    );

CREATE POLICY "Teachers can manage own courses" ON courses
    USING (auth.uid() = teacher_id);

-- 3. Enrollments Policies
CREATE POLICY "Students can view own enrollments" ON enrollments
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Teachers can view enrollments for their courses" ON enrollments
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = enrollments.course_id AND courses.teacher_id = auth.uid()
        )
    );

-- 4. Learner Profiles Policies
CREATE POLICY "Students can view own profile" ON learner_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view profiles of their enrolled students" ON learner_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM enrollments
            JOIN courses ON enrollments.course_id = courses.id
            WHERE enrollments.student_id = learner_profiles.user_id 
              AND courses.teacher_id = auth.uid()
        )
    );

-- 5. Learning Events Policies
CREATE POLICY "Students can insert own events" ON learning_events
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Students can view own events" ON learning_events
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view events of their enrolled students" ON learning_events
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM enrollments
            JOIN courses ON enrollments.course_id = courses.id
            WHERE enrollments.student_id = learning_events.user_id 
              AND courses.teacher_id = auth.uid()
        )
    );

-- 6. Assessment Sessions Policies
CREATE POLICY "Students can manage own sessions" ON assessment_sessions
    USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view sessions for their courses" ON assessment_sessions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = assessment_sessions.course_id AND courses.teacher_id = auth.uid()
        )
    );

-- 7. Assignment Policies
CREATE POLICY "Anyone can view rubrics" ON assignment_rubrics
    FOR SELECT USING (TRUE);

CREATE POLICY "Students can view own submissions" ON assignment_submissions
    FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "Students can insert own submissions" ON assignment_submissions
    FOR INSERT WITH CHECK (auth.uid() = student_id);

CREATE POLICY "Teachers can manage submissions for their courses" ON assignment_submissions
    USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = assignment_submissions.course_id AND courses.teacher_id = auth.uid()
        )
    );

-- 8. Submission Scorecards
CREATE POLICY "Students can view scorecards for own submissions" ON submission_scorecards
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM assignment_submissions 
            WHERE assignment_submissions.id = submission_scorecards.submission_id 
              AND assignment_submissions.student_id = auth.uid()
        )
    );

CREATE POLICY "Teachers can manage scorecards for their courses" ON submission_scorecards
    USING (
        EXISTS (
            SELECT 1 FROM assignment_submissions
            JOIN courses ON assignment_submissions.course_id = courses.id
            WHERE assignment_submissions.id = submission_scorecards.submission_id 
              AND courses.teacher_id = auth.uid()
        )
    );

-- 9. Intervention Recommendations
CREATE POLICY "Teachers can view and update recommendations for their courses" ON intervention_recommendations
    USING (
        EXISTS (
            SELECT 1 FROM courses 
            WHERE courses.id = intervention_recommendations.course_id AND courses.teacher_id = auth.uid()
        )
    );

-- 10. Automation Job Logs
CREATE POLICY "Only admins and teachers can view job logs" ON automation_job_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM users WHERE users.id = auth.uid() AND users.role IN ('admin', 'teacher'))
    );

-- 11. Knowledge Nodes
CREATE POLICY "Anyone can view knowledge nodes" ON knowledge_nodes
    FOR SELECT USING (TRUE);
