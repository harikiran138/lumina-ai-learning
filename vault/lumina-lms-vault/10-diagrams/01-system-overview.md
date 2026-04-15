# System Overview Diagram

> **File:** `10-diagrams/01-system-overview.md`
> **Related:** [[01-architecture/01-system-architecture]], [[01-architecture/02-component-map]]
> **Last Updated:** 2026-04-15

Full system diagram for Lumina LMS in Mermaid format.

---

```mermaid
graph TB
    subgraph Client["Client Layer"]
        Browser["Browser / Mobile\nNext.js 15 · React 19 · TypeScript"]
    end

    subgraph Backend["FastAPI Backend (Port 8000)"]
        Auth["Auth Router\n/api/auth"]
        Courses["Courses Router\n/api/courses"]
        Queue["Queue Router\n/api/queue"]
        Analytics["Analytics Router\n/api/analytics"]
        Admin["Admin Router\n/api/admin"]
    end

    subgraph AIEngine["AI Engine (Port 8001)"]
        LangGraph["LangGraph Orchestrator"]
        Tutor["Tutor Agent\nClaude Sonnet 4.6"]
        Guardian["Guardian Agent\nClaude Haiku 4.5"]
        Assessment["Assessment Agent\nGemini 1.5 Flash"]
        Pathway["Pathway Agent\nPPO PyTorch"]
        TrOCR["TrOCR Pipeline\ntrocr-large-handwritten"]
        BKTDKT["BKT+DKT\nKnowledge Tracing"]
        XGBoost["XGBoost+SHAP\nDropout Prediction"]
    end

    subgraph DataStores["Data Stores"]
        PG["Supabase PostgreSQL\n52 tables"]
        Redis["Redis 7\nSessions · Queue counts"]
        MinIO["MinIO\nFiles · Videos · Generated content"]
        FAISS["FAISS\nVector index"]
        Neo4j["Neo4j\nKC knowledge graph"]
    end

    Browser -- "HTTPS + JWT Cookie" --> Backend
    Backend -- "BackgroundTasks only\n(never sync)" --> AIEngine
    Backend -- "asyncpg SQL\n(institution_id scoped)" --> PG
    Backend -- "session cache\nqueue counts" --> Redis
    Backend -- "pre-signed URLs" --> MinIO

    LangGraph --> Tutor
    LangGraph --> Assessment
    LangGraph --> Pathway
    LangGraph --> Guardian
    LangGraph --> TrOCR
    LangGraph --> BKTDKT
    LangGraph --> XGBoost

    AIEngine --> PG
    AIEngine --> FAISS
    AIEngine --> Neo4j
    AIEngine --> MinIO
```

---

## TILA Queue Flow Diagram

```mermaid
sequenceDiagram
    participant S as Student
    participant BE as FastAPI
    participant AI as AI Engine
    participant T as Teacher
    participant DB as PostgreSQL

    S->>BE: POST /api/queue/submit
    BE->>DB: INSERT agent_jobs (queued)
    BE->>AI: BackgroundTask(tutor+guardian)
    BE->>S: 202 { queue_id, status:pending }

    AI->>AI: FAISS + BM25 + Neo4j retrieval
    AI->>AI: Claude Sonnet 4.6 (Tutor)
    AI->>AI: Claude Haiku 4.5 (Guardian)

    alt Guardian BLOCK
        AI->>DB: INSERT guardian_block_log
        AI-->>S: "I can't help with that"
    else Guardian PASS/FLAG
        AI->>DB: INSERT ai_answer_queue (PENDING)
        AI-->>T: Queue badge notification
    end

    T->>BE: POST /api/queue/{id}/approve
    BE->>DB: UPDATE status=APPROVED
    BE-->>S: Approved answer delivered
    BE->>AI: BackgroundTask(index_into_FAISS)
```
