# Data Model Diagram

> **File:** `10-diagrams/04-data-model.md`
> **Related:** [[01-architecture/01-system-architecture]], [[01-architecture/03-infrastructure]]
> **Last Updated:** 2026-04-15

Entity-relationship diagram for the core tables in Lumina's 52-table PostgreSQL schema. Only primary relationships shown — all tables carry `institution_id` as a scoping foreign key.

---

## Core ERD

```mermaid
erDiagram
    institutions {
        uuid id PK
        string name
        string domain
        jsonb smtp_config
        integer attendance_threshold_pct
        timestamptz created_at
    }

    users {
        uuid id PK
        uuid institution_id FK
        string username
        string email
        string password_hash
        string role
        string name
        uuid department_id FK
        string status
        timestamptz created_at
    }

    departments {
        uuid id PK
        uuid institution_id FK
        string name
        string branch_code
    }

    courses {
        uuid id PK
        uuid institution_id FK
        uuid teacher_id FK
        uuid department_id FK
        string name
        string branch
        integer year
        integer semester
        string status
    }

    modules {
        uuid id PK
        uuid course_id FK
        uuid institution_id FK
        string name
        integer order_index
    }

    lessons {
        uuid id PK
        uuid module_id FK
        uuid course_id FK
        uuid institution_id FK
        string name
        string content_type
        string content_key
        integer duration_minutes
    }

    knowledge_components {
        uuid id PK
        uuid course_id FK
        uuid institution_id FK
        string name
        string description
    }

    enrollments {
        uuid id PK
        uuid student_id FK
        uuid course_id FK
        uuid institution_id FK
        string status
        timestamptz enrolled_at
    }

    knowledge_trace {
        uuid id PK
        uuid student_id FK
        uuid kc_id FK
        uuid course_id FK
        uuid institution_id FK
        float bkt_mastery
        float dkt_mastery
        float combined_mastery
        float p_init
        float p_learn
        float p_slip
        float p_guess
        timestamptz updated_at
    }

    ai_answer_queue {
        uuid id PK
        uuid institution_id FK
        uuid course_id FK
        uuid concept_id FK
        uuid student_id FK
        uuid teacher_id FK
        text student_question
        text ai_generated_answer
        text teacher_edited_answer
        float ai_confidence
        boolean guardian_flagged
        string status
        float priority_score
        uuid approved_by FK
        timestamptz approved_at
        text rejection_reason
        string escalated_to
        timestamptz created_at
    }

    assessments {
        uuid id PK
        uuid course_id FK
        uuid module_id FK
        uuid institution_id FK
        string name
        integer time_limit_minutes
        boolean shuffle_questions
        integer attempts_allowed
        timestamptz visible_after
        timestamptz due_at
    }

    assessment_questions {
        uuid id PK
        uuid assessment_id FK
        uuid institution_id FK
        uuid knowledge_component_id FK
        text question_text
        string question_type
        jsonb options
        string correct_answer
        text explanation
        float max_marks
        float difficulty_score
        string bloom_level
    }

    assessment_submissions {
        uuid id PK
        uuid assessment_id FK
        uuid student_id FK
        uuid institution_id FK
        float score
        float max_score
        integer time_taken_seconds
        timestamptz submitted_at
    }

    fsrs_card_state {
        uuid id PK
        uuid student_id FK
        uuid card_id FK
        uuid course_id FK
        uuid institution_id FK
        float stability
        float difficulty
        float retrievability
        timestamptz next_review_at
        string state
        integer reps
        integer lapses
    }

    dropout_predictions {
        uuid id PK
        uuid student_id FK
        uuid course_id FK
        uuid institution_id FK
        date week_start
        float risk_score
        string risk_label
        jsonb shap_values
        jsonb top_risk_factors
        timestamptz created_at
    }

    attendance_records {
        uuid id PK
        uuid student_id FK
        uuid course_id FK
        uuid institution_id FK
        uuid session_id FK
        boolean present
        string method
        boolean proxy_suspected
        timestamptz recorded_at
    }

    audit_logs {
        uuid id PK
        uuid institution_id FK
        uuid user_id FK
        string role
        string action
        string resource_type
        uuid resource_id
        jsonb before_state
        jsonb after_state
        inet ip_address
        timestamptz created_at
    }

    parent_child_links {
        uuid id PK
        uuid parent_id FK
        uuid student_id FK
        uuid institution_id FK
        boolean verified_by_admin
        uuid verified_by FK
        timestamptz verified_at
    }

    institutions ||--o{ users : "has"
    institutions ||--o{ departments : "has"
    institutions ||--o{ courses : "hosts"
    users ||--o{ enrollments : "student enrolls"
    courses ||--o{ enrollments : "enrolled in"
    courses ||--o{ modules : "contains"
    modules ||--o{ lessons : "contains"
    courses ||--o{ knowledge_components : "has"
    knowledge_components ||--o{ knowledge_trace : "tracked per student"
    users ||--o{ knowledge_trace : "student"
    users ||--o{ ai_answer_queue : "student asks"
    courses ||--o{ ai_answer_queue : "in course"
    courses ||--o{ assessments : "has"
    assessments ||--o{ assessment_questions : "has"
    assessments ||--o{ assessment_submissions : "submitted"
    users ||--o{ assessment_submissions : "student submits"
    users ||--o{ fsrs_card_state : "student"
    courses ||--o{ fsrs_card_state : "course"
    users ||--o{ dropout_predictions : "student"
    courses ||--o{ dropout_predictions : "for course"
    users ||--o{ attendance_records : "student"
    users ||--o{ parent_child_links : "parent"
    users ||--o{ parent_child_links : "student (child)"
```

---

## Key Relationship Notes

**Every table has `institution_id`** — the schema enforces multi-tenancy at the table level, not just the application level.

**`ai_answer_queue.status` is the TILA gatekeeper** — student can only see the row contents when `status = 'APPROVED'`. The API layer enforces this: `GET /api/tutor/history` only returns rows where `status = 'APPROVED' AND student_id = :current_student_id`.

**`audit_logs` has no `UPDATE` or `DELETE` path** — enforced by PostgreSQL RLS. It is append-only by design.

**`parent_child_links.verified_by_admin` must be `TRUE`** — any parent query that joins to student data first checks this condition. The API `GET /api/parent/child/{id}` fails with 403 if the link is unverified.

**`knowledge_trace` has one row per (student, kc, course)** — this is the central data structure for the entire adaptive learning system. BKT updates modify `bkt_mastery`; DKT updates modify `dkt_mastery`; `combined_mastery` is recomputed on every update.
