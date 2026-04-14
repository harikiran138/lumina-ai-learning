# SYSTEM_ARCHITECTURE

## 🗺 System Overview

```mermaid
graph TD
    subgraph Frontend [Next.js 15 Client]
        A[Stakeholder Portals] --> B[Zustand Store]
        B --> C[API Fetcher]
    end

    subgraph Backend [FastAPI Server]
        C --> D[Auth Middleware]
        D --> E[Domain Routers]
        E --> F[AI Orchestrator]
        E --> G[Business Logic]
    end

    subgraph Data [Data Layer]
        G --> H[(PostgreSQL / Supabase)]
        H --> I[RLS Policies]
        F --> J[(Neo4j Knowledge Graph)]
        F --> K[(Vector DB / Qdrant)]
    end

    subgraph AI [AI Services]
        F --> L[LLM / Gemini]
        L --> M[RAG Pipeline]
    end
```

## 🔌 API Interaction Map
- **REST API**: Standard CRUD operations via FastAPI.
- **WebSocket**: Real-time tutor interactions and grading notifications.
- **MCP (Model Context Protocol)**: Specialized protocol for agent-to-system communication.

## 🛡 Security Layer
- **Identity**: Supabase Auth (JWT).
- **Authorization**: Row Level Security (RLS) + Custom Python Middleware.
- **Verification**: Teacher-in-the-loop for all AI-generated content.

---
[[PROJECT_OVERVIEW]] | [[DATA_FLOW]] | [[MODULE_MAP]]
