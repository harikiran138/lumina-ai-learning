# Lumina AI Learning

Lumina is an AI-assisted learning platform for institutional teaching workflows. The active product is a Next.js web app backed by a FastAPI service layer, with teacher-governed AI tutoring, learner analytics, OCR support, and academic workflow tooling.

## Active Runtime

- `frontend/web`: primary Next.js application
- `backend/app`: primary FastAPI API, routers, services, stores, and worker logic
- `backend/ai_engine`: compatibility and orchestration layer for tutor, pathway, OCR, and LLM routing
- `backend/learner_profile`, `backend/mcp`, `backend/ml_services`: backend support packages
- `supabase`: versioned database migrations
- `vault`: canonical architecture and project documentation

## AI And Governance Notes

- The canonical student tutor flow is the teacher-reviewed queue in `backend/app/routers/ai_queue.py`.
- `backend/ai_engine` is an adapter/support layer over the maintained backend services. It is not a separate fully independent runtime.
- Dropout analytics currently expose the maintained weighted-risk service surface. The repo does not claim a live production XGBoost/SHAP serving stack unless that implementation is added later.
- Handwriting support uses the current OCR pipeline in `backend/app/services/ocr_service.py`, which includes TrOCR-capable paths and confidence-gated review handling.

## Repo Organization

- `deploy/`: all deployment assets — `nginx/` (host/VM configs), `aws/` (cloud provisioning & bootstrap scripts)
- `supabase/migrations/`: all versioned SQL migrations managed by the Supabase CLI
- `Analytics-Agent/`, `ml/`, `pathway agent/`, `training/`: supporting or experimental subsystems retained intentionally

## Local Start

```bash
./start_backend.sh
./start_frontend.sh
docker-compose up --build
```

## Documentation

- Start with `vault/START_HERE.md`
- Structure reference: `vault/01_Core/PROJECT_STRUCTURE.md`
- Runtime reference: `vault/01_Core/SYSTEM_DOCUMENTATION.md`
- Doc-to-code map: `vault/01_Core/DOC_CODE_RELATIONSHIP_MAP.md`
- Engineering architecture: `ARCHITECTURE_STATUS.md`
