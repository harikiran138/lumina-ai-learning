# Lumina Database Architecture Report

## Overview
Lumina is a self-hosted AI-powered Learning Management System. The core architecture relies on a specialized multi-agent AI swarm, adaptive assessment engines, and automated teaching workflows. The entire state of the system—from user accounts to AI-generated learning pathways—must be persisted securely and reliably in Supabase PostgreSQL, replacing legacy local JSON and other deprecated persistence layers.

## Core Entities & Tables Required

Based on the `PROJECT_CANVAS.md` and `FEATURES_AND_PHASES.md`, the completely unified Supabase database requires the following core tables:

1. **`users`**: Core identity table.
   - Fields: `id` (UUID, PK), `email` (TEXT, UNIQUE), `name` (TEXT), `role` (TEXT: student/teacher/admin), `hashed_password` (TEXT), `created_at` (TIMESTAMPTZ).
2. **`courses`**: Course metadata and curriculum structure.
   - Fields: `id` (UUID, PK), `teacher_id` (UUID, FK->users), `title` (TEXT), `description` (TEXT), `subject` (TEXT), `grade_level` (TEXT), `modules` (JSONB), `is_published` (BOOLEAN), `created_at` (TIMESTAMPTZ).
3. **`enrollments`**: Links students to courses.
   - Fields: `id` (UUID, PK), `student_id` (UUID, FK->users), `course_id` (UUID, FK->courses), `enrolled_at` (TIMESTAMPTZ), `progress` (JSONB).
4. **`learner_profiles`**: The single source of truth for AI personalization (Phase 1 goal).
   - Fields: `user_id` (UUID, PK, FK->users), `role` (TEXT), `grade_level` (TEXT), `goals` (JSONB), `preferences` (JSONB), `mastery_state` (JSONB), `weak_topics` (JSONB), `behavior_signals` (JSONB), `engagement_summary` (JSONB), `performance_summary` (JSONB), `risk_summary` (JSONB), `tutor_summary` (JSONB), `assignment_summary` (JSONB), `assessment_summary` (JSONB), `metadata` (JSONB), `created_at`, `updated_at`.
5. **`learning_events`**: Immutable event log for student actions.
   - Fields: `id` (UUID, PK), `user_id` (UUID, FK->users), `event_type` (TEXT), `source` (TEXT), `course_id` (UUID), `topic_id` (TEXT), `session_id` (TEXT), `payload` (JSONB), `created_at` (TIMESTAMPTZ).
6. **`assessment_sessions`**: Tracks adaptive quiz sessions.
   - Fields: `id` (UUID, PK), `user_id` (UUID, FK->users), `course_id` (UUID), `topic_id` (TEXT), `status` (TEXT), `questions` (JSONB), `answers` (JSONB), `mastery_before` (JSONB), `mastery_after` (JSONB), `report` (JSONB), `created_at`, `completed_at`.
7. **`assignment_submissions`**: Student submissions.
   - Fields: `id` (UUID, PK), `student_id` (UUID, FK->users), `course_id` (UUID, FK->courses), `assignment_id` (TEXT), `file_path` (TEXT), `extracted_text` (TEXT), `grade` (FLOAT), `feedback` (TEXT), `graded_at` (TIMESTAMPTZ), `created_at` (TIMESTAMPTZ).
8. **`assignment_rubrics`**: Grading criteria.
   - Fields: `assignment_id` (TEXT, PK), `title` (TEXT), `criteria` (JSONB), `version` (INT), `metadata` (JSONB), `created_at`, `updated_at`.
9. **`submission_scorecards`**: AI evaluations of submissions.
   - Fields: `submission_id` (UUID, PK, FK->assignment_submissions), `overall_score` (FLOAT), `confidence` (FLOAT), `review_required` (BOOLEAN), `rubric_scores` (JSONB), `rationale` (TEXT), `created_at`, `updated_at`.
10. **`intervention_recommendations`**: AI-generated teacher actions.
    - Fields: `id` (UUID, PK), `user_id` (UUID, FK->users), `course_id` (UUID), `topic_id` (TEXT), `priority` (TEXT), `status` (TEXT), `recommended_action` (TEXT), `reason` (TEXT), `confidence` (FLOAT), `evidence` (JSONB), `created_by` (TEXT), `created_at`, `updated_at`.
11. **`automation_job_logs`**: System task audit trail.
    - Fields: `id` (UUID, PK), `job_name` (TEXT), `triggered_by` (TEXT), `status` (TEXT), `input` (JSONB), `output` (JSONB), `error` (TEXT), `started_at`, `completed_at`.

## Key Relationships (Foreign Keys)
- `courses.teacher_id` -> `users.id`
- `enrollments.student_id` -> `users.id`
- `enrollments.course_id` -> `courses.id`
- `learner_profiles.user_id` -> `users.id`
- `learning_events.user_id` -> `users.id`
- `assessment_sessions.user_id` -> `users.id`
- `assignment_submissions.student_id` -> `users.id`
- `assignment_submissions.course_id` -> `courses.id`
- `submission_scorecards.submission_id` -> `assignment_submissions.id`
- `intervention_recommendations.user_id` -> `users.id`

## Data Flows
1. **Student Progress Pipeline**: `Student Action` -> writes to `learning_events` -> Personalization service aggregates -> updates `learner_profiles`.
2. **AI Tutor Pipeline**: Reads `mastery_state` and `weak_topics` from `learner_profiles` -> generates personalized RAG response.
3. **Assessment Pipeline**: Starts `assessment_sessions` -> processes answers -> updates `mastery_after` -> updates `learner_profiles`.
4. **Grading & Intervention Pipeline**: `assignment_submissions` -> AI grades and generates `submission_scorecards` -> low scores trigger `intervention_recommendations`.

## Missing Schemas Identified
- The database in the new Supabase project (`odyjksznsdeyweylovzl`) currently lacks several of these core tables (e.g., `enrollments`, `learning_events`, `assignment_submissions`), indicating the schema migration was not fully completed.
- The `guardian_notifications` table is mentioned in the architecture but not formally defined in the schema.
- Legacy local JSON stores still exist in the project as a deliberate offline/test fallback; primary persistence should remain the Supabase schema.
