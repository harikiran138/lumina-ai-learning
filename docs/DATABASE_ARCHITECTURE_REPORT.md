# Lumina Database Architecture Report

## Overview
The Lumina AI LMS database is built on Supabase (PostgreSQL). It is designed to support a high-degree of personalization through AI agents, tracking detailed learner states, assessment sessions, and automated intervention recommendations.

## Core Entities
Based on `PROJECT_CANVAS.md` and `FEATURES_AND_PHASES.md`, the following core entities are required:

### 1. Identity & Access
- **users**: Primary user storage (students, teachers, admins).

### 2. Learning Management
- **courses**: Instructional content structure.
- **enrollments**: Relationship between students and courses.
- **knowledge_nodes**: Hierarchical structure of topics within a course.

### 3. AI-Driven Personalization (Learner State)
- **learner_profiles**: Rich, JSONB-heavy table storing mastery, goals, and behavioral signals.
- **learning_events**: Audit trail of student activity.
- **student_pathways**: (Planned) AI-generated learning paths.
- **skill_mastery**: (Planned) Atomic skill tracking.

### 4. Adaptive Assessment & Grading
- **assessment_sessions**: Tracking adaptive testing logic and mastery changes.
- **assignment_rubrics**: Structured criteria for AI grading.
- **assignment_submissions**: Student work and AI-extracted text.
- **submission_scorecards**: Detailed AI-generated scoring and rationale.

### 5. Automation & Insights
- **intervention_recommendations**: AI-flagged risks and suggested teacher actions.
- **automation_job_logs**: Tracking background tasks (digests, alerts).

## Data Flow & Relationships
- **Student Activity**: `learning_events` -> `learner_profiles` update.
- **Assessment**: `assessment_sessions` -> `learner_profiles.mastery_state` update.
- **Grading**: `assignment_submissions` + `assignment_rubrics` -> `submission_scorecards`.
- **Intervention**: `learner_profiles` + `learning_events` analysis -> `intervention_recommendations`.

## Missing or To-Be-Verified Schemas
- **student_pathways**: Not yet fully defined in `001_init_schema.sql`.
- **skill_mastery**: Not yet fully defined in `001_init_schema.sql`.
- **quizzes**: General core entity often needed but might be embedded in `assessment_sessions`.

## Recommendation
Integrate `student_pathways` and `skill_mastery` as explicit tables to support Phase 5 (Personalization) requirements.
