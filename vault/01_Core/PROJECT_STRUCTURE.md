# Lumina Project Structure

Document status: canonical repo structure after cleanup on 2026-04-15.

This is the authoritative structure document for the repository. If another vault note or old report disagrees with this file, trust this file.

## 1. Active Product Surface

These folders define the main application that should be treated as the current product runtime:

| Path | Category | Purpose |
|---|---|---|
| `frontend/web` | Frontend | Main Next.js web application |
| `backend/app` | Backend | Main FastAPI API, routing, services, stores, and business logic |
| `backend/ai_engine` | Backend AI | Tutor, routing, prompt, and AI orchestration support |
| `backend/learner_profile` | Backend ML support | Learner modeling and analysis helpers |
| `backend/mcp` | Backend protocol | MCP server and protocol implementation |
| `backend/ml_services` | Backend ML service | Separate ML-service container code |
| `supabase` | Database | Supabase config and migrations |
| `migrations` | Database support | Supplemental root-level SQL patches kept for reconciliation |

## 2. Supporting Product Systems

These folders are kept because they support the platform, experiments, or specialized subsystems, but they are not the primary day-to-day runtime boundary:

| Path | Category | Purpose |
|---|---|---|
| `ml` | ML workspace | Shared ML agents, OCR, embeddings, model logic |
| `automation` | Automation | Academic and workflow automation flows |
| `Analytics-Agent` | Supporting agent | Standalone analytics agent package and docs |
| `pathway agent` | Pathway workspace | Standalone training and pathway experimentation assets |
| `training` | Training workspace | Dataset preparation, training, and serving helpers |
| `frontend/flutter_app` | Mobile concept | Flutter mobile scaffold |
| `frontend/mobile_preview` | Mobile concept | Lightweight mobile preview scaffold |

## 3. Infrastructure And Deployment

| Path | Purpose |
|---|---|
| `deploy` | Canonical host-side deployment scripts and nginx assets |
| `deployment/aws` | AWS provisioning and deployment automation |
| `infra` | Local infrastructure assets for Docker, nginx, MinIO, Neo4j |
| `.github/workflows` | CI and deployment workflows |
| `docker-compose.yml` | Local multi-service stack |
| `docker-compose.prod.yml` | Production-oriented compose definition |
| `vercel.json` | Root Vercel proxy/build configuration |

## 4. Documentation Surface

| Path | Purpose |
|---|---|
| `README.md` | Root repository summary |
| `vault` | Full internal project knowledge base and architecture vault |
| `archive/legacy_sql` | Historical SQL snapshots intentionally preserved as archive |

## 5. Runtime Output Directories

These paths are expected to exist locally but should not be treated as source code:

| Path | Purpose |
|---|---|
| `backend/data/uploads` | Local upload storage |
| `backend/uploads` | Generated upload bundles |
| `data/uploads` | Additional runtime upload area |
| `static/presentations` | Generated PPT output |
| `backend/static/presentations` | Backend-generated presentation output |

## 6. Canonical Top-Level Tree

```text
lumina-ai-learning/
├── frontend/
│   ├── web/                    # Main web product
│   ├── flutter_app/            # Mobile scaffold
│   └── mobile_preview/         # Mobile preview scaffold
├── backend/
│   ├── app/                    # Main FastAPI app
│   ├── ai_engine/              # AI routing and tutor support
│   ├── learner_profile/        # Learner profiling support
│   ├── mcp/                    # MCP server and protocol
│   ├── ml_services/            # ML service container code
│   ├── api/                    # Vercel Python entrypoint
│   ├── data/                   # Local JSON/runtime data
│   ├── db/                     # Local vector/runtime DB area
│   ├── static/                 # Generated backend static files
│   └── uploads/                # Generated backend upload bundles
├── ml/                         # Shared ML workspace
├── automation/                 # Workflow automation package
├── Analytics-Agent/            # Supporting analytics agent
├── pathway agent/              # Standalone pathway workspace
├── training/                   # Training helpers and datasets
├── supabase/                   # Supabase migrations and config
├── migrations/                 # Additional migration assets
├── infra/                      # Infra resources
├── deploy/                     # Deployment support
├── deployment/                 # AWS deployment automation
├── vault/                      # Canonical documentation vault
└── archive/legacy_sql/         # Historical SQL archive
```

## 7. Ordering Rules

Use these rules when deciding whether a file belongs in the active repo surface:

1. Product code belongs under `frontend/web` or `backend`.
2. ML or experimental support belongs under `ml`, `Analytics-Agent`, `pathway agent`, or `training`.
3. Deployment logic belongs under `deploy`, `deployment`, `infra`, or `.github/workflows`.
4. Documentation belongs under `vault` unless it is the short root `README.md`.
5. Generated output, uploads, caches, and temporary verification artifacts do not belong in source control.
6. Versioned schema history belongs in `supabase/migrations`; root `migrations` is supplemental only.

## 8. Canonical Navigation

- Runtime overview: [[SYSTEM_DOCUMENTATION]]
- Doc-to-code mapping: [[DOC_CODE_RELATIONSHIP_MAP]]
- Folder-to-domain mapping: [[../00_Meta/MODULE_MAP|MODULE_MAP]]
- Vault entrypoint: [[../START_HERE|START_HERE]]
