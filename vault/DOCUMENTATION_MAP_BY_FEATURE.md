# Lumina Documentation Map by Feature

**Purpose:** Find documentation for any Lumina feature or component.  
**Last Updated:** 15 April 2026

---

## 🎓 STUDENT ROLE

### Overview & Design
- [`02_Technical_Specs/STUDENT_ROLE.md`](02_Technical_Specs/STUDENT_ROLE.md) — Student role design
- [`02_Technical_Specs/STUDENT_INTELLIGENCE_LOOP.md`](02_Technical_Specs/STUDENT_INTELLIGENCE_LOOP.md) — Adaptive learning
- [`02_Technical_Specs/PERSONALIZED_COURSE_ARCHITECTURE.md`](02_Technical_Specs/PERSONALIZED_COURSE_ARCHITECTURE.md) — Course personalization
- [`02_Technical_Specs/STUDENT_KPI_ENGINE.md`](02_Technical_Specs/STUDENT_KPI_ENGINE.md) — Student metrics

### Onboarding
- **Main Spec:** [`02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md#student`](02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md) — API reference
- **Service Code:** `backend/app/services/onboarding/student_service.py` (235 lines)
  - 6 steps: identity → goals → learning style → diagnostic → schedule → parent linking
  - 29 fields collected

### Implementation
- Profile creation: `backend/app/services/onboarding/student_service.py` → `_post_onboarding_setup()`
- Database: `learner_profiles` + `student_data` (in `user_data` JSONB)

### Features
- Learning path recommendations
- Adaptive quiz difficulty
- Progress tracking
- Mastery estimation (BKT/DKT models)

---

## 👨‍🏫 TEACHER ROLE

### Overview & Design
- [`02_Technical_Specs/TEACHER_ROLE.md`](02_Technical_Specs/TEACHER_ROLE.md) — Teacher role design
- [`02_Technical_Specs/TEACHER_REAL_TIME_DASHBOARD.md`](02_Technical_Specs/TEACHER_REAL_TIME_DASHBOARD.md) — Dashboard design
- [`02_Technical_Specs/TEACHER_CONTENT_PIPELINE.md`](02_Technical_Specs/01-TEACHER-CONTENT-PIPELINE.md) — Content creation flow
- [`02_Technical_Specs/TEACHER_VERIFIED_AI_TUTOR.md`](02_Technical_Specs/02-TEACHER-VERIFIED-AI-TUTOR.md) — AI verification role

### Onboarding
- **Main Spec:** [`02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md#teacher`](02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md) — API reference
- **Service Code:** `backend/app/services/onboarding/teacher_service.py` (195 lines)
  - 5 steps: identity → qualifications → teaching scope → AI preferences → classroom setup
  - 21 fields collected

### Implementation
- Profile creation: `backend/app/services/onboarding/teacher_service.py` → `_post_onboarding_setup()`
- Database: `teacher_profiles` + extended fields

### Features
- Course creation
- Student assignment
- Content verification queue weight
- Dashboard with daily metrics

---

## 👨‍👩‍👧 PARENT ROLE

### Overview & Design
- [`02_Technical_Specs/02-ADMIN-FEATURES.md`](02_Technical_Specs/04-ADMIN-FEATURES.md) — Includes parent monitoring
- Parent linking via OTP mechanism

### Onboarding
- **Main Spec:** [`02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md#parent`](02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md) — API reference
- **Service Code:** `backend/app/services/onboarding/parent_service.py` (185 lines)
  - 4 steps: identity → child linking → monitoring → communication
  - 17 fields collected

### Implementation
- Profile creation: `backend/app/services/onboarding/parent_service.py` → `_post_onboarding_setup()`
- Database: `family_links` join table + `parent_preferences`

### Features
- Child linking (OTP-based consent flow)
- Monitoring dashboard
- Alert configuration
- Progress reports

---

## 🤝 PEER TUTOR ROLE

### Overview & Design
- Part of student ecosystem
- Subject expertise mastery gate (≥0.80)
- Session matching algorithm

### Onboarding
- **Main Spec:** [`02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md#peer_tutor`](02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md) — API reference
- **Service Code:** `backend/app/services/onboarding/peer_tutor_service.py` (185 lines)
  - 4 steps: identity → expertise (MASTERY GATE) → availability → preferences
  - 18 fields collected

### Special Requirements
- **Hard Gate:** Mastery score ≥0.80 in claimed subjects
  - If mastery undefined: runs mini-quiz (5 questions)
  - Cannot proceed without passing gate
- **Verification:** `verification_requests` with type `mastery_proof`

### Implementation
- Profile creation: `backend/app/services/onboarding/peer_tutor_service.py` → `_post_onboarding_setup()`
- Database: `peer_tutor_profiles` + `verification_requests`
- Post-setup: `_set_verification_status()` creates pending verification

### Features
- Tutoring marketplace listing
- Session booking
- Rating & reviews
- Auto-verification after first successful session (≥3.5/5)

---

## 💼 MENTOR ROLE

### Overview & Design
- External professionals (not academics)
- Career guidance focus
- Skill-based matching

### Onboarding
- **Main Spec:** [`02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md#mentor`](02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md) — API reference
- **Service Code:** `backend/app/services/onboarding/mentor_service.py` (165 lines)
  - 5 steps: identity → expertise → preferences → availability → bio
  - 23 fields collected

### Implementation
- Profile creation: `backend/app/services/onboarding/mentor_service.py` → `_post_onboarding_setup()`
- Database: `mentor_profiles` + pricing
- No verification required (external but trusted)

### Features
- Mentorship marketplace
- Session scheduling
- Payment processing (if paid model)
- Mentee matching

---

## 💭 COUNSELOR ROLE

### Overview & Design
- Mental health & wellbeing
- **License verification required** (hard gate)
- High compliance

### Onboarding
- **Main Spec:** [`02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md#counselor`](02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md) — API reference
- **Service Code:** `backend/app/services/onboarding/counselor_service.py` (155 lines)
  - 5 steps: identity → credentials (LICENSE GATE) → specialization → privacy agreements → availability
  - 22 fields collected

### Special Requirements
- **Hard Gate:** License verification
  - Upload license document
  - Admin must review and approve
  - `status: pending_verification` until approved
- **Compliance:** GDPR/DPDP/institutional policy agreements (5 required checkboxes)
- **Data Sensitivity:** End-to-end encrypted session notes

### Implementation
- Profile creation: `backend/app/services/onboarding/counselor_service.py` → `_post_onboarding_setup()`
- Database: `counselor_profiles` + `verification_requests` (type: `license_verification`)
- Post-setup: `_set_verification_status()` creates pending verification

### Features
- Confidential session scheduling
- Crisis intervention routing
- Session notes (encrypted)
- Student referral system
- Compliance audit trail

---

## 📝 CONTENT CREATOR ROLE

### Overview & Design
- Course content contributors
- Quality gating (AI-powered sample check)
- Publishing rights management

### Onboarding
- **Main Spec:** [`02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md#content_creator`](02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md) — API reference
- **Service Code:** `backend/app/services/onboarding/content_creator_service.py` (155 lines)
  - 4 steps: identity → domain → portfolio (QUALITY GATE) → publishing
  - 17 fields collected

### Special Requirements
- **Hard Gate:** Quality score ≥0.65
  - Upload 1+ sample (PDF, video, PPTX, etc.)
  - AI checks grammar, structure, factuality
  - Real-time feedback
  - Can't proceed if below threshold
- **Verification:** Portfolio review (type: `portfolio_review`)

### Implementation
- Profile creation: `backend/app/services/onboarding/content_creator_service.py` → `_post_onboarding_setup()`
- Database: `content_creator_profiles` + `verification_requests` (type: `portfolio_review`)
- Sample storage: `content_drafts` table
- Post-setup: `_set_verification_status()` creates pending verification

### Features
- Content creation tools integration
- Publishing workflow (draft → review → published)
- Royalty tracking
- Content usage analytics
- Attribution management

---

## 📊 RESEARCHER ROLE

### Overview & Design
- Data access for research
- Anonymized data only
- Strict compliance (IRB)

### Onboarding
- **Main Spec:** [`02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md#researcher`](02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md) — API reference
- **Service Code:** `backend/app/services/onboarding/researcher_service.py` (155 lines)
  - 5 steps: identity → research purpose → IRB approval (HARD GATE) → agreement → technical setup
  - 19 fields collected

### Special Requirements
- **Hard Gate:** IRB Approval
  - Upload IRB approval document (PDF)
  - Admin must review
  - Status: approved/pending/not required
  - Read-only access until approved
- **Data Agreement:** 5 mandatory checkboxes
  - Anonymization acknowledgment
  - Non-commercial use
  - Data security
  - Publication ethics
  - Data deletion on expiry

### Implementation
- Profile creation: `backend/app/services/onboarding/researcher_service.py` → `_post_onboarding_setup()`
- Database: `researcher_profiles` + `verification_requests` (type: `irb_approval`)
- Post-setup: `_set_verification_status()` creates pending verification

### Features
- Anonymized data dashboard
- Data export (CSV, JSON, SQL)
- API access with IP whitelist
- Research tracking ID
- Data deletion on expiry

### Compliance
- GDPR, DPDP, institutional policies
- Full audit trail of access
- Auto-expiry enforcement

---

## 🎓 ALUMNI ROLE

### Overview & Design
- Graduate community
- Mentorship contribution
- Professional network

### Onboarding
- **Main Spec:** [`02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md#alumni`](02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md) — API reference
- **Service Code:** `backend/app/services/onboarding/alumni_service.py` (155 lines)
  - 4 steps: identity → professional status → contributions → mentorship (opt-in)
  - 20 fields collected

### Implementation
- Profile creation: `backend/app/services/onboarding/alumni_service.py` → `_post_onboarding_setup()`
- Database: `alumni_profiles` + optional mentorship setup

### Features
- Alumni directory
- Mentorship program
- Event invitations
- Project review queue
- Guest lecture scheduling

---

## 🔑 ADMIN ROLE

### Overview & Design
- System administration
- Institution configuration
- Feature toggles

### Onboarding
- **Main Spec:** [`02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md#admin`](02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md) — API reference
- **Service Code:** `backend/app/services/onboarding/admin_service.py` (165 lines)
  - 3 steps: identity + 2FA → institution config → feature toggles
  - 14 fields collected

### Special Features
- API key generation
- 2FA setup (TOTP)
- Institution-wide settings
- Feature toggles
- User management

### Implementation
- Profile creation: `backend/app/services/onboarding/admin_service.py` → `_post_onboarding_setup()`
- Database: `admin_profiles` with API key
- Post-setup: API key generated for integrations

---

## 👔 HOD (HEAD OF DEPARTMENT) ROLE

### Overview & Design
- Department-level management
- Course & curriculum oversight
- Faculty approval workflows

### Onboarding
- **Main Spec:** [`02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md#hod`](02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md) — API reference
- **Service Code:** `backend/app/services/onboarding/hod_service.py` (155 lines)
  - 3 steps: identity → department config → approval settings
  - 17 fields collected

### Implementation
- Profile creation: `backend/app/services/onboarding/hod_service.py` → `_post_onboarding_setup()`
- Database: `hod_profiles` with department info

### Features
- Department dashboard
- Faculty management
- Curriculum approval
- Exam scheduling
- Student complaints handling

---

## 🔐 AUTHENTICATION & AUTHORIZATION

### Overview
- [`02_Technical_Specs/README_AUTH_SYSTEM.md`](02_Technical_Specs/README_AUTH_SYSTEM.md) — **START HERE**
- [`02_Technical_Specs/AUTH_AND_ONBOARDING_FLOW.md`](02_Technical_Specs/AUTH_AND_ONBOARDING_FLOW.md) — Integration guide
- [`02_Technical_Specs/ROLES_AND_PERMISSIONS.md`](02_Technical_Specs/ROLES_AND_PERMISSIONS.md) — RBAC matrix

### Code
- `backend/app/routers/auth.py` — Auth endpoints
- `backend/app/core/rbac.py` — RBAC system
- `backend/app/schemas/auth_schemas.py` — Auth models

### What's Implemented
✅ JWT (access + refresh tokens)  
✅ Role-based access control (RBAC)  
✅ Permission synchronization  
✅ 2FA support  
✅ Brute-force protection  
✅ Token refresh  
✅ Logout

---

## 🚀 ONBOARDING SYSTEM (CORE)

### Main References
- **🟢 IMPLEMENTATION COMPLETE:** [`02_Technical_Specs/ONBOARDING_PRODUCTION_HARDENING_COMPLETE.md`](02_Technical_Specs/ONBOARDING_PRODUCTION_HARDENING_COMPLETE.md)
- **Spec Compliance:** [`02_Technical_Specs/ONBOARDING_MASTER_PROMPT_IMPLEMENTATION_AUDIT.md`](02_Technical_Specs/ONBOARDING_MASTER_PROMPT_IMPLEMENTATION_AUDIT.md)
- **API Reference:** [`02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md`](02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md)
- **Architecture:** [`02_Technical_Specs/ROLE_BASED_ONBOARDING_ARCHITECTURE.md`](02_Technical_Specs/ROLE_BASED_ONBOARDING_ARCHITECTURE.md)

### Code
- Services: `backend/app/services/onboarding/` (11 services, ~2,700 lines)
- Router: `backend/app/routers/onboarding_unified.py` (400 lines)
- Schemas: `backend/app/schemas/onboarding_schemas.py` (450+ lines)
- Database: `backend/app/migrations/onboarding_schema.sql` (500+ lines)

### Features
✅ 11 complete role flows  
✅ 228 fields collected  
✅ Step validation & order enforcement  
✅ Progress saving & resume support  
✅ Hard gates (mastery, license, quality, IRB)  
✅ Analytics event tracking  
✅ RBAC assignment  
✅ Permission sync  
✅ Verification pipelines  
✅ Standardized responses  

---

## 📊 DATABASE & SCHEMA

### References
- [`02_Technical_Specs/DATABASE_SCHEMA.md`](02_Technical_Specs/DATABASE_SCHEMA.md) — **Main schema doc**
- [`02_Technical_Specs/DATABASE_ARCHITECTURE_REPORT.md`](02_Technical_Specs/DATABASE_ARCHITECTURE_REPORT.md) — Analysis
- [`02_Technical_Specs/COMPLETE_SCHEMA.sql`](02_Technical_Specs/COMPLETE_SCHEMA.sql) — Full SQL

### Code
- `supabase/seed_production.sql` — Production schema
- `backend/app/migrations/onboarding_schema.sql` — Onboarding tables

### Key Tables
- `users` — User accounts
- `onboarding_progress` — Step tracking
- `onboarding_events` — Analytics
- `user_roles` — RBAC assignment
- `user_permissions` — Permission mapping
- `verification_requests` — Approval tracking
- `[role]_profiles` — 9 role-specific tables

---

## 🏗️ INFRASTRUCTURE & DEPLOYMENT

### References
- [`03_Infrastructure/LOCAL_SETUP.md`](03_Infrastructure/LOCAL_SETUP.md) — **Local development**
- [`03_Infrastructure/DEPLOYMENT_GUIDE.md`](03_Infrastructure/DEPLOYMENT_GUIDE.md) — **Production deployment**

### Code
- `docker-compose.yml` — Local stack
- `docker-compose.prod.yml` — Production stack
- `Dockerfile` — Backend image
- `.github/workflows/` — CI/CD

### Services
- FastAPI backend (port 9000)
- Next.js frontend (port 3000)
- PostgreSQL (port 5432)
- Redis (port 6379)

---

## 📱 FRONTEND (READY TO BUILD)

### References
- [`02_Technical_Specs/FRONTEND_SPEC.md`](02_Technical_Specs/FRONTEND_SPEC.md) — Frontend structure
- [`02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md`](02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md) — API to integrate with

### Where to Build
```
frontend/web/
├── app/
│   └── onboarding/
│       ├── page.tsx          [Main router]
│       ├── [role]/
│       │   └── page.tsx      [Role-specific flow]
│       ├── components/
│       │   ├── Stepper.tsx
│       │   ├── StepForm.tsx
│       │   └── [others]
│       └── stories/          [Storybook]
│
└── stores/
    └── onboarding/
        └── useOnboardingStore.ts
```

### What to Build
- 11 role-specific onboarding pages
- Common stepper component
- Form components per step
- State management (Zustand)
- API integration

---

## 🔍 PROJECT STRUCTURE

### Full Reference
- [`01_Core/PROJECT_STRUCTURE.md`](01_Core/PROJECT_STRUCTURE.md) — **CANONICAL**

### Code Layout
```
backend/app/
├── services/onboarding/       [✅ Services]
├── routers/onboarding_unified.py [✅ Router]
├── schemas/onboarding_schemas.py [✅ Schemas]
├── core/rbac.py               [✅ RBAC]
└── migrations/onboarding_schema.sql [✅ DB]

frontend/web/
└── app/onboarding/            [🟡 Ready to build]

supabase/
├── migrations/                [✅ Schema]
└── seed_production.sql        [✅ Data]
```

---

## 🎯 QUICK LINKS BY NEED

| I need to... | Read |
|-------------|------|
| Understand the system | [`PROJECT_CURRENT_STATE.md`](PROJECT_CURRENT_STATE.md) |
| Find something | [`00_VAULT_ORGANIZATION_INDEX.md`](00_VAULT_ORGANIZATION_INDEX.md) |
| Get setup locally | [`03_Infrastructure/LOCAL_SETUP.md`](03_Infrastructure/LOCAL_SETUP.md) |
| Build frontend | [`02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md`](02_Technical_Specs/ONBOARDING_API_COMPLETE_GUIDE.md) |
| Understand auth | [`02_Technical_Specs/README_AUTH_SYSTEM.md`](02_Technical_Specs/README_AUTH_SYSTEM.md) |
| Deploy to prod | [`03_Infrastructure/DEPLOYMENT_GUIDE.md`](03_Infrastructure/DEPLOYMENT_GUIDE.md) |
| Check the code | [`01_Core/DOC_CODE_RELATIONSHIP_MAP.md`](01_Core/DOC_CODE_RELATIONSHIP_MAP.md) |
| See DB tables | [`02_Technical_Specs/DATABASE_SCHEMA.md`](02_Technical_Specs/DATABASE_SCHEMA.md) |

---

**Last Updated:** 15 April 2026  
**Status:** 🟢 Backend Complete | 🟡 Frontend Ready | 🟡 Deployment Ready
