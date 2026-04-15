# Lumina Vault — Organization Index & Project Status

**Last Updated:** 15 April 2026  
**Status:** 🟢 PRODUCTION READY  
**Purpose:** Clean, sorted index of all vault documents with current project state

---

## 📋 HOW TO USE THIS VAULT

1. **For Current Project State:** Read [`PROJECT_CURRENT_STATE.md`](#project-current-state) below
2. **For Specific Topics:** Use section links in this index
3. **For Code Integration:** See [`01_Core/DOC_CODE_RELATIONSHIP_MAP.md`](01_Core/DOC_CODE_RELATIONSHIP_MAP.md)
4. **For Active Tasks:** Check [`01_Core/L_ACTIVE_ASSISTANCE_TASKS.md`](01_Core/L_ACTIVE_ASSISTANCE_TASKS.md)

> **Important Rule:** If a document marked "HISTORICAL" conflicts with items in **CURRENT** section, trust CURRENT docs.

---

## 🟢 CURRENT PROJECT STATE

### Core Status (April 2026)

| Component | Status | Location | Completion |
|-----------|--------|----------|------------|
| **Onboarding System** | ✅ Production Ready | `02_Technical_Specs/ONBOARDING_PRODUCTION_HARDENING_COMPLETE.md` | 100% |
| **Authentication** | ✅ Complete | `backend/app/routers/auth.py` | 100% |
| **Database Schema** | ✅ Complete | `supabase/seed_production.sql` | 100% |
| **Role-Based Access** | ✅ Complete | `backend/app/core/rbac.py` | 100% |
| **11 Role Services** | ✅ Complete | `backend/app/services/onboarding/` | 100% |
| **API Router** | ✅ Complete | `backend/app/routers/onboarding_unified.py` | 100% |
| **Analytics Tracking** | ✅ Complete | `backend/app/migrations/onboarding_schema.sql` | 100% |
| **Verification Pipelines** | ✅ Complete | Database tables + services | 100% |

### What's Just Completed ✅

- **11 Role Onboarding Services** — All roles fully implemented with proper step-by-step flows
- **System Integration** — RBAC assignment, permission sync, role-specific post-setup hooks
- **Verification Pipelines** — For peer_tutor, researcher, counselor, content_creator
- **Analytics & Events** — Full event tracking with `onboarding_events` table
- **Standardized Responses** — `StandardOnboardingResponse` class for all endpoints
- **Production Hardening** — Step validation, transaction-based completion, error recovery

### Available Roles

| Role | Steps | Route | Verification | Status |
|------|-------|-------|--------------|--------|
| Student | 6 | `/onboarding/student` | None | ✅ Complete |
| Teacher | 5 | `/onboarding/teacher` | None | ✅ Complete |
| Parent | 4 | `/onboarding/parent` | None | ✅ Complete |
| Peer Tutor | 5 | `/onboarding/peer-tutor` | Mastery ≥80% | ✅ Complete |
| Mentor | 5 | `/onboarding/mentor` | None | ✅ Complete |
| Counselor | 5 | `/onboarding/counselor` | License | ✅ Complete |
| Content Creator | 4 | `/onboarding/content-creator` | Portfolio | ✅ Complete |
| Researcher | 5 | `/onboarding/researcher` | IRB Approval | ✅ Complete |
| Alumni | 4 | `/onboarding/alumni` | None | ✅ Complete |
| Admin | 3 | `/onboarding/admin` | None | ✅ Complete |
| HOD | 3 | `/onboarding/hod` | None | ✅ Complete |

---

## 📚 CANONICAL DOCUMENTS (CURRENT)

These are the **authoritative current-state documents**. Read these first.

### Project Overview
- [`01_Core/PROJECT_STRUCTURE.md`](01_Core/PROJECT_STRUCTURE.md) — Repository structure, folder purposes
- [`01_Core/SYSTEM_DOCUMENTATION.md`](01_Core/SYSTEM_DOCUMENTATION.md) — System architecture overview
- [`01_Core/DOC_CODE_RELATIONSHIP_MAP.md`](01_Core/DOC_CODE_RELATIONSHIP_MAP.md) — Maps docs to code locations

### Architecture & Design
- [`02_Technical_Specs/ARCHITECTURE.md`](02_Technical_Specs/ARCHITECTURE.md) — System architecture
- [`02_Technical_Specs/DATABASE_SCHEMA.md`](02_Technical_Specs/DATABASE_SCHEMA.md) — Current DB schema
- [`02_Technical_Specs/BACKEND_SPEC.md`](02_Technical_Specs/BACKEND_SPEC.md) — Backend structure
- [`02_Technical_Specs/FRONTEND_SPEC.md`](02_Technical_Specs/FRONTEND_SPEC.md) — Frontend structure

### Onboarding System (JUST COMPLETED ✅)
- **Master Specification:** [`COMPLETE_ONBOARDING_MASTER_PROMPT.md`](#) — 11 roles, all requirements
- **Implementation Status:** [`02_Technical_Specs/ONBOARDING_PRODUCTION_HARDENING_COMPLETE.md`](02_Technical_Specs/ONBOARDING_PRODUCTION_HARDENING_COMPLETE.md) — Production checklist ✅
- **Master Prompt Audit:** [`02_Technical_Specs/ONBOARDING_MASTER_PROMPT_IMPLEMENTATION_AUDIT.md`](02_Technical_Specs/ONBOARDING_MASTER_PROMPT_IMPLEMENTATION_AUDIT.md) — Spec compliance check
- **API Reference:** [`02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md`](02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md) — Endpoint docs
- **Architecture:** [`02_Technical_Specs/ROLE_BASED_ONBOARDING_ARCHITECTURE.md`](02_Technical_Specs/ROLE_BASED_ONBOARDING_ARCHITECTURE.md) — Design patterns

### Authentication & Security
- [`02_Technical_Specs/README_AUTH_SYSTEM.md`](02_Technical_Specs/README_AUTH_SYSTEM.md) — Auth flows, JWT setup
- [`02_Technical_Specs/AUTH_AND_ONBOARDING_FLOW.md`](02_Technical_Specs/AUTH_AND_ONBOARDING_FLOW.md) — Integration guide
- [`02_Technical_Specs/ROLES_AND_PERMISSIONS.md`](02_Technical_Specs/ROLES_AND_PERMISSIONS.md) — RBAC matrix

### API & Integration
- [`02_Technical_Specs/API_REFERENCE.md`](02_Technical_Specs/API_REFERENCE.md) — Comprehensive API docs
- [`02_Technical_Specs/BACKEND_API_MAP.md`](02_Technical_Specs/BACKEND_API_MAP.md) — API endpoint map

### Infrastructure
- [`03_Infrastructure/LOCAL_SETUP.md`](03_Infrastructure/LOCAL_SETUP.md) — Local dev setup
- [`03_Infrastructure/DEPLOYMENT_GUIDE.md`](03_Infrastructure/DEPLOYMENT_GUIDE.md) — Production deployment

---

## 🗂️ VAULT ORGANIZATION

### `00_Meta/` — Vault Navigation
High-level guidance for navigating the vault

- `MODULE_MAP.md` — Maps vault docs to features

### `01_Core/` — Project Foundations (ACTIVE)
Canonical documents defining current project state

- **PROJECT_STRUCTURE.md** — Repo structure (CANONICAL)
- **SYSTEM_DOCUMENTATION.md** — Architecture overview (CANONICAL)
- **DOC_CODE_RELATIONSHIP_MAP.md** — Doc → Code mapping (CANONICAL)
- **L_ACTIVE_ASSISTANCE_TASKS.md** — Current work items
- **L_PROJECT_BACKLOG.md** — Future work backlog
- **QUICK_REFERENCE.md** — Quick help
- **RESTORATION_PLAN.md** — Emergency recovery guide

### `02_Technical_Specs/` — Systems & Features (ACTIVE)
**Organized by subsystem:**

#### Onboarding (COMPLETE ✅)
- `ONBOARDING_PRODUCTION_HARDENING_COMPLETE.md` — [READ THIS] Production-ready checklist
- `ONBOARDING_MASTER_PROMPT_IMPLEMENTATION_AUDIT.md` — Spec compliance
- `ONBOARDING_API_COMPLETE_GUIDE.md` — API endpoints + examples
- `ROLE_BASED_ONBOARDING_ARCHITECTURE.md` — Design patterns

#### Authentication & Authorization
- `README_AUTH_SYSTEM.md` — [READ THIS] Auth system overview
- `AUTH_AND_ONBOARDING_FLOW.md` — Integration documentation
- `ROLES_AND_PERMISSIONS.md` — RBAC permission matrix

#### Architecture & Integration
- `ARCHITECTURE.md` — System architecture
- `DATABASE_SCHEMA.md` — DB structure
- `DATABASE_ARCHITECTURE_REPORT.md` — DB analysis
- `BACKEND_SPEC.md` — Backend organization
- `FRONTEND_SPEC.md` — Frontend organization
- `API_REFERENCE.md` — Complete API guide
- `BACKEND_API_MAP.md` — API endpoint catalog

#### Role-Specific Designs
- `STUDENT_ROLE.md` — Student system
- `TEACHER_ROLE.md` — Teacher system
- `ADMIN_ROLE.md` — Admin system

#### AI & ML Systems
- `AI_TUTOR_SYSTEM.md` — AI tutor architecture
- `STUDENT_INTELLIGENCE_LOOP.md` — Adaptive engine
- `ASSESSMENT_ENGINE.md` — Question & assessment system
- `AI_ENGINE.md` — AI service integration

#### Feature Specifications
- All other `.md` files in this folder relate to specific features

### `03_Infrastructure/` — Deployment & Setup (ACTIVE)
Deployment, infrastructure, local setup

- `LOCAL_SETUP.md` — Development environment setup
- `DEPLOYMENT_GUIDE.md` — Production deployment

### `04_Agents/` — AI Agent Documentation
MCP, agents, automation

### `05_Reports/` — Historical Audits
**Status:** HISTORICAL - reference only

Contains audit reports, snapshots, and historical investigation notes. Do NOT use these for current decisions unless canonical docs are unavailable.

### `06_Internal/` — Internal Notes
**Status:** HISTORICAL - reference only

Internal notes, conversation summaries, and working documents.

### `Features/` — Feature Backlog
**Status:** HISTORICAL - reference only

Older feature specifications and ideas.

---

## 🎯 QUICK NAVIGATION

### I need to...

| Need | Read |
|------|------|
| Set up the project locally | [`03_Infrastructure/LOCAL_SETUP.md`](03_Infrastructure/LOCAL_SETUP.md) |
| Understand the onboarding system | [`02_Technical_Specs/ONBOARDING_PRODUCTION_HARDENING_COMPLETE.md`](02_Technical_Specs/ONBOARDING_PRODUCTION_HARDENING_COMPLETE.md) |
| Check API endpoints | [`02_Technical_Specs/API_REFERENCE.md`](02_Technical_Specs/API_REFERENCE.md) |
| Understand authentication | [`02_Technical_Specs/README_AUTH_SYSTEM.md`](02_Technical_Specs/README_AUTH_SYSTEM.md) |
| Map code to documentation | [`01_Core/DOC_CODE_RELATIONSHIP_MAP.md`](01_Core/DOC_CODE_RELATIONSHIP_MAP.md) |
| See the complete DB schema | [`02_Technical_Specs/DATABASE_SCHEMA.md`](02_Technical_Specs/DATABASE_SCHEMA.md) |
| Check the onboarding spec | [`02_Technical_Specs/ONBOARDING_MASTER_PROMPT_IMPLEMENTATION_AUDIT.md`](02_Technical_Specs/ONBOARDING_MASTER_PROMPT_IMPLEMENTATION_AUDIT.md) |
| Find something specific | [`00_Meta/MODULE_MAP.md`](00_Meta/MODULE_MAP.md) |

---

## 🔧 VAULT MAINTENANCE

### Document Status Markers

| Marker | Meaning | Action |
|--------|---------|--------|
| ✅ CANONICAL | Current, authoritative | **Trust this. Use for decisions.** |
| 🟢 ACTIVE | Current work document | Use with confidence |
| 🟡 EMERGING | New but not stable | May change soon |
| 🟠 HISTORICAL | Old reference material | Reference only, don't use for decisions |
| 🔴 DEPRECATED | Outdated, incorrect | Ignore this. |

### Adding New Docs

When creating a new vault document:
1. Place in appropriate folder (`02_Technical_Specs`, `03_Infrastructure`, etc.)
2. Start with status marker (`# 🟢 Active Doc` or `# 🟡 Emerging`)
3. Reference it from this index

### Archiving Old Docs

Historical docs should be moved to `05_Reports/` with date markers (e.g., `2026-01-15_OLD_AUDIT.md`)

---

## 📊 PROJECT STATISTICS

| Metric | Value |
|--------|-------|
| **Total Vault Docs** | 60+ |
| **Canonical Docs** | 12 |
| **Active Work Docs** | 8 |
| **Historical Docs** | 40+ |
| **Code Locations** | 200+ |
| **Roles Implemented** | 11 |
| **Onboarding Fields** | 228 |
| **Services** | 15+ |
| **API Endpoints** | 50+ |
| **Database Tables** | 40+ |

---

## ✅ SYSTEM COMPONENTS - CURRENT STATE

### Backend (`backend/app/`)
- ✅ Authentication (JWT, refresh tokens, 2FA)
- ✅ RBAC system (role assignment, permissions)
- ✅ Onboarding router (unified endpoint)
- ✅ 11 role services (all complete)
- ✅ Database migrations (production schema)
- ✅ API endpoints (50+)

### Frontend (`frontend/web/`)
- 🟡 Onboarding UI (pending - ready to build)
- 🟡 Role dashboards (pending - ready to build)
- 🟡 Authentication UI (pending - ready to build)

### Database (`supabase/`)
- ✅ User tables
- ✅ Onboarding tables
- ✅ RBAC tables
- ✅ Verification tables
- ✅ Analytics tables
- ✅ Migrations

### Infrastructure (`infra/`, `deploy/`)
- ✅ Docker setup
- ✅ Local dev environment
- 🟡 Production deployment (pending - ready to deploy)

---

## 📝 READY FOR NEXT PHASE

The backend onboarding system is **production-ready**. 

### Next Steps:
1. **Build Frontend** — Implement onboarding UI using spec from `ONBOARDING_API_COMPLETE_GUIDE.md`
2. **Deploy to Production** — Follow `03_Infrastructure/DEPLOYMENT_GUIDE.md`
3. **Test End-to-End** — Run integration tests against all 11 roles
4. **Monitor** — Set up analytics dashboard with `onboarding_events` data

---

## 📞 TROUBLESHOOTING

### "I found conflicting information"
→ Trust **CANONICAL** docs in `01_Core/`. If conflict remains, check git history or ask.

### "Where is the [feature] documentation?"
→ Use [`00_Meta/MODULE_MAP.md`](00_Meta/MODULE_MAP.md) or search vault index above.

### "The documentation is out of date"
→ Search for that doc in this index. If marked 🟠 HISTORICAL, check ACTIVE docs for current version.

### "I need the exact codes for [role]"
→ Check [`02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md`](02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md) or read the service code directly in `backend/app/services/onboarding/`.

---

## 📖 DOCUMENT LEGEND

When you see links in vault docs:
- `[[01_Core/PROJECT_STRUCTURE]]` (double brackets) = Obsidian internal link
- `[Link text](path/to/file.md)` (markdown) = Standard markdown link

Both work for navigation.

---

**Last Audit:** 15 April 2026  
**Maintained By:** Lumina Development Team  
**Next Review:** After major feature completion
