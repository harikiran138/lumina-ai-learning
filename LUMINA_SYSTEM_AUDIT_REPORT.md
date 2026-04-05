# Lumina AI Learning Platform - System Audit Report


## 1. Executive Summary

This audit evaluated the current state of the Lumina AI Learning platform against the requirements specified in the SRS. The system follows a micro-service-inspired monolithic architecture with a FastAPI backend and a React/Next.js frontend. While the core "Intelligence Core" (Learner Profile, Adaptive Engine) is well-defined, there are significant gaps in the database schema persistence and several peripheral modules (Wellbeing, Gamification).

## 2. Technical Stack

- **Backend**: FastAPI (Python 3.11/3.8), Uvicorn.
- **Database**: Supabase (PostgreSQL) + Redis (for notifications/caching).
- **AI/ML**: Custom inference for DKT (Deep Knowledge Tracing), BKT (Bayesian Knowledge Tracing), and FSRS (Free Spaced Repetition Scheduler).
- **Monitoring**: Sentry (Error Tracking), Prometheus (Metrics/Observability), Structlog (JSON Logging).
- **Frontend**: Likely Vite/Next.js (React).

## 3. Database Schema Audit

The `FINAL_DATABASE_SCHEMA.sql` contains foundational tables, but several crucial SRS-mandated tables are missing or not reflected in the schema file.

| Feature Area | SRS Table | Status in Schema | Notes |
| :--- | :--- | :--- | :--- |
| **Users** | `users` | Found | Uses `auth.users` via Supabase |
| **Knowledge** | `knowledge_nodes` | Found | Corresponds to `concepts` |
| **Mastery** | `skill_mastery` | Found | Tracks concept-level proficiency |
| **Adaptive Loop** | `assessment_sessions` | Found | Stores JSONB for questions/answers |
| **Spaced Repetition**| `fsrs_cards` | **Missing** | Table is used in `fsrs_engine.py` but not in schema. |
| **Wellbeing** | `emotion_logs` | **Missing** | Router exists, but no table or service found. |
| **Interventions** | `intervention_queue`| **Missing** | Replaced by `intervention_recommendations`? |
| **Social** | `study_groups` | Found | Basic structure is implemented. |
| **Personalization** | `student_style_weights`| **Missing** | RL-based style weights not persisted. |

### Major Findings:
1.  **FSRS Implementation**: The `fsrs_engine.py` is functional but depends on a `fsrs_cards` table that does not exist in the default schema. This causes runtime errors if not manually created.
2.  **Notification Persistence**: Notifications are routed through Redis, meaning they are transient and not persisted in Postgres for historical tracking.
3.  **Wellbeing Mystery**: A `wellbeing` router exists in `backend/app/routers/wellbeing.py`, but its service layers and database tables are entirely missing.

## 4. Current Task Status (Intelligence Core)
The primary SRS focus is the **Adaptive Engine** and **Learner Profile**.

- **Learner Profile**: Substantial implementation in `backend/learner_profile/`. Includes BKT/DKT logic.
- **Adaptive Engine**: Decent logic in `backend/app/personalization/adaptive_engine.py` for deciding "Next Move" (Challenge, Assessment, Remediation).
- **Gap**: Integration between the *ML Engine* and the *Supabase backend* is partially complete.

## 5. Next Steps & Recommendations
1.  **Schema Hardening**: Apply the missing FSRS and Wellbeing tables to Supabase.
2.  **Service Recovery**: Restore or implement the `app.services.wellbeing` module as it is a critical SRS requirement (Emotional Monitoring).
3.  **Persistence**: Move style weights and intervention logs from in-memory/JSONB to dedicated relational tables for better long-term personalization.
