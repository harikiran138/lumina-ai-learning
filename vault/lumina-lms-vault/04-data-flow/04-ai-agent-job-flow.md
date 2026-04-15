# AI Agent Job Flow (TILA Pattern)

> **File:** `04-data-flow/04-ai-agent-job-flow.md`
> **Related:** [[03-agents/02-tutor-agent]], [[03-agents/06-agent-orchestration]], [[08-features/04-ai-tutor]]
> **Last Updated:** 2026-04-15

The full data flow for the Teacher-Initiated LLM Approval (TILA) pattern — Lumina's defining architectural feature.

---

## Summary

A student asks a question. The AI generates an answer. The answer waits in a queue. A Teacher reviews and approves. Only on approval does the student see the answer. This is the TILA pattern. It is non-negotiable.

## Actors

Student, FastAPI Backend, AI Engine (LangGraph), Teacher, PostgreSQL, Redis, FAISS/BM25/Neo4j

## Preconditions

- Student is enrolled in the course
- Course has a Teacher assigned (`course_teacher_assignments` row exists)
- Course content is indexed in FAISS and Neo4j

## Step-by-Step Flow

```mermaid
sequenceDiagram
    participant S as Student
    participant FE as Next.js Frontend
    participant BE as FastAPI Backend
    participant AI as AI Engine (LangGraph)
    participant DB as PostgreSQL
    participant RD as Redis
    participant T as Teacher

    S->>FE: Types question in AI Tutor chat
    FE->>BE: POST /api/queue/submit { question, course_id, concept_id }
    BE->>BE: Extract institution_id from JWT
    BE->>DB: Lookup teacher_id for course_id (institution_id scoped)
    BE->>DB: INSERT INTO agent_jobs { id, status='queued', ... }
    BE->>AI: BackgroundTasks.add_task(run_agent_graph, "tutor", payload)
    BE->>FE: 200 { queue_id, status: "pending" }
    FE->>S: "Your question is being reviewed by your teacher"

    Note over AI: (runs asynchronously)

    AI->>AI: Retrieve FAISS chunks (dense vector)
    AI->>AI: Retrieve BM25 chunks (lexical)
    AI->>AI: Query Neo4j adjacent KCs
    AI->>AI: Build Tutor prompt (PII stripped)
    AI->>AI: Call Claude Sonnet 4.6 (Tutor node)
    AI->>AI: Call Claude Haiku 4.5 (Guardian node)

    alt Guardian: BLOCK
        AI->>DB: INSERT guardian_block_log
        AI->>DB: UPDATE agent_jobs SET status='blocked'
        AI->>FE: Push "I can't help with that"
    else Guardian: PASS or FLAG
        AI->>DB: INSERT ai_answer_queue { status='PENDING', guardian_flagged=... }
        AI->>RD: INCR queue_count:{teacher_id}
        AI->>DB: UPDATE agent_jobs SET status='queued_for_review'
        AI->>FE: Push notification to Teacher
    end

    T->>FE: Opens AI Queue dashboard
    FE->>BE: GET /api/queue?course_id=...&status=PENDING
    BE->>DB: SELECT from ai_answer_queue (institution_id + course_id scoped)
    BE->>FE: List of pending queue items

    alt Teacher: APPROVE
        T->>BE: POST /api/queue/{queue_id}/approve
        BE->>DB: UPDATE ai_answer_queue SET status='APPROVED', approved_by=teacher_id, approved_at=now()
        BE->>AI: BackgroundTasks.add_task(index_approved_qa, queue_id)
        BE->>FE: Push approved answer to Student
        AI->>AI: Index Q+A into FAISS as approved chunk
    else Teacher: EDIT + APPROVE
        T->>BE: POST /api/queue/{queue_id}/approve { edited_answer }
        BE->>DB: UPDATE ai_answer_queue SET status='APPROVED', teacher_edited_answer=..., edited=true
        BE->>FE: Push edited answer to Student
    else Teacher: REJECT
        T->>BE: POST /api/queue/{queue_id}/reject { reason }
        BE->>DB: UPDATE ai_answer_queue SET status='REJECTED', rejection_reason=...
        BE->>FE: Push rejection to Student: "Your teacher suggests rephrasing"
    else Teacher: ESCALATE
        T->>BE: POST /api/queue/{queue_id}/escalate
        BE->>DB: UPDATE ai_answer_queue SET status='ESCALATED', escalated_to='faculty'
        BE->>RD: INCR queue_count:{faculty_id_for_dept}
        BE->>FE: Notify Faculty
    end

    Note over S: Student sees answer ONLY after APPROVE
    FE->>S: Displays approved answer in tutor chat
```

## Database State Machine

```
PENDING → APPROVED   (Teacher/Faculty/HOD action)
PENDING → REJECTED   (Teacher/Faculty/HOD action)
PENDING → ESCALATED  (Teacher action → moves to Faculty)
ESCALATED → APPROVED (Faculty/HOD action)
ESCALATED → REJECTED (Faculty/HOD action)
ESCALATED → ESCALATED (Faculty action → moves to HOD)
* → FAILED           (AI Engine error)
* → BLOCKED          (Guardian blocks; never enters queue)
```

## Redis Usage

`queue_count:{user_id}` is an integer key tracking how many PENDING items are in each Teacher's/Faculty's queue. It is used only for the badge count on the dashboard. Actual queue data is always read from PostgreSQL, never from Redis.

## Post-Approval Indexing

When an answer is approved, the Q+A pair is indexed into FAISS as an approved knowledge chunk. The next student who asks a similar question will retrieve this approved answer as RAG context, improving the Tutor Agent's response quality over time. This is the mechanism by which Lumina's knowledge base grows organically.

## Key Constraint

There is no bypass for the TILA queue. No configuration flag, no "trusted AI" mode, no admin override. The queue exists in the database schema enforced at the SQL layer. The only way an answer reaches a student is through a row with `status = 'APPROVED'` set by a human user with Teacher, Faculty, or HOD role. This is not a UI restriction — it is a data model constraint.
