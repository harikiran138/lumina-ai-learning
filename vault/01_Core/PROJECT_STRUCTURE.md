# Lumina – Complete File Structure (Canonical)

> **Single Source of Truth** | **Version**: 1.0.0
>
> This document defines the **Architectural Contract** for the Lumina Platform. It aligns fully with the *Comprehensive Solution Architecture*, integrating **Agentic AI (MCP)**, **Learner Profile Engine**, **Governance**, **Experimentation**, and **Enterprise Infrastructure**.

---

## 🏗 Top-Level Directory Layout

The project follows a **Monorepo** structure to ensure type safety and contract alignment across services.

```text
Lumina-Platform/
├── .github/                        # CI/CD Workflows (Bake, Test, Deploy)
├── .husky/                         # Git Hooks (Pre-commit linting/secrets check)
├── docs/                           # 📘 Architecture & Protocol Documentation
│   ├── ARCHITECTURE.md             # Component Interactions & Data Flow
│   ├── MCP_PROTOCOL.md             # Agent Message Schemas & Lifecycle
│   ├── API_SPEC.md                 # OpenAPI/Swagger Specs
│   └── GOVERNANCE.md               # Privacy (FERPA/GDPR/COPPA) & Safety Policies
│
├── infrastructure/                 # ☁️ Enterprise Infrastructure (IaC)
│   ├── k8s/                        # Kubernetes Manifests (Helm Charts)
│   ├── terraform/                  # Cloud Provisioning (AWS/OCI/GCP)
│   └── docker/                     # Base Docker Images (CUDA, Python, Node)
│
├── backend/                        # 🧠 The Core Intelligence & Services
│   ├── app/                        # Main API Gateway & Orchestration
│   ├── learner_profile/            # User Modeling Engine (BKT/DKT/Behavior)
│   ├── ai_engine/                  # The Cognitive Core (Agents, specific Models)
│   ├── mcp/                        # Model Context Protocol (Host & Registry)
│   └── lib/                        # Shared Python Libraries (Utils, Security)
│
├── frontend/                       # 🖥️ Client Applications
│   ├── web/                        # Next.js Web App (PWA)
│   ├── flutter_app/                # Flutter App (Offline-First)
│   └── desktop/                    # Electron App (Lab Integration)
│
├── data/                           # 🗄️ Database Schemas & Seeds
│   ├── postgres/                   # Migrations (Prisma/Alembic)
│   ├── neo4j/                      # Graph Schema Definitions
│   └── milvus/                     # Vector Collection Configs
│
├── scripts/                        # DevOps & Maintenance Scripts
├── .env.example                    # Template for Environment Variables
├── docker-compose.yml              # Local Development Orchestration
└── README.md                       # Entry Point
```

---

## 📂 Backend Deep Dive

The `backend` is the heart of the platform, split into specialized domains.

### 1. `backend/app` (API Gateway & Core Logic)
Handles standard CRUD, Auth, and orchestrates requests to sub-engines.
```text
backend/app/
├── main.py                         # FastAPI Entry Point
├── api/                            # REST / WebSocket Routes
│   ├── v1/                         # Versioned Endpoints
│   │   ├── auth/                   # Identity & Session Management
│   │   ├── content/                # Content Management (Upload, Metadata)
│   │   ├── courses/                # Curriculum Structure
│   │   └── analytics/              # Dashboard Aggregations
│   └── deps.py                     # Dependency Injection
├── core/                           # Application Configuration
│   ├── config.py                   # Pydantic Settings
│   └── security.py                 # JWT, RBAC, Encryption
└── services/                       # Business Logic (Non-AI)
    ├── attendance.py               # Engagement-based Verification Logic
    └── notification.py             # Push/Email Dispatcher
```

### 2. `backend/learner_profile` (The Learner Engine)
Dedicated to understanding the user. Implements BKT, DKT, and Behavioral analysis.
```text
backend/learner_profile/
├── engine.py                       # Interface for External Calls
├── models/
│   ├── bkt.py                      # Bayesian Knowledge Tracing Implementation
│   ├── dkt.py                      # Deep Knowledge Tracing (LSTM/Transformer)
│   └── behavior.py                 # Engagement Scoring Algorithms
├── store/
│   ├── state.py                    # Redis/Memcached State Manager
│   └── history.py                  # TimescaleDB Historical Writer
└── analysis/
    ├── cognitive_load.py           # Real-time Mental Effort Estimation
    └── gaps.py                     # Misconception Detector
```

### 3. `backend/ai_engine` (Agents & Cognition)
The "Brain" running the Swarm.
```text
backend/ai_engine/
├── swarm/                          # 🤖 The Agent Definitions
│   ├── orchestrator.py             # Master Agent | Intent Router
│   ├── tutor.py                    # Socratic Dialogue Agent
│   ├── pathway.py                  # Adaptive Curriculum Agent
│   ├── assessment.py               # Dynamic Quiz/Test Generator
│   ├── intervention.py             # Predictive Support Agent
│   └── guardian.py                 # Safety & Guardrails Agent
├── cognitive/                      # Capabilities
│   ├── rag/                        # RAG Pipeline
│   │   ├── ingestion/              # Multi-format Parsers (PDF, Video)
│   │   ├── chunking/               # Semantic/Recursive Splitters
│   │   └── retrieval/              # Hybrid Search & Reranking
│   ├── ocr/                        # Vision Processing
│   └── optimization/               # Quantum-Inspired Algorithms (Simulated Annealing)
└── training/                       # Self-Learning Modules
    ├── feedback_loop.py            # RLHF Data Collector
    └── fine_tuning.py              # LoRA Adapter Managers
```

### 4. `backend/mcp` (Communication Layer)
Enables standardized, secure tool usage for Agents.
```text
backend/mcp/
├── server.py                       # MCP Server Host
├── protocol/                       # JSON-RPC Message Schemas
│   ├── requests.py
│   └── responses.py
├── transport/                      # Transports (Stdio, SSE, WebSocket)
└── registry/                       # Tool & Resource Catalog
    ├── tools/                      # Executable Functions
    │   ├── database_tools.py       # SQL/Cypher Readers
    │   ├── search_tools.py         # Vector Searchers
    │   └── file_tools.py           # File System Access
    └── resources/                  # Static Data Access
```

---

## 📂 Frontend Deep Dive (`frontend/web`)

Next.js 14+ Application with "Offline-First" capabilities.

```text
frontend/web/
├── src/
│   ├── app/                        # App Router
│   │   ├── (dashboard)/            # Authenticated Routes
│   │   │   ├── learn/[nodeId]/     # 🎓 The Learning Interface
│   │   │   └── profile/            # Student Stats & Settings
│   │   ├── (admin)/                # Educator/Admin Routes
│   │   │   ├── governance/         # 🛡️ Data Privacy & Policies
│   │   │   └── experimentation/    # 🧪 A/B Test Configs
│   │   └── offline/                # Offline Fallback Pages
│   ├── components/
│   │   ├── ai/                     # AI Chat/Interaction Widgets
│   │   ├── visualization/          # Knowledge Graphs (D3/Vis.js)
│   │   └── ui/                     # Design System (Shadcn)
│   ├── lib/
│   │   ├── sync/                   # 🔄 WatermelonDB/RxDB Sync Logic
│   │   ├── analytics/              # Telemetry (Clickstream, Gaze)
│   │   └── mcp-client/             # Frontend MCP Client
│   └── workers/                    # Service Workers (Background Sync)
├── public/                         # Static Assets
└── next.config.js                  # PWA & Edge Config
```

---

## 🛡️ Governance & Experimentation (`data/` & `infrastructure/`)

Specialized structures for Enterprise requirements.

*   **Experimentation**:
    *   `backend/lib/experiments.py`: Feature Flag & A/B Testing Logic.
    *   `data/analytics/causal_inference.sql`: Scripts to run Causal Analysis on collected data.
*   **Privacy & Safety**:
    *   `backend/ai_engine/swarm/guardian.py`: Real-time PII redaction and Topic filtering.
    *   `docs/GOVERNANCE.md`: Legal contracts and compliance checklists.

---

## ✅ Recommended Next Steps

Per the canonical strategy, execute in this order:

1.  **Generate `docs/ARCHITECTURE.md`** -> Detailed data flow diagrams (Mermaid) between `backend/app` and `backend/ai_engine`.
2.  **Generate `docs/MCP_PROTOCOL.md`** -> Define the exact JSON Schema for an "Agent Message" and "Tool Call".
3.  **Scaffold `backend/ai_engine`** -> Create the `BaseAgent` class and the `Orchestrator` skeleton.
4.  **Implement `backend/learner_profile`** -> Basic BKT model setup.
5.  **Security Review** -> Create the Governance/GDPR enforcement logic.
