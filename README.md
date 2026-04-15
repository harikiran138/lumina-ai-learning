# Lumina AI Learning

Lumina is organized around one main product:

- `frontend/web`: Next.js web application
- `backend`: FastAPI backend and service layer
- `ml`: supporting ML agents, OCR, and model logic used by the platform
- `automation`: workflow automation helpers
- `infra`, `deployment`, `deploy`, `docker-compose*.yml`: infrastructure and deployment support
- `supabase`, `migrations`: database schema and migration assets
- `vault`: product, architecture, and implementation documentation
- `archive`: legacy material intentionally kept out of the active app surface

## What Was Cleaned

The repo cleanup removes non-core clutter such as:

- disposable test suites and test-only scripts
- demo and verification scripts
- generated build output and local cache directories
- runtime upload artifacts and generated presentation files
- duplicate standalone prototypes that are not part of the main app runtime
- stale helper scripts like ad-hoc cleanup and deploy wrappers

## Main Development Paths

- Frontend app: `frontend/web`
- Backend app: `backend/app`
- Backend services: `backend/ai_engine`, `backend/ml_services`, `backend/mcp`
- ML support: `ml`
- Documentation: `vault`

## Common Commands

```bash
npm run dev
./start_backend.sh
./start_frontend.sh
docker-compose up --build
```

## Notes

- Runtime artifacts such as uploads, local caches, generated presentations, and local build output are now ignored by Git.
- The repo intentionally keeps documentation in `vault` instead of spreading large design documents across the root.
