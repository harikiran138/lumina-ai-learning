# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Core Development Commands

### Run full stack with Docker (recommended for local dev)

From the repo root (`lumina-ai-learning/`):

```bash
docker-compose up --build
```

This starts:
- Postgres and Redis plus the backend/frontend application services
- Backend FastAPI service on `http://localhost:8000`
- Frontend Next.js app on `http://localhost:3000` (configured to talk to the backend via `NEXT_PUBLIC_API_URL`).

To rebuild after code changes in backend/frontend images:

```bash
docker-compose up --build backend frontend
```

### Frontend (Next.js web app in `frontend/web`)

From the repo root (uses the root `package.json` as a thin wrapper):

```bash
npm run dev           # cd frontend/web && next dev
```

Or directly inside the app:

```bash
cd frontend/web
npm install           # first-time setup
npm run dev           # dev server on http://localhost:3000
npm run build         # production build
npm start             # run built app
npm run lint          # lint
```

Deployment-related commands:
- `npm run deploy` from `frontend/web` runs `firebase deploy`.
- Vercel deployment and environment-variable setup are described in `DEPLOYMENT.md` and typically use the `vercel` CLI (`vercel`, `vercel --prod`, `vercel env add ...`).

### Backend (FastAPI API in `backend/`)

Backend Python dependencies:

```bash
python -m venv .venv
source .venv/bin/activate
pip install -r backend/requirements.txt
```

Run the main API server directly (without Docker):

```bash
cd backend
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

This serves:
- Health and root endpoints (`/`, `/health`)
- Core API routes under `/api/...` (AI, handwriting, assignments, courses, auth, assessment).

Minimal handwriting/PDF-only backend (bypassing the full stack):

```bash
cd backend
python minimal_server.py    # exposes /api/handwriting/... and health endpoints
```

### Analytics Agent and handwriting ML service

**Analytics Agent (`Analytics-Agent/`):**

```bash
cd Analytics-Agent
python run_agent.py      # run a demonstration scenario
python simulation.py     # stress-test / simulation
pytest                   # run agent test suite
```

**Handwriting ML service prototype (`Handwriting_Analysis_Project/ml_service`):**

```bash
cd Handwriting_Analysis_Project/ml_service
pip install -r requirements.txt
uvicorn api.server:app --reload --host 0.0.0.0 --port 9000
```

This exposes a standalone FastAPI service with `/analyze` and `/health` for handwriting recognition and scoring.

### Tests and example flows

Most tests are plain `pytest` tests and a few integration scripts that expect a running backend at `http://localhost:8000`.

From the repo root:

```bash
# Backend unit/component tests (RAG, assessment engine, etc.)
pytest backend/tests

# Analytics Agent tests
cd Analytics-Agent && pytest

# High-level handwriting grading flow (requires backend API running)
pytest tests/test_grading_flow.py

# End-to-end course & assignment API flow (requires backend API running)
python backend/tests/test_full_flow.py
```

Run a single backend test:

```bash
pytest backend/tests/test_rag_pipeline.py::test_rag_pipeline
```

## Architecture Overview

### Monorepo layout

At a high level this repo combines:
- A FastAPI-based backend (`backend/`) with AI/RAG/agent logic, learner profiling, and REST APIs
- A Next.js 15 web app (`frontend/web/`) that provides Luminas UI
- Standalone agent and ML prototypes (`Analytics-Agent/`, `Handwriting_Analysis_Project/`)
- Design and governance docs in `docs/` and `PROJECT_STRUCTURE.md` that describe the target architecture.

The top-level `README.md` describes the *aspirational* Lumina platform (multi-agent AI, RAG, governance, infra). The actual implementation captured here is a focused subset of that design, organized largely as described in `PROJECT_STRUCTURE.md`.

### Backend (`backend/`)

The backend is a monolithic FastAPI service structured into several domains that mirror the conceptual architecture from `PROJECT_STRUCTURE.md`:

- `backend/app/`
  - `main.py` constructs the FastAPI app, sets up CORS, mounts `/uploads`, wires the shared database adapter via `app.database.manager`, and includes routers from `backend/routers` and the assessment API under `/api/assessment`.
  - `core/` contains settings (`config.py`) and security primitives (JWT/token helpers).
  - `database/manager.py` exposes the shared Supabase-backed database adapter used by the app.
  - `assessment/` is a self-contained adaptive assessment subsystem with:
    - `api/` (HTTP router/endpoints),
    - `engine/` (adaptive_logic, knowledge_tracing, policy_engine, session_manager), and
    - `llm/` (assessment-specific LLM generators).

- `backend/routers/`
  - `auth.py` handles registration/login and JWT-based auth around a simple `UserStore`.
  - `courses.py` and `assignments.py` manage course definitions, assignment creation, file uploads, submission tracking, and AI-based grading.
  - Additional routers (`ai.py`, `handwriting.py`, etc.) provide AI-centric endpoints used by the frontend.

- `backend/store/`
  - `course_store.py`, `assignment_store.py`, `user_store.py` encapsulate persistence logic on top of Supabase/PostgreSQL and the local JSON fallback; API routers largely delegate to these.

- `backend/ai_engine/`
  - `llm.py` abstracts over LLM providers (Ollama by default, Gemini when `GEMINI_API_KEY` is set) behind a simple `LLMProvider` interface.
  - `rag.py` implements an end-to-end RAG engine using ChromaDB, SentenceTransformers, and a CrossEncoder reranker. A singleton accessor (`get_rag_engine`) is used throughout the backend.
  - `swarm/` defines specialized agents (`tutor.py`, `pathway.py`, `assessment.py`, `intervention.py`, `guardian.py`, `handwriting_agent.py`) plus an `Orchestrator` that routes requests to the right agent based on simple context.
  - `training/` contains feedback-loop and fine-tuning scaffolding for RLHF/LoRA-style improvements.

- `backend/learner_profile/`
  - Implements an early learner modeling engine with pluggable models (`bkt.py`, `dkt.py`, `behavior.py`), a `StateStore` for persisting learner state, and `analysis/` modules such as `cognitive_load.py` and `gaps.py`.
  - `engine.py` provides the high-level `LearnerProfileEngine` entry point used by other subsystems to read/update learner profiles.

- `backend/mcp/`
  - A minimal skeleton of an MCP server (`server.py`) plus protocol and tool registry scaffolding.
  - Currently mostly structural; treat it as a placeholder for future integration rather than a fully wired component.

- `backend/tests/`
  - Mix of focused unit tests (e.g. `test_rag_pipeline.py`, assessment engine tests) and light-weight API-like tests that construct small FastAPI apps using only specific routers.
  - These are good references for how the assessment engine and RAG engine are expected to behave.

In addition, there are standalone scripts in `backend/scripts/` and root-level `debug_*.py` files for manual verification of the assessment and RAG flows.

### Frontend (`frontend/web/`)

The main user-facing app is a Next.js 15 project:

- `frontend/web/src/app/`
  - Uses the App Router with separate layouts for `admin`, `teacher`, and `student` dashboards plus routes like `/dashboard`, `/login`, `/ai-tutor-test`.
  - Server actions and API-calling utilities live under `src/app/actions/` (`ai.ts`, `auth.ts`, `data.ts`, `gemini.ts`), and generally call into the FastAPI backend at `NEXT_PUBLIC_API_URL`.

- `frontend/web/src/lib/`
  - `ai-pipeline.ts` and the `ai-tutor/` directory encapsulate the client-side RAG and tutoring pipeline.
  - API utilities and lightweight local persistence helpers coordinate frontend interaction with the FastAPI backend.

- `frontend/web/src/components/`
  - Houses reusable UI building blocks for dashboards and the marketing/home experience.

- Legacy/static content:
  - `frontend/web/student/`, `frontend/web/teacher/`, and `frontend/web/src/js/` contain HTML/JS-based prototypes and utility scripts (e.g. community chat, dashboards) from earlier iterations.
  - New functionality should generally target the React/Next.js app in `src/app` and `src/components`; the static pages are mostly backward-compatible scaffolding.

### Analytics Agent (`Analytics-Agent/`)

This is a separate, well-documented Python package that models learner engagement, cognitive load, mastery, and dropout risk:

- Core package lives in `Analytics-Agent/analytics_agent/` with submodules for agents, models, core signal processing, storage, and services.
- `Analytics-Agent/PROJECT_MANUAL.md` and the `docs/` folder describe the signal-to-insight pipeline, internal state, and evaluation methodology.
- Tests in `Analytics-Agent/tests/` cover initialization, signal processing, model behavior, and ingestion.

The Analytics Agent is conceptually aligned with `backend/learner_profile` and the broader multi-agent story in `README.md`, but is currently a standalone service rather than fully wired into the FastAPI app.

### Handwriting prototypes

There are two complementary approaches to handwriting analysis:

- The main backend path: `backend/ai_engine/swarm/handwriting_agent.py`, `backend/services/ocr_service.py`, and the `/api/assignments/...` grading flow (see `tests/test_grading_flow.py`). This path is what the current backend uses for AI-assisted grading workflows.
- A more ML-heavy prototype service in `Handwriting_Analysis_Project/ml_service/` with its own FastAPI app (`api/server.py`) that loads a TrOCR model and scoring logic. This can be run independently when doing deeper handwriting model work.

### Documentation and design references

- `README.md`  high-level product description, target system architecture (including multi-agent AI layer, RAG pipeline, and infra expectations). Treat this as conceptual guidance rather than a strict reflection of the current code layout.
- `PROJECT_STRUCTURE.md`  describes the intended monorepo structure for backend, frontend, infrastructure, and data. The implemented backend and frontend largely follow this contract.
- `DEPLOYMENT.md`  concrete instructions for deploying the Next.js app to Vercel or Firebase, including environment-variable setup.
- `docs/ARCHITECTURE.md`, `docs/MCP_PROTOCOL.md`, `docs/API_SPEC.md`, `docs/GOVERNANCE.md`  stubs/placeholders for deeper architecture/protocol/governance docs that can be filled in as the implementation matures.
