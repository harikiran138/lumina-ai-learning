# Tutor Agent

> **File:** `03-agents/02-tutor-agent.md`
> **Related:** [[03-agents/00-agents-index]], [[03-agents/06-agent-orchestration]], [[05-prompts/02-tutor-prompt]], [[04-data-flow/04-ai-agent-job-flow]]
> **Last Updated:** 2026-04-15

The Tutor Agent is the primary student-facing AI in Lumina. It generates RAG-grounded, Socratic answers to student questions. Its output never reaches a student directly — it always lands in the Teacher's AI Answer Queue pending approval.

---

## Purpose

Answer student questions using course-specific knowledge retrieved via hybrid RAG, in a Socratic style that guides rather than gives away answers. Every output must be verifiable by a human teacher before delivery.

## Model

**Claude Sonnet 4.6** (`claude-sonnet-4-6`)

## Trigger

A student submits a question via the AI Tutor chat interface. The FastAPI handler dispatches the question to the AI Engine as a `BackgroundTasks.add_task()` call and immediately returns `{ queue_id, status: "pending" }` to the client.

## Input Schema

```json
{
  "student_id_hash": "string (8-char SHA-256 hash of real student_id)",
  "course_id": "uuid",
  "institution_id": "uuid",
  "concept_id": "uuid (the Knowledge Component the question relates to)",
  "question": "string (student's raw question text)",
  "conversation_history": [
    { "role": "student|tutor", "content": "string" }
  ],
  "rag_context": {
    "faiss_chunks": ["string"],
    "bm25_chunks": ["string"],
    "neo4j_adjacent_kcs": ["string (KC names)"]
  },
  "student_mastery_snapshot": {
    "concept_id": "uuid",
    "bkt_mastery": "float (0.0–1.0)",
    "dkt_mastery": "float (0.0–1.0)",
    "combined_mastery": "float (0.0–1.0)"
  }
}
```

All fields are required. `student_id_hash` is computed by the backend before dispatch — the real `student_id` is never sent to Claude.

## Processing Logic

1. Backend FastAPI handler receives student question
2. Handler queries FAISS (dense vector), BM25 (lexical), and Neo4j (graph adjacency) simultaneously
3. Handler computes `student_id_hash = sha256(student_id)[:8]`
4. Handler looks up student's current mastery snapshot from `knowledge_trace` table
5. Handler composes the full input JSON and dispatches to AI Engine as background task
6. AI Engine passes input to the LangGraph Tutor node
7. Tutor node calls Claude Sonnet 4.6 with the system prompt (see [[05-prompts/02-tutor-prompt]]) and input JSON
8. Response passes to Guardian node (Claude Haiku 4.5) for safety check
9. If Guardian returns `PASS`: insert row into `ai_answer_queue` with `status = 'PENDING'`
10. If Guardian returns `FLAG`: insert with `status = 'PENDING'` and `guardian_flag = TRUE`
11. If Guardian returns `BLOCK`: log to `guardian_block_log`; do not insert to queue; student receives generic "I can't help with that" message
12. Teacher's queue badge count increments via Redis `INCR queue_count:{teacher_id}`

## Output Schema (from Tutor Agent, before Guardian)

```json
{
  "answer": "string (Socratic answer text, may include LaTeX for equations)",
  "confidence": "float (0.0–1.0, self-assessed by Claude)",
  "rag_sources_used": ["chunk_id_1", "chunk_id_2"],
  "suggested_followups": ["string", "string"],
  "explanation_style": "conceptual|worked_example|analogy|definition",
  "flags_for_teacher": "string|null (if Claude identifies the question needs expert attention)"
}
```

## How Output Is Used

After Guardian PASS, the answer is inserted into `ai_answer_queue`:

```sql
INSERT INTO ai_answer_queue (
  institution_id, course_id, concept_id,
  student_id, teacher_id,
  student_question, ai_generated_answer,
  ai_confidence, rag_sources_used,
  guardian_flagged, status, priority_score,
  created_at
) VALUES (...)
```

`teacher_id` is determined by looking up `course_teacher_assignments` for the `course_id`.

`priority_score` is computed as: `0.4 × (1 - student_mastery) + 0.3 × queue_age_hours + 0.3 × topic_difficulty`.

When Teacher approves, the answer is:
1. Delivered to the student via the tutor chat interface
2. Inserted into the FAISS index as a new approved Q&A chunk (so future students asking similar questions get better RAG retrieval)

## Error Handling

| Error | Action |
|---|---|
| Claude API timeout (>30s) | Retry once; if second timeout, set `status = 'FAILED'`; student sees "Your question couldn't be processed. Please try again." |
| Claude returns empty answer | Set `status = 'FAILED'`; log to `agent_error_log` |
| Guardian BLOCK | Do not insert to queue; log to `guardian_block_log`; return generic refusal to student |
| FAISS retrieval returns 0 chunks | Proceed with BM25+Neo4j only; log `rag_mode = 'degraded'` on queue row |

## Latency Profile

| Stage | Expected time |
|---|---|
| FAISS + BM25 + Neo4j retrieval | 200–500ms |
| Claude Sonnet 4.6 response | 3–8s |
| Guardian check (Claude Haiku) | 1–2s |
| Total (background, not blocking) | 4–11s |

The student never waits for this — the handler returns immediately and the student polls or receives a realtime notification.

## Token Usage (approximate)

| Component | Tokens |
|---|---|
| System prompt | ~800 input |
| RAG context (3 chunks avg) | ~1200 input |
| Conversation history | ~400 input |
| Student question | ~50–200 input |
| Claude answer | ~300–600 output |
| **Total per call** | ~2750 input + ~450 output |

## Logging

Every Tutor Agent invocation logs to `agent_invocation_log`:
- `agent_type = 'tutor'`
- `institution_id`, `course_id`, `concept_id`
- `student_id_hash` (never real student_id)
- `input_tokens`, `output_tokens`
- `latency_ms`
- `guardian_result`
- `queue_item_id` (null if blocked)
