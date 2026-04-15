# Data Flow Master

> **File:** `04-data-flow/00-data-flow-master.md`
> **Related:** [[04-data-flow/04-ai-agent-job-flow]], [[01-architecture/01-system-architecture]]
> **Last Updated:** 2026-04-15

Master overview of every data flow in Lumina and which file covers it.

---

## Flows Index

| Flow | File | Trigger | Key data stores |
|---|---|---|---|
| User registration & onboarding | [[04-data-flow/01-user-registration-flow]] | IA creates account / student self-registers | PostgreSQL, Redis |
| Course creation | [[04-data-flow/02-course-creation-flow]] | Teacher builds a course | PostgreSQL, MinIO, FAISS, Neo4j |
| Learner enrollment | [[04-data-flow/03-learner-enrollment-flow]] | Student enrolls in course | PostgreSQL |
| AI Agent job (TILA) | [[04-data-flow/04-ai-agent-job-flow]] | Student submits question | PostgreSQL, Redis, FAISS, BM25, Neo4j → Claude |
| Assessment & grading | [[04-data-flow/05-assessment-flow]] | Student submits quiz or assignment | PostgreSQL, MinIO (handwriting), FSRS |

## Critical Path — The TILA Flow

The most important flow in Lumina is the AI Answer Queue flow (TILA pattern). It is described in full detail in [[04-data-flow/04-ai-agent-job-flow]]. Every other flow is secondary in terms of architectural significance.

## Institution Scoping Rule (Applies to All Flows)

Every FastAPI route extracts `institution_id` from the validated JWT via the `get_institution_id` dependency. Every SQL query in every flow includes `WHERE institution_id = :institution_id`. This is enforced without exception. Any route that queries institution-scoped data without this filter is a critical security bug.

## Background Task Rule (Applies to All AI Flows)

Any flow that invokes Claude or Gemini must use `BackgroundTasks.add_task()`. The route handler returns a `{ job_id, status: "queued" }` response immediately. The LangGraph graph runs asynchronously. The client polls via `GET /api/jobs/{job_id}` or receives a Supabase realtime push notification when the job completes.
