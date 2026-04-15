# Agents Index

> **File:** `03-agents/00-agents-index.md`
> **Related:** [[03-agents/06-agent-orchestration]], [[04-data-flow/04-ai-agent-job-flow]]
> **Last Updated:** 2026-04-15

All four AI agents in Lumina, their models, triggers, and relationships.

---

## Overview

Lumina uses **LangGraph** to orchestrate four specialised agents in a stateful directed graph. Every request flows through the graph sequentially. The **Guardian agent always runs last** on every output before anything reaches the database or queue.

## Agent Summary

| Agent | Model | Trigger | Primary output | Async? |
|---|---|---|---|---|
| Tutor | Claude Sonnet 4.6 | Student submits a question | RAG-grounded answer (PENDING in queue) | ✅ Always |
| Pathway | PPO (PyTorch) | Student completes any quiz | Next KC recommendation + explanation style | ✅ Always |
| Assessment | Gemini 1.5 Flash | Teacher requests quiz or material generation | Quiz questions / rubric (pending teacher review) | ✅ Always |
| Guardian | Claude Haiku 4.5 | Output from any of the above three | PASS / FLAG / BLOCK decision + reason | ✅ Always (final gate) |

## Key Invariants

1. **Guardian runs on ALL agent outputs** — No Tutor, Pathway, or Assessment output bypasses Guardian.
2. **All four agents are invoked only as FastAPI background tasks** — No synchronous LLM calls in request handlers.
3. **All LLM inputs strip PII** — student_id → 8-char SHA-256 hash; name, email, Aadhaar, PAN redacted before transmission.
4. **Tutor outputs land in the AI Queue with status PENDING** — Teacher must APPROVE before student sees the answer.

## Agent Files

- [[03-agents/01-course-generation-agent]] — Assessment Agent (quiz/material generation)
- [[03-agents/02-tutor-agent]] — Tutor Agent (Socratic tutoring)
- [[03-agents/03-grading-agent]] — TrOCR + Assessment Agent grading pipeline
- [[03-agents/04-curriculum-agent]] — Pathway Agent (PPO sequencing)
- [[03-agents/05-reporting-agent]] — Dropout prediction + analytics
- [[03-agents/06-agent-orchestration]] — LangGraph graph definition and routing
