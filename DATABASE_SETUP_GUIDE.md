# Lumina Database Setup Guide

**Primary Database:** Supabase PostgreSQL

## 1. Required Tables

The Lumina system requires the following core tables to be present in your Supabase project:

- `users` — Stores all students, teachers, and admins.
- `courses` — Stores course metadata, modules, and lessons.
- `enrollments` — Maps students to the courses they are taking.
- `learner_profiles` — The unified single source of truth for learner mastery, behavior, and KPIs.
- `learning_events` — Immutable log of all student interactions (lessons, quizzes, tutor).
- `assessment_sessions` — Tracks adaptive quiz sessions and outcomes.
- `assignment_submissions` — Stores metadata about uploaded assignments and extracted text.
- `assignment_rubrics` — Structured grading rubrics used by the AI evaluator.
- `submission_scorecards` — Detailed AI grading output including dimension scores and confidence.
- `intervention_recommendations` — AI-generated actionable alerts for teachers based on risk signals.
- `automation_job_logs` — Audit log of recurring background jobs (e.g., digests, remediation plans).
- `knowledge_nodes` — Concept graph elements used by assessment and pathway engines.

## 2. SQL Migration Scripts

All required database schema definitions and migrations are stored in the backend repository. 

To initialize the database, execute these scripts in the Supabase SQL Editor in order:

1. **`backend/app/database/migrations/001_init_schema.sql`**  
   Creates all required tables, foreign key constraints, and default indexes.

2. **`backend/app/database/sql/001_personal_lms_foundation.sql`**  
   Updates any legacy schema structures and ensures full compatibility with the Phase 1 Learner Profile and Intervention systems.

3. **`backend/app/database/migrations/002_rls_policies.sql`**  
   Applies basic Row-Level Security (RLS) policies. *(Note: Review and expand these policies before production deployment to ensure full FERPA/GDPR compliance).*

## 3. Seed Data

To populate the database with initial users, courses, and sample data for development:

1. **Local JSON Fallback Setup:**
   Ensure the `backend/app/store/courses` and `backend/app/store/users` directories contain the initial fallback JSON structures if testing offline.

2. **Run Python Seeder:**
   From the `backend` directory, run the Supabase seeding script:
   ```bash
   cd backend
   python seed_supabase_users.py
   python app/seed.py  # If applicable for other entities
   ```

3. **Node Scripts (Optional):**
   Run the seed scripts located in the root `scripts/` directory:
   ```bash
   node scripts/seed-users.mjs
   node scripts/seed-full-courses.mjs
   ```

## 4. Environment Variables

Ensure your backend `.env` has the correct connection details:

```env
DATABASE_URL=postgresql://postgres:<password>@<host>:5432/postgres
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_ANON_KEY=<your_anon_key>
SUPABASE_SERVICE_ROLE_KEY=<your_service_role_key>
```
