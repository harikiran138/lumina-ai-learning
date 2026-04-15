# Lumina System Documentation

Document status: canonical runtime documentation after repo cleanup on 2026-04-15.

This file documents the current system boundary that still exists in the repository. Older audit notes in `vault/05_Reports` may mention deleted test harnesses, demo scripts, or temporary prototypes; those reports are historical, not canonical.

## 1. Current Runtime Boundary

The active product runtime is:

- Frontend: `frontend/web`
- Backend: `backend/app`
- Backend AI support: `backend/ai_engine`
- Learner modeling support: `backend/learner_profile`
- MCP support: `backend/mcp`
- ML service container: `backend/ml_services`
- Database and migrations: `supabase`, `backend/app/database/migrations`, `migrations`

## 2. Frontend System

### 2.1 Entry Points

| Path | Purpose |
|---|---|
| `frontend/web/src/app/page.tsx` | Landing page |
| `frontend/web/src/app/layout.tsx` | Root app layout |
| `frontend/web/src/app/login/page.tsx` | Login surface |
| `frontend/web/src/app/onboarding/page.tsx` | Onboarding entry |
| `frontend/web/src/app/student/*` | Student portal |
| `frontend/web/src/app/teacher/*` | Teacher portal |
| `frontend/web/src/app/admin/*` | Admin portal |
| `frontend/web/src/app/counselor/*` | Counselor portal |
| `frontend/web/src/app/parent/*` | Parent portal |
| `frontend/web/src/app/hod/*` | HOD portal |

### 2.2 Frontend Internal Modules

| Path | Role |
|---|---|
| `frontend/web/src/components` | Shared UI and portal components |
| `frontend/web/src/features` | Feature-grouped implementation areas |
| `frontend/web/src/lib` | API client, schemas, AI tutor helpers, shared logic |
| `frontend/web/src/store` | Client-side auth and onboarding state |
| `frontend/web/src/hooks` | Custom React hooks |
| `frontend/web/src/types` | Shared frontend types |

### 2.3 Frontend Notes

- The web app is the only current primary frontend.
- `frontend/flutter_app` and `frontend/mobile_preview` remain in the repo as supporting mobile concepts, not the main product runtime.
- Test folders and e2e suites were removed from the active repo surface during cleanup.

## 3. Backend System

### 3.1 Entry Points

| Path | Purpose |
|---|---|
| `backend/app/main.py` | Main FastAPI application |
| `backend/app/dependencies.py` | Shared dependency and auth helpers |
| `backend/api/index.py` | Vercel Python entrypoint |
| `backend/app/worker.py` | Background worker entrypoint |

### 3.2 Backend Internal Modules

| Path | Role |
|---|---|
| `backend/app/routers` | HTTP route handlers by domain |
| `backend/app/services` | Business services and orchestration |
| `backend/app/store` | Data access and persistence helpers |
| `backend/app/core` | Config, security, metrics, audit, and middleware support |
| `backend/app/database` | Database access, scoped DB, SQL, and migrations |
| `backend/app/pathway` | Pathway recommendation logic |
| `backend/app/personalization` | Learner analytics and personalization logic |
| `backend/app/rag` | Retrieval-augmented generation pipeline support |
| `backend/app/assessment` | Assessment engine and assessment APIs |
| `backend/app/automation` | Automation-related backend logic |
| `backend/app/background` | Background processing helpers |

### 3.3 Backend Support Modules

| Path | Role |
|---|---|
| `backend/ai_engine` | Tutor, AI routing, prompt, and swarm support |
| `backend/learner_profile` | Learner-profile helper package |
| `backend/mcp` | MCP server, registry, and protocol |
| `backend/ml_services` | ML service Dockerized runtime |
| `backend/lib` | Small supporting backend utilities |

### 3.4 Backend Notes

- The deleted `backend/src` Node/TypeScript service is no longer part of the current runtime.
- The removed `backend/tests` directory is no longer part of the canonical structure.
- Local JSON data in `backend/data` is retained only as support and fallback data, not as the source of truth for production state.
- The canonical teacher-reviewed tutor path is `backend/app/routers/ai_queue.py`.
- `backend/ai_engine` is an adapter and compatibility layer over the maintained backend services, not a separate production graph runtime.
- `backend/app/routers/dropout.py` currently exposes the maintained weighted-risk analysis service. It should not be described as a live XGBoost/SHAP model-serving stack unless that implementation is added.

## 4. Supporting Systems Kept In Repo

These systems remain intentionally:

| Path | Why It Exists |
|---|---|
| `ml` | Shared ML workspace and OCR/model code |
| `Analytics-Agent` | Analytics agent package and supporting docs |
| `pathway agent` | Pathway training and standalone experimentation workspace |
| `training` | Data prep and training scripts |
| `automation` | Workflow automation helpers |

## 5. Documentation Boundary

| Path | Meaning |
|---|---|
| `vault/01_Core` | Canonical structure and operating docs |
| `vault/00_Meta` | Maps, catalogs, and navigation docs |
| `vault/02_Technical_Specs` | Detailed product and architecture specifications |
| `vault/03_Infrastructure` | Setup and deployment documentation |
| `vault/04_Agents` | Agent-focused documents |
| `vault/05_Reports` | Historical reports and audit snapshots |
| `vault/06_Internal` | Internal skill and working notes |

## 6. Historical Note

Do not treat these as current structure sources of truth:

- path references inside `vault/05_Reports`
- old task lists that still mention `backend/tests` or `frontend/web/src/__tests__`
- old report references to `demo_scripts`, root `scripts`, or deleted prototypes

For the live codebase structure, use:

- [[PROJECT_STRUCTURE]]
- [[DOC_CODE_RELATIONSHIP_MAP]]
- [[../00_Meta/MODULE_MAP|MODULE_MAP]]

## 7. Deployment And Migration Distinction

- `deploy/` is the operational deployment asset folder for nginx and host-side deployment helpers.
- `deployment/aws/` is the AWS-specific provisioning and deployment automation area.
- `supabase/migrations/` is the canonical versioned migration history.
- `migrations/` contains supplemental root-level SQL patches kept for manual reconciliation and review.
