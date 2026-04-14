# Database Verification Report

## Summary
The current database in Supabase contains the core Lumina tables, but there is a mismatch between the local migration files (`001_init_schema.sql`) and the actual schema in production. Several advanced tables (Pathways, Skill Mastery, Quizzes) exist in the database but are not tracked in migrations or secured with RLS.

## Table Existence Verification
| Table Name | Status in Supabase | Tracked in `001_init_schema.sql` | Notes |
|------------|--------------------|-----------------------------------|-------|
| `users` | Verified | Yes | |
| `courses` | Verified | Yes | |
| `enrollments` | Verified | Yes | |
| `learner_profiles` | Verified | Yes | |
| `learning_events` | Verified | Yes | |
| `assessment_sessions` | Verified | Yes | |
| `assignment_rubrics` | Verified | Yes | |
| `assignment_submissions` | Verified | Yes | |
| `submission_scorecards` | Verified | Yes | |
| `intervention_recommendations` | Verified | Yes | |
| `automation_job_logs` | Verified | Yes | |
| `knowledge_nodes` | Verified | Yes | |
| `student_pathways` | **Detected** | **No** | Needs migration tracking |
| `skill_mastery` | **Detected** | **No** | Needs migration tracking |
| `quizzes` | **Detected** | **No** | Needs migration tracking |
| `quiz_attempts` | **Detected** | **No** | Needs migration tracking |
| `tutor_sessions` | **Detected** | **No** | Needs migration tracking |

## Security Audit (RLS)
| Table Name | RLS Enabled | Policies Found in `002_rls_policies.sql` | Gap |
|------------|-------------|-----------------------------------------|-----|
| `users` | Yes | Yes | |
| `courses` | Yes | Yes | |
| `enrollments` | Yes | Yes | |
| `learner_profiles` | Yes | Yes | |
| `learning_events` | Yes | Yes | |
| `assessment_sessions` | Yes | Yes | |
| `assignment_rubrics` | Yes | Yes | |
| `assignment_submissions` | Yes | Yes | |
| `intervention_recommendations` | Yes | Yes | |
| `knowledge_nodes` | Yes | Yes | |
| `student_pathways` | Yes? | **No** | Missing explicit policy in migration |
| `skill_mastery` | Yes? | **No** | Missing explicit policy in migration |
| `quizzes` | No? | **No** | Needs RLS and policy |
| `quiz_attempts` | No? | **No** | Needs RLS and policy |
| `tutor_sessions` | No? | **No** | Needs RLS and policy |

## Relationships & Integrity
- Foreign keys for core tables are consistent.
- `knowledge_nodes` uses self-referencing `parent_id`.
- `enrollments` has a unique constraint on `(student_id, course_id)`.

## Missing Schemas / Conflicts
- **Type Safety**: Some tables like `institutions`, `programs` are present but appear to be legacy or from a different context. They should be ignored for Lumina's core logic unless explicitly required.
- **Migration Drift**: The local `001_init_schema.sql` is missing at least 5 tables that are active in the Lumina workflow (Pathways, Mastery).

## Recommendation
Create a new migration `003_advanced_features.sql` to formally track the extra tables and `004_advanced_rls.sql` to secure them. Update `seed.py` to include data for these new tables.
