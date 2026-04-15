# Lumina LMS - Project Structure Guide

**Last Updated:** April 15, 2026  
**Project:** Lumina Learning Management System (B.Tech CSE Capstone)  
**Institution:** NSRIT (Nadimpalli Satyanarayana Raju Institute of Technology)

---

## 📁 Project Organization

```
lumina-ai-learning/
├── 📄 README.md                      # Main project documentation
├── 📄 package.json & package-lock    # NPM dependencies
├── 📄 vercel.json                    # Vercel deployment config
├── 📄 skills-lock.json               # GitHub Copilot skills
│
├── 🚀 Entry Scripts
│   ├── start_backend.sh              # Start FastAPI server (port 9000)
│   ├── start_frontend.sh             # Start Next.js frontend
│   ├── run_local.sh                  # Local development setup
│   └── run_lumina.py                 # Python orchestration script
│
├── 📚 Documentation
│   ├── docs/                         # Active documentation
│   │   ├── README_ONBOARDING.md      # Onboarding system guide
│   │   ├── VAULT_AUDIT_REPORT.md     # System health audit (Apr 15)
│   │   └── QUICK_REFERENCE.md        # Quick start guide
│   │
│   └── archives/                     # Completed/historical reports
│       ├── CLEANUP_VERIFICATION_REPORT.md
│       ├── DEPLOYMENT_APPROVAL_CHECKLIST.md
│       ├── FINAL_VERIFICATION_REPORT.md
│       └── ... (10 archived files)
│
├── 🔧 Deployment & Scripts
│   ├── scripts/
│   │   ├── deploy-onboarding.sh      # Deploy onboarding system
│   │   ├── deployment-readiness-check.sh
│   │   └── setup_local_ai.sh         # Setup local AI services
│   │
│   ├── deploy/
│   │   ├── aws/                      # AWS deployment configs
│   │   ├── nginx/                    # Nginx configs
│   │   └── README.md
│   │
│   └── infra/
│       ├── docker/                   # Docker configs
│       ├── minio/                    # MinIO S3 storage
│       ├── neo4j/                    # Neo4j graph DB
│       └── nginx/                    # Nginx setup
│
├── 🎯 Core Services
│   ├── backend/                      # FastAPI Backend (1.8GB)
│   │   ├── app/                      # FastAPI application
│   │   │   ├── main.py               # FastAPI entry
│   │   │   ├── routers/              # API route handlers
│   │   │   │   ├── auth.py           # Auth endpoints (10 routes)
│   │   │   │   ├── courses.py
│   │   │   │   ├── analytics.py
│   │   │   │   └── ...
│   │   │   ├── models/               # SQLAlchemy models
│   │   │   ├── database/             # DB connection
│   │   │   └── core/                 # Config, logging, security
│   │   ├── ai_engine/                # LangGraph AI orchestration
│   │   ├── ml_services/              # ML endpoints
│   │   ├── mcp/                      # Model Context Protocol
│   │   ├── migrations/               # Database migrations (11 files)
│   │   ├── tests/                    # Integration tests
│   │   ├── requirements.txt          # Python dependencies
│   │   ├── Dockerfile                # Container config
│   │   └── .venv/                    # Virtual environment
│   │
│   ├── frontend/                     # Next.js Frontend (986MB)
│   │   ├── web/                      # Next.js 15 app
│   │   │   ├── app/                  # App routes
│   │   │   ├── components/           # React components
│   │   │   ├── lib/                  # Utilities
│   │   │   ├── styles/               # Tailwind CSS
│   │   │   └── node_modules/         # Dependencies
│   │   ├── flutter_app/              # Flutter mobile (experimental)
│   │   └── mobile_preview/           # Mobile preview
│   │
│   └── supabase/                     # Supabase config
│       ├── migrations/               # DB migration scripts
│       ├── seed.sql                  # Initial seed
│       └── config.toml
│
├── 🤖 AI & ML
│   ├── ai_engine/                    # [Duplicate note: also in backend]
│   ├── ml/                           # ML models and embeddings (1.3MB)
│   │   ├── agents/                   # Agent implementations
│   │   ├── embeddings/               # Embedding models
│   │   ├── models/                   # ML models
│   │   ├── ocr/                      # OCR processing
│   │   └── rag/                      # RAG systems
│   │
│   ├── pathway agent/                # Pathway data processing (8.7MB)
│   │   ├── agents/                   # Pathway agents
│   │   ├── api/                      # API endpoints
│   │   ├── optimization/             # Performance tuning
│   │   ├── rl/                       # Reinforcement learning
│   │   └── schemas/                  # Data schemas
│   │
│   └── Analytics-Agent/              # Analytics processing (180KB)
│       ├── analytics_agent/          # Agent code
│       ├── data/                     # Sample data
│       ├── simulation.py
│       └── requirements.txt
│
├── 📊 Data & Training
│   ├── data/                         # Runtime data
│   │   ├── analytics/
│   │   ├── uploads/
│   │   └── .gitkeep
│   │
│   ├── training/                     # ML training scripts (44MB)
│   │   ├── train.py
│   │   ├── evaluate.py
│   │   ├── prepare_data.py
│   │   ├── serve.py
│   │   ├── data/
│   │   └── requirements.txt
│   │
│   └── static/                       # Static assets
│       └── presentations/
│
├── 🏗️ Documentation & Knowledge
│   ├── vault/                        # Obsidian vault (3.6MB)
│   │   ├── lumina-lms-vault/         # Main vault
│   │   │   ├── 00-overview/          # Project overview
│   │   │   ├── 01-architecture/      # System architecture
│   │   │   ├── 02-roles/             # 11 User roles
│   │   │   ├── 03-agents/            # 6-7 AI agents
│   │   │   ├── 04-data-flow/         # User workflows
│   │   │   ├── 05-prompts/           # Agent prompts
│   │   │   ├── 06-auth/              # Auth system
│   │   │   ├── 07-operations/        # Operations
│   │   │   ├── 08-features/          # Features
│   │   │   ├── 09-api/               # API spec
│   │   │   ├── 10-diagrams/          # Diagrams
│   │   │   └── README.md
│   │   │
│   │   └── 00_Meta/ through 06_Internal/  # Additional organization
│   │
│   └── skills/                       # GitHub Copilot skills
│       ├── supabase-postgres-best-practices/
│       ├── mcp-builder/
│       ├── webapp-testing/
│       └── ... (15+ skills)
│
├── 🔌 Automation & Config
│   ├── automation/                   # Automation scripts
│   │   ├── config.py
│   │   ├── logger.py
│   │   ├── seed.py
│   │   ├── services.py
│   │   └── flows/
│   │
│   ├── .github/                      # GitHub workflows
│   │   └── workflows/
│   │
│   ├── .claude/                      # Claude AI preferences
│   ├── .agent/                       # Agent configurations
│   ├── .opencode/                    # OpenCode config
│   ├── .obsidian/                    # Obsidian vault settings
│   │
│   ├── .gitignore                    # Git ignore rules
│   ├── .mcp.json                     # MCP configuration
│   ├── .claude.json                  # Claude config
│   │
│   └── Makefile                      # Build automation
│   └── prometheus.yml                # Prometheus config
│
└── .git/                             # Git repository
```

---

## 🔒 Gitignore Status

**Properly Ignored (Not Committed):**
- ✅ `.venv/` and `venv/` - Virtual environments
- ✅ `node_modules/` - NPM dependencies
- ✅ `__pycache__/` - Python cache
- ✅ `.env` - Environment variables
- ✅ Backend data uploads
- ✅ `.next/`, `dist/`, `build/` - Build artifacts

---

## 📊 Project Size Breakdown

| Component | Size | Status |
|-----------|------|--------|
| **Total Project** | 2.9GB | ✅ Healthy |
| backend/ | 1.8GB | ✅ Monolith structure |
| frontend/web/node_modules | 986MB | ✅ Cached dependencies |
| training/ | 44MB | ✅ ML training data |
| skills/ | 9.4MB | ✅ Skills collection |
| pathway agent/ | 8.7MB | ✅ Data processing |
| vault/ | 3.6MB | ✅ Documentation |

---

## 🏛️ Architecture Overview

### Three-Service Architecture
```
┌──────────────────────┐
│  Frontend (Next.js)  │ ← port 3000
├─────────────────────┤
│ Backend (FastAPI)   │ ← port 9000
├─────────────────────┤
│ AI Engine (Pathway) │
├─────────────────────┤
│ Database (Postgres) │ ← Supabase
└─────────────────────┘
```

### Key Components
- **11 User Roles** - Fully documented and implemented
- **6-7 AI Agents** - Course, Tutor, Grading, Curriculum, Reporting agents
- **JWT Auth** - Multi-tenant with institution_id scoping
- **Multi-tenancy** - institution_id isolation enforced
- **Queue System** - TILA pattern (Teacher-mediated AI)

---

## ✅ Cleanup Actions Completed (Apr 15, 2026)

1. ✅ Removed `.DS_Store` files (macOS junk)
2. ✅ Created `docs/` folder for active documentation
3. ✅ Created `archives/` folder for completed reports
4. ✅ Created `scripts/` folder for deployment scripts
5. ✅ Moved 10 audit reports to `archives/`
6. ✅ Moved 3 documentation files to `docs/`
7. ✅ Moved 3 deployment scripts to `scripts/`
8. ✅ Consolidated old `archive/` into `archives/`
9. ✅ Verified `.gitignore` is comprehensive
10. ✅ Confirmed all core services are operational

---

## 🚀 Quick Start Commands

```bash
# Start backend (FastAPI on port 9000)
./start_backend.sh

# Start frontend (Next.js on port 3000)
./start_frontend.sh

# Full local setup
./run_local.sh

# Deploy onboarding system
./scripts/deploy-onboarding.sh

# Check deployment readiness
./scripts/deployment-readiness-check.sh
```

---

## 📋 Current System Status

**Overall:** ✅ **HEALTHY & ORGANIZED** (85% completeness)

- ✅ All 11 roles implemented
- ✅ All 6-7 agents documented
- ✅ Backend running and responding
- ✅ Database migrations present (11 files)
- ✅ Documentation complete (61 vault files)
- ⚠️ 2 minor documentation path corrections (FIXED Apr 15)
- ✅ Project structure properly organized

---

## 📖 Documentation Locations

| What | Where |
|------|-------|
| **Main README** | `/README.md` |
| **Onboarding Docs** | `/docs/README_ONBOARDING.md` |
| **System Audit** | `/docs/VAULT_AUDIT_REPORT.md` |
| **Quick Reference** | `/docs/QUICK_REFERENCE.md` |
| **Complete Vault** | `/vault/lumina-lms-vault/` (61 markdown files) |
| **Historical Reports** | `/archives/` (10 files) |

---

**Project maintained and organized by GitHub Copilot**  
**Last organization pass:** April 15, 2026
