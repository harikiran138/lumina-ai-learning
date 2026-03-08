-- ================================================
-- LUMINA AI LMS — COMPLETE DATABASE SCHEMA
-- Target: Supabase (PostgreSQL 15)
-- Version: 2.0
-- Last Updated: March 2026
-- ================================================
-- This file contains the complete schema for Lumina,
-- including all 35 tables, indexes, triggers, RLS policies,
-- and seed data.
-- ================================================

-- ================================================
-- 1. EXTENSIONS
-- ================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";
CREATE EXTENSION IF NOT EXISTS "pgroonga";

-- ================================================
-- 2. ENUMS
-- ================================================

CREATE TYPE user_role AS ENUM ('student', 'teacher', 'admin', 'parent');
CREATE TYPE submission_status AS ENUM ('draft', 'submitted', 'graded', 'returned');
CREATE TYPE assignment_type AS ENUM ('essay', 'code', 'math', 'mcq', 'file_upload');
CREATE TYPE difficulty_level AS ENUM ('beginner', 'intermediate', 'advanced');
CREATE TYPE notification_type AS ENUM ('assignment_due', 'grade_posted', 'message', 'ai_suggestion', 'intervention', 'achievement', 'deadline_warning', 'study_reminder');
CREATE TYPE behavior_class AS ENUM ('engaged', 'neutral', 'disengaged', 'at_risk');
CREATE TYPE ai_agent_type AS ENUM ('tutor', 'pathway', 'assessment', 'intervention', 'guardian', 'handwriting_agent', 'orchestrator');
CREATE TYPE outcome_status AS ENUM ('success', 'partial', 'failed');
CREATE TYPE attendance_status AS ENUM ('present', 'absent', 'late', 'excused');
CREATE TYPE intervention_reason AS ENUM ('low_mastery', 'inactivity', 'misconception', 'struggle_pattern', 'behavior_change', 'at_risk_prediction');

-- ================================================
-- 3. TABLES (in dependency order)
-- ================================================

-- Table: users
-- Purpose: Core identity table. Stores all user accounts with profile info and permissions.
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  avatar_url TEXT,
  bio TEXT,
  badges JSONB DEFAULT '[]',
  timezone TEXT DEFAULT 'UTC',
  preferences JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP
);

-- Table: sessions (authentication)
-- Purpose: JWT session tokens for web/mobile clients.
CREATE TABLE sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  device_type TEXT NOT NULL CHECK (device_type IN ('web', 'mobile', 'api')),
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMP NOT NULL,
  is_revoked BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- Table: courses
-- Purpose: Course definitions with curriculum structure.
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  subject TEXT NOT NULL,
  difficulty_level difficulty_level DEFAULT 'beginner',
  modules JSONB NOT NULL DEFAULT '[]',
  max_students INTEGER,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Table: progress
-- Purpose: Student enrollment and learning progress in courses.
CREATE TABLE progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  mastery NUMERIC(3,2) DEFAULT 0.0 CHECK (mastery >= 0 AND mastery <= 1),
  completed_lessons JSONB DEFAULT '[]',
  hours_spent NUMERIC(8,2) DEFAULT 0.0,
  current_module_index INTEGER DEFAULT 0,
  current_lesson_index INTEGER DEFAULT 0,
  daily_streak INTEGER DEFAULT 0,
  last_accessed TIMESTAMP,
  started_at TIMESTAMP DEFAULT now(),
  completed_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Table: knowledge_nodes
-- Purpose: Subject knowledge graph nodes (concepts and prerequisites).
CREATE TABLE knowledge_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  concept TEXT NOT NULL,
  subject TEXT NOT NULL,
  difficulty difficulty_level NOT NULL,
  description TEXT,
  prerequisites JSONB DEFAULT '[]',
  learning_outcomes JSONB DEFAULT '[]',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Table: pathway_nodes
-- Purpose: Knowledge graph nodes for learning path sequencing.
CREATE TABLE pathway_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  knowledge_node_id UUID NOT NULL REFERENCES knowledge_nodes(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  prerequisites JSONB DEFAULT '[]',
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Table: student_pathways
-- Purpose: Personalized learning sequence per student.
CREATE TABLE student_pathways (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  pathway_nodes JSONB NOT NULL DEFAULT '[]',
  current_node_index INTEGER DEFAULT 0,
  completion_percentage NUMERIC(3,2) DEFAULT 0.0,
  is_adaptive BOOLEAN DEFAULT true,
  last_updated TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now()
);

-- Table: skill_mastery
-- Purpose: Per-student per-skill mastery state using BKT model.
CREATE TABLE skill_mastery (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  skill_name TEXT NOT NULL,
  knowledge_node_id UUID REFERENCES knowledge_nodes(id) ON DELETE SET NULL,
  mastery_score NUMERIC(3,2) DEFAULT 0.0,
  confidence NUMERIC(3,2) DEFAULT 0.0,
  bkt_p_l0 NUMERIC(3,2) DEFAULT 0.1,
  bkt_p_t NUMERIC(3,2) DEFAULT 0.2,
  bkt_p_g NUMERIC(3,2) DEFAULT 0.1,
  bkt_p_s NUMERIC(3,2) DEFAULT 0.1,
  last_assessed TIMESTAMP,
  assessment_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, course_id, skill_name)
);

-- Table: learner_profiles
-- Purpose: Comprehensive learner profile per student per course.
CREATE TABLE learner_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  mastery_levels JSONB DEFAULT '{}',
  learning_style TEXT,
  strengths JSONB DEFAULT '[]',
  misconceptions JSONB DEFAULT '[]',
  learning_pace TEXT,
  engagement_score NUMERIC(3,2) DEFAULT 0.5,
  last_updated TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Table: assignments
-- Purpose: Homework and assignments created by teachers.
CREATE TABLE assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  title TEXT NOT NULL,
  description TEXT,
  assignment_type assignment_type NOT NULL,
  due_date TIMESTAMP NOT NULL,
  points_possible INTEGER DEFAULT 100,
  rubric JSONB,
  is_published BOOLEAN DEFAULT false,
  auto_grade_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Table: submissions
-- Purpose: Student submissions for assignments.
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES assignments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  file_url TEXT,
  status submission_status DEFAULT 'draft',
  score NUMERIC(5,2),
  max_score INTEGER NOT NULL,
  feedback TEXT,
  is_ai_graded BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP,
  graded_at TIMESTAMP,
  graded_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Table: assessment_sessions
-- Purpose: Quiz/test sessions with responses and mastery tracking.
CREATE TABLE assessment_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL,
  responses JSONB NOT NULL,
  mastery_state JSONB NOT NULL,
  score NUMERIC(5,2) NOT NULL,
  duration_seconds INTEGER,
  completed_at TIMESTAMP DEFAULT now(),
  is_graded BOOLEAN DEFAULT false,
  ai_feedback TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Table: quizzes
-- Purpose: Quiz definitions and configurations.
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  quiz_type TEXT CHECK (quiz_type IN ('formative', 'summative', 'diagnostic')),
  total_questions INTEGER NOT NULL,
  passing_score NUMERIC(3,2) DEFAULT 0.7,
  time_limit_minutes INTEGER,
  questions JSONB NOT NULL DEFAULT '[]',
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Table: quiz_attempts
-- Purpose: Individual quiz attempt records.
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  assessment_session_id UUID REFERENCES assessment_sessions(id) ON DELETE SET NULL,
  score NUMERIC(5,2) NOT NULL,
  correct_count INTEGER NOT NULL,
  total_count INTEGER NOT NULL,
  time_taken_seconds INTEGER,
  attempted_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now()
);

-- Table: question_bank
-- Purpose: Pool of questions for quizzes and assessments.
CREATE TABLE question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  knowledge_node_id UUID REFERENCES knowledge_nodes(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  question_type TEXT CHECK (question_type IN ('mcq', 'essay', 'math', 'code', 'short_answer')),
  difficulty difficulty_level NOT NULL,
  answer_options JSONB,
  correct_answer JSONB NOT NULL,
  explanation TEXT,
  point_value INTEGER DEFAULT 1,
  is_ai_generated BOOLEAN DEFAULT false,
  usage_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT now()
);

-- Table: user_data
-- Purpose: Extended user attributes, quiz history, notes, and analytics.
CREATE TABLE user_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  quiz_attempts JSONB DEFAULT '[]',
  notes JSONB DEFAULT '[]',
  analytics_events JSONB DEFAULT '[]',
  learning_style TEXT,
  motivation_level NUMERIC(3,2) DEFAULT 0.5,
  total_study_hours NUMERIC(10,2) DEFAULT 0.0,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Table: behavior_logs
-- Purpose: Student behavioral patterns (page views, time on task, etc.).
CREATE TABLE behavior_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  session_duration_seconds INTEGER,
  resource_id TEXT,
  timestamp TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now()
);

-- Table: ai_logs
-- Purpose: Audit trail for all AI agent actions.
CREATE TABLE ai_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  agent_type ai_agent_type NOT NULL,
  action TEXT NOT NULL,
  input JSONB,
  output JSONB,
  confidence_score NUMERIC(3,2),
  cost_tokens INTEGER,
  session_id UUID,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  outcome outcome_status DEFAULT 'success',
  error_message TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Table: agent_memory
-- Purpose: Persistent memory for AI agents about students.
CREATE TABLE agent_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agent_type ai_agent_type NOT NULL,
  memory_key TEXT NOT NULL,
  memory_value JSONB NOT NULL,
  confidence NUMERIC(3,2) DEFAULT 0.5,
  last_updated TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Table: conversations
-- Purpose: Chat sessions between student and AI tutor.
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  topic TEXT,
  messages JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  summary TEXT,
  started_at TIMESTAMP DEFAULT now(),
  ended_at TIMESTAMP,
  last_message_at TIMESTAMP DEFAULT now(),
  created_at TIMESTAMP DEFAULT now()
);

-- Table: community_messages
-- Purpose: Student posts in course forums and study groups.
CREATE TABLE community_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  author_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  study_group_id UUID,
  thread_id UUID REFERENCES community_messages(id) ON DELETE CASCADE,
  subject TEXT,
  content TEXT NOT NULL,
  likes_count INTEGER DEFAULT 0,
  replies_count INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now(),
  deleted_at TIMESTAMP
);

-- Table: study_groups
-- Purpose: Peer learning groups.
CREATE TABLE study_groups (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  creator_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  name TEXT NOT NULL,
  description TEXT,
  max_members INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);

-- Table: study_group_members
-- Purpose: Membership in study groups.
CREATE TABLE study_group_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  study_group_id UUID NOT NULL REFERENCES study_groups(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role TEXT DEFAULT 'member' CHECK (role IN ('member', 'moderator', 'leader')),
  joined_at TIMESTAMP DEFAULT now(),
  UNIQUE(study_group_id, user_id)
);

-- Table: parent_guardian
-- Purpose: Parent accounts linked to students.
CREATE TABLE parent_guardian (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  relationship TEXT,
  can_view_grades BOOLEAN DEFAULT true,
  can_view_progress BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT now()
);

-- Table: attendance
-- Purpose: Class/session attendance tracking.
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  session_date DATE NOT NULL,
  status attendance_status NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, course_id, session_date)
);

-- Table: intervention_logs
-- Purpose: When and why teacher or AI intervened for a student.
CREATE TABLE intervention_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  intervener_user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  intervention_type intervention_reason NOT NULL,
  description TEXT,
  action_taken TEXT,
  was_effective BOOLEAN,
  created_at TIMESTAMP DEFAULT now()
);

-- Table: notifications
-- Purpose: Push/email notifications sent to users.
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  related_id UUID,
  is_read BOOLEAN DEFAULT false,
  is_sent BOOLEAN DEFAULT false,
  delivery_method TEXT DEFAULT 'in_app' CHECK (delivery_method IN ('in_app', 'email', 'push', 'sms')),
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Table: ppt_generations
-- Purpose: Log of generated presentations (topic, file path, created by).
CREATE TABLE ppt_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  created_by_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  topic TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_url TEXT,
  slides_count INTEGER,
  generation_time_seconds INTEGER,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);

-- Table: feedback
-- Purpose: Student feedback on lessons and AI tutor.
CREATE TABLE feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  related_type TEXT CHECK (related_type IN ('lesson', 'assignment', 'quiz', 'tutor', 'course')),
  related_id UUID,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP DEFAULT now()
);

-- Table: leaderboard_entries
-- Purpose: Weekly/monthly leaderboard scores.
CREATE TABLE leaderboard_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  score NUMERIC(8,2) NOT NULL,
  rank INTEGER,
  period TEXT DEFAULT 'weekly' CHECK (period IN ('daily', 'weekly', 'monthly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  created_at TIMESTAMP DEFAULT now()
);

-- Table: teacher_stats
-- Purpose: Aggregated statistics for teachers about their courses.
CREATE TABLE teacher_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  total_students INTEGER DEFAULT 0,
  avg_mastery NUMERIC(3,2) DEFAULT 0.0,
  avg_engagement NUMERIC(3,2) DEFAULT 0.0,
  at_risk_count INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(teacher_id, course_id)
);

-- Table: student_stats
-- Purpose: Aggregated statistics for students.
CREATE TABLE student_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  total_points INTEGER DEFAULT 0,
  avg_score NUMERIC(5,2) DEFAULT 0.0,
  completion_percentage NUMERIC(3,2) DEFAULT 0.0,
  streak INTEGER DEFAULT 0,
  updated_at TIMESTAMP DEFAULT now(),
  UNIQUE(user_id, course_id)
);

-- Table: analytics_events
-- Purpose: Aggregated analytics for course and platform analytics.
CREATE TABLE analytics_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  course_id UUID REFERENCES courses(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMP DEFAULT now()
);

-- Table: tutor_sessions
-- Purpose: AI tutor session metadata and summaries.
CREATE TABLE tutor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  conversation_id UUID REFERENCES conversations(id) ON DELETE SET NULL,
  topic TEXT,
  duration_seconds INTEGER,
  message_count INTEGER DEFAULT 0,
  student_satisfaction INTEGER CHECK (student_satisfaction >= 1 AND student_satisfaction <= 5),
  ai_confidence NUMERIC(3,2),
  is_completed BOOLEAN DEFAULT false,
  ended_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT now()
);

-- Table: certificates
-- Purpose: Issued certifications when students complete courses.
CREATE TABLE certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  issue_date TIMESTAMP DEFAULT now(),
  expires_at TIMESTAMP,
  certificate_url TEXT,
  verification_code TEXT UNIQUE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT now()
);

-- ================================================
-- 4. INDEXES
-- ================================================

-- users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_is_active ON users(is_active);
CREATE INDEX idx_users_created_at ON users(created_at);

-- sessions
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_expires_at ON sessions(expires_at);
CREATE INDEX idx_sessions_is_revoked ON sessions(is_revoked);

-- courses
CREATE INDEX idx_courses_teacher_id ON courses(teacher_id);
CREATE INDEX idx_courses_subject ON courses(subject);
CREATE INDEX idx_courses_is_published ON courses(is_published);
CREATE INDEX idx_courses_code ON courses(code);

-- progress
CREATE INDEX idx_progress_user_id ON progress(user_id);
CREATE INDEX idx_progress_course_id ON progress(course_id);
CREATE INDEX idx_progress_mastery ON progress(mastery);
CREATE INDEX idx_progress_last_accessed ON progress(last_accessed);
CREATE INDEX idx_progress_user_course ON progress(user_id, course_id);

-- knowledge_nodes
CREATE INDEX idx_knowledge_nodes_course_id ON knowledge_nodes(course_id);
CREATE INDEX idx_knowledge_nodes_subject ON knowledge_nodes(subject);

-- pathway_nodes
CREATE INDEX idx_pathway_nodes_course_id ON pathway_nodes(course_id);
CREATE INDEX idx_pathway_nodes_knowledge_node_id ON pathway_nodes(knowledge_node_id);

-- student_pathways
CREATE INDEX idx_student_pathways_user_id ON student_pathways(user_id);
CREATE INDEX idx_student_pathways_course_id ON student_pathways(course_id);

-- skill_mastery
CREATE INDEX idx_skill_mastery_user_id ON skill_mastery(user_id);
CREATE INDEX idx_skill_mastery_course_id ON skill_mastery(course_id);
CREATE INDEX idx_skill_mastery_user_course ON skill_mastery(user_id, course_id);

-- learner_profiles
CREATE INDEX idx_learner_profiles_user_id ON learner_profiles(user_id);
CREATE INDEX idx_learner_profiles_course_id ON learner_profiles(course_id);
CREATE INDEX idx_learner_profiles_engagement ON learner_profiles(engagement_score);

-- assignments
CREATE INDEX idx_assignments_course_id ON assignments(course_id);
CREATE INDEX idx_assignments_creator_id ON assignments(creator_id);
CREATE INDEX idx_assignments_due_date ON assignments(due_date);
CREATE INDEX idx_assignments_is_published ON assignments(is_published);

-- submissions
CREATE INDEX idx_submissions_user_id ON submissions(user_id);
CREATE INDEX idx_submissions_assignment_id ON submissions(assignment_id);
CREATE INDEX idx_submissions_course_id ON submissions(course_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);

-- assessment_sessions
CREATE INDEX idx_assessment_sessions_user_id ON assessment_sessions(user_id);
CREATE INDEX idx_assessment_sessions_course_id ON assessment_sessions(course_id);
CREATE INDEX idx_assessment_sessions_quiz_id ON assessment_sessions(quiz_id);
CREATE INDEX idx_assessment_sessions_completed_at ON assessment_sessions(completed_at);
CREATE INDEX idx_assessment_sessions_is_graded ON assessment_sessions(is_graded);

-- quizzes
CREATE INDEX idx_quizzes_course_id ON quizzes(course_id);
CREATE INDEX idx_quizzes_is_published ON quizzes(is_published);

-- quiz_attempts
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_quiz_attempts_quiz_id ON quiz_attempts(quiz_id);
CREATE INDEX idx_quiz_attempts_attempted_at ON quiz_attempts(attempted_at);

-- question_bank
CREATE INDEX idx_question_bank_course_id ON question_bank(course_id);
CREATE INDEX idx_question_bank_knowledge_node_id ON question_bank(knowledge_node_id);
CREATE INDEX idx_question_bank_difficulty ON question_bank(difficulty);

-- user_data
CREATE INDEX idx_user_data_user_id ON user_data(user_id);

-- behavior_logs
CREATE INDEX idx_behavior_logs_user_id ON behavior_logs(user_id);
CREATE INDEX idx_behavior_logs_course_id ON behavior_logs(course_id);
CREATE INDEX idx_behavior_logs_event_type ON behavior_logs(event_type);
CREATE INDEX idx_behavior_logs_timestamp ON behavior_logs(timestamp);

-- ai_logs
CREATE INDEX idx_ai_logs_user_id ON ai_logs(user_id);
CREATE INDEX idx_ai_logs_agent_type ON ai_logs(agent_type);
CREATE INDEX idx_ai_logs_action ON ai_logs(action);
CREATE INDEX idx_ai_logs_created_at ON ai_logs(created_at);
CREATE INDEX idx_ai_logs_outcome ON ai_logs(outcome);

-- agent_memory
CREATE INDEX idx_agent_memory_user_id ON agent_memory(user_id);
CREATE INDEX idx_agent_memory_agent_type ON agent_memory(agent_type);
CREATE INDEX idx_agent_memory_memory_key ON agent_memory(memory_key);
CREATE INDEX idx_agent_memory_expires_at ON agent_memory(expires_at);

-- conversations
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_course_id ON conversations(course_id);
CREATE INDEX idx_conversations_is_active ON conversations(is_active);
CREATE INDEX idx_conversations_last_message_at ON conversations(last_message_at);

-- community_messages
CREATE INDEX idx_community_messages_author_id ON community_messages(author_id);
CREATE INDEX idx_community_messages_course_id ON community_messages(course_id);
CREATE INDEX idx_community_messages_study_group_id ON community_messages(study_group_id);
CREATE INDEX idx_community_messages_thread_id ON community_messages(thread_id);
CREATE INDEX idx_community_messages_created_at ON community_messages(created_at);

-- study_groups
CREATE INDEX idx_study_groups_course_id ON study_groups(course_id);
CREATE INDEX idx_study_groups_creator_id ON study_groups(creator_id);

-- study_group_members
CREATE INDEX idx_study_group_members_study_group_id ON study_group_members(study_group_id);
CREATE INDEX idx_study_group_members_user_id ON study_group_members(user_id);

-- parent_guardian
CREATE INDEX idx_parent_guardian_parent_user_id ON parent_guardian(parent_user_id);
CREATE INDEX idx_parent_guardian_student_user_id ON parent_guardian(student_user_id);

-- attendance
CREATE INDEX idx_attendance_user_id ON attendance(user_id);
CREATE INDEX idx_attendance_course_id ON attendance(course_id);
CREATE INDEX idx_attendance_session_date ON attendance(session_date);

-- intervention_logs
CREATE INDEX idx_intervention_logs_student_user_id ON intervention_logs(student_user_id);
CREATE INDEX idx_intervention_logs_course_id ON intervention_logs(course_id);
CREATE INDEX idx_intervention_logs_created_at ON intervention_logs(created_at);

-- notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);
CREATE INDEX idx_notifications_is_sent ON notifications(is_sent);
CREATE INDEX idx_notifications_created_at ON notifications(created_at);

-- ppt_generations
CREATE INDEX idx_ppt_generations_course_id ON ppt_generations(course_id);
CREATE INDEX idx_ppt_generations_created_by_id ON ppt_generations(created_by_id);

-- feedback
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_course_id ON feedback(course_id);
CREATE INDEX idx_feedback_related_type ON feedback(related_type);

-- leaderboard_entries
CREATE INDEX idx_leaderboard_entries_user_id ON leaderboard_entries(user_id);
CREATE INDEX idx_leaderboard_entries_course_id ON leaderboard_entries(course_id);
CREATE INDEX idx_leaderboard_entries_period ON leaderboard_entries(period);

-- teacher_stats
CREATE INDEX idx_teacher_stats_teacher_id ON teacher_stats(teacher_id);
CREATE INDEX idx_teacher_stats_course_id ON teacher_stats(course_id);

-- student_stats
CREATE INDEX idx_student_stats_user_id ON student_stats(user_id);
CREATE INDEX idx_student_stats_course_id ON student_stats(course_id);

-- analytics_events
CREATE INDEX idx_analytics_events_user_id ON analytics_events(user_id);
CREATE INDEX idx_analytics_events_course_id ON analytics_events(course_id);
CREATE INDEX idx_analytics_events_event_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

-- tutor_sessions
CREATE INDEX idx_tutor_sessions_user_id ON tutor_sessions(user_id);
CREATE INDEX idx_tutor_sessions_course_id ON tutor_sessions(course_id);
CREATE INDEX idx_tutor_sessions_created_at ON tutor_sessions(created_at);

-- certificates
CREATE INDEX idx_certificates_user_id ON certificates(user_id);
CREATE INDEX idx_certificates_course_id ON certificates(course_id);
CREATE INDEX idx_certificates_verification_code ON certificates(verification_code);

-- ================================================
-- 5. TRIGGERS (Auto-update updated_at column)
-- ================================================

CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_courses_updated_at BEFORE UPDATE ON courses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_progress_updated_at BEFORE UPDATE ON progress
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_assignments_updated_at BEFORE UPDATE ON assignments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_submissions_updated_at BEFORE UPDATE ON submissions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_quizzes_updated_at BEFORE UPDATE ON quizzes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_learner_profiles_updated_at BEFORE UPDATE ON learner_profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_community_messages_updated_at BEFORE UPDATE ON community_messages
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_user_data_updated_at BEFORE UPDATE ON user_data
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_agent_memory_updated_at BEFORE UPDATE ON agent_memory
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_conversations_updated_at BEFORE UPDATE ON conversations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_study_groups_updated_at BEFORE UPDATE ON study_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_skill_mastery_updated_at BEFORE UPDATE ON skill_mastery
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ================================================
-- 6. ROW LEVEL SECURITY (RLS)
-- ================================================

-- Enable RLS on sensitive tables
ALTER TABLE progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learner_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE behavior_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE agent_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE intervention_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE parent_guardian ENABLE ROW LEVEL SECURITY;

-- RLS Policies for progress
-- Students can only see their own progress
CREATE POLICY "students_own_progress" ON progress
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Teachers can see progress of students in their courses
CREATE POLICY "teachers_see_enrolled_progress" ON progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = progress.course_id
      AND c.teacher_id = auth.uid()
    )
  );

-- Admins see all progress
CREATE POLICY "admins_see_all_progress" ON progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = auth.uid()
      AND u.role = 'admin'
    )
  );

-- RLS Policies for submissions
CREATE POLICY "students_own_submissions" ON submissions
  FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "teachers_see_student_submissions" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = submissions.course_id
      AND c.teacher_id = auth.uid()
    )
  );

-- RLS Policies for assessment_sessions
CREATE POLICY "students_own_assessments" ON assessment_sessions
  FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "teachers_see_student_assessments" ON assessment_sessions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = assessment_sessions.course_id
      AND c.teacher_id = auth.uid()
    )
  );

-- RLS Policies for conversations
CREATE POLICY "students_own_conversations" ON conversations
  FOR ALL USING (auth.uid()::text = user_id::text);

CREATE POLICY "teachers_see_course_conversations" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM courses c
      WHERE c.id = conversations.course_id
      AND c.teacher_id = auth.uid()
    )
  );

-- RLS Policies for notifications
CREATE POLICY "users_own_notifications" ON notifications
  FOR ALL USING (auth.uid()::text = user_id::text);

-- RLS Policies for parent access to student data
CREATE POLICY "parents_see_child_progress" ON progress
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM parent_guardian pg
      WHERE pg.parent_user_id = auth.uid()
      AND pg.student_user_id = progress.user_id
      AND pg.can_view_progress = true
    )
  );

-- ================================================
-- 7. VIEWS
-- ================================================

-- View: Student Dashboard Summary
CREATE VIEW student_dashboard AS
SELECT
  u.id,
  u.name,
  u.email,
  COUNT(DISTINCT p.id) as enrolled_courses,
  ROUND(AVG(p.mastery)::numeric, 2) as avg_mastery,
  ROUND(SUM(p.hours_spent)::numeric, 1) as total_hours,
  MAX(p.last_accessed) as last_activity
FROM users u
LEFT JOIN progress p ON u.id = p.user_id
WHERE u.role = 'student' AND u.deleted_at IS NULL
GROUP BY u.id, u.name, u.email;

-- View: Teacher Class Analytics
CREATE VIEW teacher_class_analytics AS
SELECT
  c.id,
  c.name,
  c.code,
  u.name as teacher_name,
  COUNT(DISTINCT p.user_id) as enrolled_count,
  ROUND(AVG(p.mastery)::numeric, 2) as avg_mastery,
  COUNT(CASE WHEN p.mastery < 0.4 THEN 1 END) as at_risk_count
FROM courses c
JOIN users u ON c.teacher_id = u.id
LEFT JOIN progress p ON c.id = p.course_id
WHERE u.deleted_at IS NULL
GROUP BY c.id, c.name, c.code, u.name;

-- View: At-Risk Students
CREATE VIEW at_risk_students AS
SELECT
  p.user_id,
  u.name,
  u.email,
  p.course_id,
  c.name as course_name,
  p.mastery,
  p.last_accessed,
  CASE
    WHEN p.mastery < 0.4 THEN 'low_mastery'
    WHEN p.last_accessed < now() - interval '7 days' THEN 'inactive'
    ELSE 'at_risk'
  END as risk_type
FROM progress p
JOIN users u ON p.user_id = u.id
JOIN courses c ON p.course_id = c.id
WHERE (p.mastery < 0.4 OR p.last_accessed < now() - interval '7 days')
AND u.is_active = true;

-- View: Course Leaderboard
CREATE VIEW course_leaderboard AS
SELECT
  u.id,
  u.name,
  u.avatar_url,
  p.course_id,
  ROUND(p.mastery::numeric, 2) as mastery_score,
  p.hours_spent,
  p.daily_streak,
  ROW_NUMBER() OVER (PARTITION BY p.course_id ORDER BY p.mastery DESC) as rank
FROM progress p
JOIN users u ON p.user_id = u.id
WHERE p.mastery > 0
ORDER BY p.course_id, p.mastery DESC;

-- View: Teacher Intervention Recommendations
CREATE VIEW teacher_intervention_recommendations AS
SELECT
  p.user_id,
  u.name,
  u.email,
  p.course_id,
  c.name as course_name,
  p.mastery,
  COUNT(il.id) as recent_interventions,
  STRING_AGG(DISTINCT il.intervention_type::text, ', ') as intervention_types
FROM progress p
JOIN users u ON p.user_id = u.id
JOIN courses c ON p.course_id = c.id
LEFT JOIN intervention_logs il ON p.user_id = il.student_user_id
  AND p.course_id = il.course_id
  AND il.created_at > now() - interval '30 days'
WHERE p.mastery < 0.6
GROUP BY p.user_id, u.name, u.email, p.course_id, c.name, p.mastery;

-- ================================================
-- 8. FUNCTIONS
-- ================================================

-- Function: Calculate overall student score in a course
CREATE OR REPLACE FUNCTION calculate_student_score(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS TABLE(
  user_id UUID,
  course_id UUID,
  quiz_score NUMERIC,
  assignment_score NUMERIC,
  overall_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p_user_id,
    p_course_id,
    ROUND(COALESCE(AVG(CASE WHEN qa.user_id = p_user_id THEN qa.score ELSE NULL END), 0)::numeric, 2) as quiz_score,
    ROUND(COALESCE(AVG(CASE WHEN s.user_id = p_user_id THEN s.score ELSE NULL END), 0)::numeric, 2) as assignment_score,
    ROUND(
      (COALESCE(AVG(CASE WHEN qa.user_id = p_user_id THEN qa.score ELSE NULL END), 0) * 0.4 +
       COALESCE(AVG(CASE WHEN s.user_id = p_user_id THEN s.score ELSE NULL END), 0) * 0.6)::numeric,
      2
    ) as overall_score
  FROM quiz_attempts qa
  FULL OUTER JOIN submissions s ON s.user_id = p_user_id AND s.course_id = p_course_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Get next recommended lesson for student
CREATE OR REPLACE FUNCTION get_next_lesson(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS TABLE(
  lesson_id TEXT,
  lesson_title TEXT,
  module_index INTEGER,
  lesson_index INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (c.modules -> (p.current_module_index)::int -> 'lessons' -> (p.current_lesson_index)::int ->> 'id') as lesson_id,
    (c.modules -> (p.current_module_index)::int -> 'lessons' -> (p.current_lesson_index)::int ->> 'title') as lesson_title,
    p.current_module_index,
    p.current_lesson_index
  FROM progress p
  JOIN courses c ON p.course_id = c.id
  WHERE p.user_id = p_user_id AND p.course_id = p_course_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Update daily streak
CREATE OR REPLACE FUNCTION update_daily_streak(
  p_user_id UUID,
  p_course_id UUID
)
RETURNS void AS $$
DECLARE
  v_last_accessed TIMESTAMP;
  v_new_streak INTEGER;
BEGIN
  SELECT last_accessed INTO v_last_accessed
  FROM progress
  WHERE user_id = p_user_id AND course_id = p_course_id;

  IF v_last_accessed IS NULL OR v_last_accessed::date < CURRENT_DATE THEN
    v_new_streak := 1;
  ELSE
    SELECT daily_streak INTO v_new_streak
    FROM progress
    WHERE user_id = p_user_id AND course_id = p_course_id;
    v_new_streak := COALESCE(v_new_streak, 0) + 1;
  END IF;

  UPDATE progress
  SET daily_streak = v_new_streak,
      last_accessed = now(),
      updated_at = now()
  WHERE user_id = p_user_id AND course_id = p_course_id;
END;
$$ LANGUAGE plpgsql;

-- Function: Detect at-risk students
CREATE OR REPLACE FUNCTION detect_at_risk_students(p_course_id UUID)
RETURNS TABLE(
  user_id UUID,
  name TEXT,
  email TEXT,
  mastery NUMERIC,
  days_inactive INTEGER,
  risk_score NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id,
    u.name,
    u.email,
    p.mastery,
    EXTRACT(DAY FROM (now() - p.last_accessed))::INTEGER as days_inactive,
    ROUND(
      (CASE WHEN p.mastery < 0.3 THEN 0.5 ELSE p.mastery END) *
      (1 - (EXTRACT(DAY FROM (now() - p.last_accessed)) / 30.0))::numeric,
      2
    ) as risk_score
  FROM progress p
  JOIN users u ON p.user_id = u.id
  WHERE p.course_id = p_course_id
  AND (p.mastery < 0.4 OR EXTRACT(DAY FROM (now() - p.last_accessed)) > 7)
  ORDER BY risk_score DESC;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 9. SEED DATA
-- ================================================

-- Seed Admin User
INSERT INTO users (email, password_hash, name, role)
VALUES (
  'admin@lumina.ai',
  '$2b$12$abcdefghijklmnopqrstuvwxyz123456789', -- bcrypt hash placeholder
  'Lumina Administrator',
  'admin'
);

-- Seed Teacher Users
INSERT INTO users (email, password_hash, name, role, timezone)
VALUES
('teacher1@lumina.ai', '$2b$12$abcdefghijklmnopqrstuvwxyz123456789', 'Dr. Sarah Chen', 'teacher', 'America/New_York'),
('teacher2@lumina.ai', '$2b$12$abcdefghijklmnopqrstuvwxyz123456789', 'Prof. James Wilson', 'teacher', 'America/Los_Angeles');

-- Seed Student Users
INSERT INTO users (email, password_hash, name, role, timezone, preferences)
VALUES
('student1@lumina.ai', '$2b$12$abcdefghijklmnopqrstuvwxyz123456789', 'Alice Johnson', 'student', 'America/Chicago', '{"theme": "dark", "email_notifications": true}'),
('student2@lumina.ai', '$2b$12$abcdefghijklmnopqrstuvwxyz123456789', 'Bob Martinez', 'student', 'America/Denver', '{"theme": "light", "email_notifications": false}'),
('student3@lumina.ai', '$2b$12$abcdefghijklmnopqrstuvwxyz123456789', 'Carol Lee', 'student', 'America/New_York', '{"theme": "light", "email_notifications": true}'),
('student4@lumina.ai', '$2b$12$abcdefghijklmnopqrstuvwxyz123456789', 'David Patel', 'student', 'America/Chicago', '{"theme": "dark", "email_notifications": true}');

-- Seed Courses
INSERT INTO courses (code, name, description, teacher_id, subject, difficulty_level, is_published, modules)
SELECT
  'MATH101',
  'Calculus I: Limits and Derivatives',
  'Introduction to calculus focusing on limits and derivatives',
  u1.id,
  'mathematics',
  'beginner',
  true,
  '[{"id": "mod-001", "title": "Foundations of Limits", "order": 1, "lessons": [{"id": "les-001", "title": "What are Limits?", "type": "text", "duration_minutes": 15}]}]'::jsonb
FROM users u1 WHERE u1.email = 'teacher1@lumina.ai'
UNION ALL
SELECT
  'PHYS101',
  'Physics I: Classical Mechanics',
  'Fundamentals of classical mechanics',
  u2.id,
  'physics',
  'intermediate',
  true,
  '[{"id": "mod-001", "title": "Kinematics", "order": 1, "lessons": []}]'::jsonb
FROM users u2 WHERE u2.email = 'teacher2@lumina.ai'
UNION ALL
SELECT
  'CS101',
  'Introduction to Computer Science',
  'Programming basics and computer science fundamentals',
  u1.id,
  'computer_science',
  'beginner',
  true,
  '[{"id": "mod-001", "title": "Programming Basics", "order": 1, "lessons": []}]'::jsonb
FROM users u1 WHERE u1.email = 'teacher1@lumina.ai'
UNION ALL
SELECT
  'AI202',
  'Applied AI and Machine Learning',
  'Advanced machine learning and AI applications',
  u2.id,
  'computer_science',
  'advanced',
  false,
  '[{"id": "mod-001", "title": "Neural Networks", "order": 1, "lessons": []}]'::jsonb
FROM users u2 WHERE u2.email = 'teacher2@lumina.ai';

-- Seed Progress Records (Students enrolled in courses)
INSERT INTO progress (user_id, course_id, mastery, hours_spent, daily_streak, last_accessed)
SELECT
  u.id, c.id, 0.75, 24.5, 7, now() - interval '2 hours'
FROM users u
CROSS JOIN courses c
WHERE u.email IN ('student1@lumina.ai', 'student2@lumina.ai', 'student3@lumina.ai')
AND c.code IN ('MATH101', 'CS101')
AND NOT EXISTS (SELECT 1 FROM progress p WHERE p.user_id = u.id AND p.course_id = c.id);

-- Seed Knowledge Nodes
INSERT INTO knowledge_nodes (course_id, concept, subject, difficulty, description)
SELECT
  c.id,
  'derivatives',
  'mathematics',
  'intermediate',
  'Rate of change and derivative calculations'
FROM courses c WHERE c.code = 'MATH101'
UNION ALL
SELECT
  c.id,
  'integrals',
  'mathematics',
  'advanced',
  'Integration and antiderivatives'
FROM courses c WHERE c.code = 'MATH101'
UNION ALL
SELECT
  c.id,
  'python_basics',
  'computer_science',
  'beginner',
  'Python syntax and basic programming'
FROM courses c WHERE c.code = 'CS101';

-- ================================================
-- END OF SCHEMA
-- ================================================
