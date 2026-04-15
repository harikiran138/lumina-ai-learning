# Learner Enrollment Flow

> **File:** `04-data-flow/03-learner-enrollment-flow.md`
> **Related:** [[04-data-flow/00-data-flow-master]], [[02-roles/05-learner]]
> **Last Updated:** 2026-04-15

How a student enrolls in a course and how initial learning state is created.

---

## Actors

Student (self-enrolls or is enrolled by Teacher/IA), FastAPI Backend, PostgreSQL

## Preconditions

- Student account is active
- Course is published (`status = 'published'`)
- Course is within the student's department and year

## Step-by-Step Flow

**Step 1 — Student discovers course**
Student's dashboard lists courses available to their `branch + year + semester`. This is a `GET /api/courses?branch=CSE&year=3&semester=1` query — always scoped by `institution_id`.

**Step 2 — Enrollment**
```
POST /api/courses/{course_id}/enroll
(No body required — student_id from JWT, institution_id from JWT)
```

**Step 3 — Initial state creation**
On enrollment, the backend creates the student's initial learning state in a transaction:

```sql
-- Enrollment record
INSERT INTO enrollments (id, student_id, course_id, institution_id, enrolled_at, status)

-- Knowledge trace initialisation — one row per KC in the course
INSERT INTO knowledge_trace (student_id, kc_id, course_id, institution_id,
  bkt_mastery, dkt_mastery, combined_mastery, p_init, p_learn, p_slip, p_guess)
SELECT student_id, kc.id, course_id, institution_id,
  0.1, 0.1, 0.1,  -- initial mastery
  0.3, 0.1, 0.2, 0.25  -- default BKT parameters
FROM knowledge_components kc WHERE kc.course_id = :course_id

-- FSRS flashcard initialisation — for each flashcard in the course
INSERT INTO fsrs_card_state (student_id, card_id, course_id, institution_id,
  stability, difficulty, retrievability, next_review_at, state)
SELECT student_id, fc.id, course_id, institution_id,
  1.0, 5.0, 1.0, NOW(), 'new'
FROM flashcards fc WHERE fc.course_id = :course_id
```

**Step 4 — Pathway Agent bootstraps recommended KC**
A background task runs the Pathway Agent for the new student with all KCs at initial mastery 0.1. The agent recommends the root KC (the KC with no prerequisites). This recommendation is stored in `student_pathway_log` and surfaced on the student's dashboard as "Start here".

## Output Data

```json
{
  "enrollment_id": "uuid",
  "course_id": "uuid",
  "status": "enrolled",
  "initial_recommended_kc": {
    "kc_id": "uuid",
    "kc_name": "string"
  },
  "flashcards_initialised": "integer",
  "kcs_tracked": "integer"
}
```

## Error Paths

| Error | HTTP code | Handling |
|---|---|---|
| Already enrolled | 409 | Return existing enrollment record |
| Course not published | 400 | Return error message |
| Course not in student's department | 403 | Return error message |
| KC initialisation fails | 500 | Enrollment created; KT initialisation retried on next login |

## Edge Cases

**Teacher manually enrolls a student** — Teacher can enroll specific students via `POST /api/courses/{course_id}/enroll` with `student_id` in the body. Teacher must be the assigned teacher for that course. The same Step 3 initialisation runs.

**Student unenrolls** — Not permitted by the student directly. Teacher or IA must deactivate the enrollment. Progress data is retained; enrollment `status` is set to `'withdrawn'`.
