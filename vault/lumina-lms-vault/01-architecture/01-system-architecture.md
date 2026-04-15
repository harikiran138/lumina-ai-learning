# System Architecture

> **File:** `01-architecture/01-system-architecture.md`
> **Related:** [[01-architecture/02-component-map]], [[01-architecture/03-infrastructure]], [[03-agents/06-agent-orchestration]]
> **Last Updated:** 2026-04-15

Full system design covering all layers, services, and their interactions.

---

## Architecture Style

Lumina uses a **service-oriented monorepo** architecture: three first-class services (frontend, backend, ai-engine) that communicate over HTTP. They share a single Supabase PostgreSQL database but have clearly partitioned responsibilities.

```
┌─────────────────────────────────────────────────────┐
│                   BROWSER / MOBILE                  │
│              Next.js 15 Frontend                    │
│         (React 19 · TypeScript · Tailwind 4)        │
└───────────────────┬─────────────────────────────────┘
                    │ HTTPS + JWT
┌───────────────────▼─────────────────────────────────┐
│               FastAPI Backend                       │
│    Auth · Courses · Roles · Queue · Analytics       │
│    All queries scoped by institution_id             │
└──────┬──────────────────────────┬───────────────────┘
       │ SQL (asyncpg)            │ Background tasks
┌──────▼──────┐        ┌──────────▼────────────────────┐
│  Supabase   │        │        AI Engine              │
│ PostgreSQL  │        │   LangGraph Orchestration     │
│  52 tables  │        │   Tutor · Guardian            │
│   + Redis   │        │   Pathway · Assessment        │
│   + MinIO   │        └──────────┬────────────────────┘
└─────────────┘                   │
                        ┌─────────┼──────────┐
                    ┌───▼───┐ ┌───▼───┐ ┌────▼──┐
                    │ FAISS │ │ BM25  │ │ Neo4j │
                    │Vector │ │ Lex.  │ │ Graph │
                    └───────┘ └───────┘ └───────┘
```

## Service Responsibilities

### Frontend (Next.js 15)
- Renders all 11 role dashboards
- Manages client-side session state (JWT stored in HttpOnly cookie)
- Handles file uploads to MinIO via pre-signed URLs from backend
- Renders real-time queue notifications via Supabase realtime subscriptions
- Runs MSW in test environment for network mocking

### Backend (FastAPI)
- Issues and validates JWTs
- Enforces institution_id scoping on every SQL query
- Dispatches all LLM calls as background tasks (never synchronous)
- Manages the AI Answer Queue state machine (PENDING → APPROVED/REJECTED/ESCALATED)
- Runs the dropout prediction inference (XGBoost) on weekly cron
- Manages FSRS v5 scheduling computations
- Provides pre-signed MinIO URLs for file access

### AI Engine
- Runs LangGraph multi-agent graph
- Hosts TrOCR inference endpoint
- Hosts BKT+DKT knowledge tracing inference
- Hosts PPO Pathway Agent inference
- Manages FAISS index reads/writes
- Executes Neo4j graph queries for RAG context
- **Never called synchronously from a user-facing request** — always via FastAPI background tasks

## The Four Hard Rules

1. **Every SQL query includes `WHERE institution_id = :institution_id`** — FastAPI dependency injection passes institution_id from the validated JWT. A query without this clause is a bug.

2. **No LLM call in a request handler** — `anthropic.messages.create()` and `genai.generate()` are called only inside `BackgroundTasks.add_task()`. The handler returns immediately with a `{ job_id, status: "queued" }` response.

3. **No AI answer reaches a student before TILA approval** — The AI Answer Queue row must have `status = 'APPROVED'` set by a human Teacher before the answer is visible to the student. See [[04-data-flow/04-ai-agent-job-flow]].

4. **All LLM calls strip PII** — Before any data is sent to Claude or Gemini: student_id is replaced with an 8-char SHA-256 hash, and name, email, Aadhaar, and PAN fields are redacted.

## Data Isolation Model

Each institution is a completely isolated data universe. The isolation is enforced at the SQL layer:

```python
# FastAPI dependency — injected into every route that touches institution data
async def get_institution_id(token: str = Depends(oauth2_scheme)) -> UUID:
    payload = verify_jwt(token)
    return payload["institution_id"]

# Example route — institution_id is never optional
@router.get("/courses")
async def list_courses(
    institution_id: UUID = Depends(get_institution_id),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Course).where(Course.institution_id == institution_id)
    )
    return result.scalars().all()
```

## Privacy Architecture

| Data type | Protection mechanism |
|---|---|
| All student data in LLM calls | PII stripped; student_id → 8-char SHA-256 hash |
| Counselling session notes | AES-256-GCM client-side encryption; server stores ciphertext only |
| Audit logs | PostgreSQL RLS INSERT-only policy; no UPDATE or DELETE for any role |
| Parent portal access | Requires admin-verified `parent_child_links.verified_by_admin = TRUE` |
| Researcher data exports | k-anonymised (k≥5); cohorts below 5 suppressed entirely |
| File storage | MinIO on-premises; no AWS S3 |
