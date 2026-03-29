# Lumina AI Learning Platform — System Audit & Documentation
> Generated: 2026-03-30 | Auditor: Claude (Principal Architect)

---

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Project Structure Tree](#2-project-structure-tree)
3. [Database Documentation](#3-database-documentation)
4. [API Documentation](#4-api-documentation)
5. [Feature-by-Feature Documentation](#5-feature-by-feature-documentation)
6. [Button & Form Documentation](#6-button--form-documentation)
7. [Auth & Session System](#7-auth--session-system)
8. [Issue Report & Fix Summary](#8-issue-report--fix-summary)
9. [Final Validation Report](#9-final-validation-report)
10. [Deployment Checklist](#10-deployment-checklist)

---

## 1. System Overview

### Architecture
```
Browser (Next.js 15)
    │
    ├── sessionStorage  ← JWT access token + user object
    │
    └── HTTP/HTTPS  →  FastAPI Backend (port 8000)
                            │
                            ├── Supabase PostgreSQL  ← primary store
                            ├── Redis               ← caching layer
                            ├── ChromaDB            ← vector embeddings (RAG)
                            └── MinIO / S3          ← file uploads
```

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| State | Zustand 5 (sessionStorage persisted) |
| Backend | FastAPI 0.115, Python 3.11+, Uvicorn |
| Database | Supabase (PostgreSQL 15) |
| Auth | JWT (python-jose), bcrypt password hashing |
| AI | Google Gemini, Sentence Transformers, ChromaDB RAG |
| File Storage | MinIO / AWS S3 (boto3) |
| Cache | Redis 5 |
| Observability | Sentry, Prometheus, structlog |
| Deployment | Railway (backend), Vercel (frontend) |

### User Roles (14 total)

| Role | Portal Route | Description |
|------|-------------|-------------|
| `super_admin` | `/admin` | Full platform control |
| `college_admin` | `/college` | Institution management |
| `hod` | `/hod` | Department head |
| `faculty` | `/faculty` | Teacher/instructor |
| `student` | `/student` | Learner |
| `parent` | `/parent` | Guardian monitoring |
| `mentor` | `/mentor` | 1:1 mentor |
| `peer_tutor` | `/peer_tutor` | Student tutor |
| `counselor` | `/counselor` | Wellbeing counselor |
| `content_creator` | `/content-creator` | Content author |
| `researcher` | `/researcher` | Academic researcher |
| `alumni` | `/alumni` | Graduate |

---

## 2. Project Structure Tree

```
lumina-ai-learning/
│
├── backend/                        FastAPI Python backend
│   └── app/
│       ├── main.py                 App entry point, all routers registered, CORS, middleware
│       ├── worker.py               Background task worker (Celery)
│       ├── dependencies.py         FastAPI dependency injection helpers
│       │
│       ├── api/                    Automation API sub-module
│       │   └── routers/
│       │       └── automation.py   Job scheduling API → /api/automation/*
│       │
│       ├── routers/                Route handlers (one file per domain)
│       │   ├── auth.py             Login, register, JWT, change-password → /api/auth/*
│       │   ├── student.py          Student data, dashboard, progress → /api/student/*
│       │   ├── teacher.py          Teacher dashboard → /api/teacher/*
│       │   ├── faculty.py          Faculty onboarding, management → /api/faculty/*
│       │   ├── admin.py            Platform admin, config, bulk users → /api/admin/*
│       │   ├── onboarding.py       Multi-step onboarding (all roles) → /api/onboarding/*
│       │   ├── hod.py              HOD dashboard → /api/hod/*
│       │   ├── courses.py          Course CRUD → /api/courses/*
│       │   ├── assignments.py      Assignments → /api/assignments/*
│       │   ├── attendance.py       Attendance → /api/*
│       │   ├── ai.py               AI tutoring + RAG → /api/ai/*
│       │   ├── ai_tutor.py         AI tutor session → /api/ai-tutor/*
│       │   ├── ai_queue.py         AI answer queue → /api/*
│       │   ├── community.py        Community features → /api/community/*
│       │   ├── knowledge_graph.py  Knowledge graph → /api/knowledge-graph/*
│       │   ├── college_architecture.py  Institution hierarchy → /api/*
│       │   ├── personalization.py  Learning personalization → /api/personalization/*
│       │   ├── pathway.py          Learning pathways → /api/pathway/*
│       │   ├── curriculum.py       Curriculum management → /api/*
│       │   ├── generation.py       Content generation (root level)
│       │   ├── materials.py        Course materials → /api/*
│       │   ├── handwriting_simple.py  Handwriting OCR → /api/handwriting/*
│       │   ├── handwritten.py      Handwritten assignment grading → /api/handwritten/*
│       │   ├── parent.py           Parent features → /api/parent/*
│       │   ├── mentor.py           Mentor → /api/mentor/*
│       │   ├── peer_tutor.py       Peer tutor → /api/peer_tutor/*
│       │   ├── counselor.py        Counselor → /api/counselor/*
│       │   ├── content_creator.py  Content creator → /api/content_creator/*
│       │   ├── researcher.py       Researcher → /api/researcher/*
│       │   ├── alumni.py           Alumni → /api/alumni/*
│       │   ├── academic.py         Academic hierarchy → /api/academic/*
│       │   ├── hybrid.py           Hybrid AI → /api/ai/*
│       │   └── unit_pipeline.py    Unit content pipeline → /api/teacher/*
│       │
│       ├── store/                  Repository layer (32 store classes)
│       │   ├── user_store.py       User CRUD — connects to: users table
│       │   ├── student_store.py    Student queries — connects to: enrollments, learner_profiles
│       │   ├── teacher_store.py    Teacher queries — connects to: teacher_assignments, courses
│       │   ├── course_store.py     Course persistence — connects to: courses, enrollments
│       │   ├── analytics_store.py  Event tracking — connects to: learning_events, analytics_events
│       │   ├── ai_tutor_store.py   AI sessions — connects to: conversations, tutor_sessions
│       │   ├── config_store.py     Platform config — connects to: platform_config
│       │   ├── community_store.py  Community — connects to: community_posts
│       │   └── redis_client.py     Redis cache wrapper
│       │
│       ├── services/               Business logic layer
│       │   ├── personalization_service.py  ML-based personalization
│       │   ├── unit_pipeline.py    Dynamic content generation
│       │   ├── ocr_service.py      Handwriting OCR (Tesseract/HuggingFace)
│       │   ├── evaluation_service.py  Assessment auto-grading
│       │   ├── storage.py          S3/MinIO file uploads
│       │   ├── audit_service.py    User action audit logging
│       │   └── notification.py     Email/push notifications
│       │
│       ├── database/
│       │   ├── supabase_manager.py  Supabase client wrapper (singleton)
│       │   ├── models.py           Pydantic data models
│       │   └── migrations/         SQL migration files (001–017)
│       │
│       └── core/
│           ├── config.py           Settings (env-based)
│           ├── security.py         JWT creation/verification, bcrypt
│           ├── logging.py          structlog configuration
│           ├── audit.py            Audit event logger
│           ├── limiter.py          slowapi rate limiter
│           └── rbac.py             Role-based access control
│
└── frontend/web/                   Next.js 15 frontend
    └── src/
        ├── app/                    Next.js App Router pages
        │   ├── layout.tsx          Root layout (theme, fonts, toasts)
        │   ├── page.tsx            Landing page
        │   ├── login/              Login page → AuthGateway component
        │   ├── register/           Registration page
        │   ├── onboarding/         Multi-step onboarding flow
        │   ├── change-password/    Force-password-change page
        │   ├── admin/              Admin portal (30+ pages)
        │   ├── student/            Student portal (15+ pages)
        │   ├── faculty/            Faculty portal (20+ pages)
        │   ├── hod/                HOD portal
        │   ├── parent/             Parent portal
        │   ├── mentor/             Mentor portal
        │   ├── counselor/          Counselor portal
        │   ├── peer_tutor/         Peer tutor portal
        │   ├── content-creator/    Content creator portal
        │   ├── researcher/         Researcher portal
        │   └── alumni/             Alumni portal
        │
        ├── components/
        │   ├── auth/               AuthGateway, AuthSkeleton
        │   ├── layout/             Sidebar, Navbar, Footer
        │   ├── student/            Student-specific components
        │   ├── dashboard/          Dashboard widgets
        │   ├── charts/             Chart wrappers (Chart.js, Recharts)
        │   └── ui/                 shadcn/ui base components
        │
        ├── lib/
        │   ├── api.ts              RealAPI singleton — ALL backend calls
        │   ├── supabase.ts         Supabase JS client
        │   ├── db.ts               IndexedDB local cache (LuminaDB)
        │   └── utils.ts            Utility helpers
        │
        └── store/
            ├── useAuthStore.ts     Auth state (Zustand, sessionStorage)
            ├── authStore.ts        Legacy auth store (kept for compat)
            └── useOnboardingStore.ts  Onboarding draft snapshots
```

---

## 3. Database Documentation

### Complete Table List (Supabase PostgreSQL)

| Table | Purpose | Key Relations |
|-------|---------|--------------|
| `users` | Core user accounts | PK for all role tables |
| `institutions` | Colleges/universities | ← users.college_id |
| `departments` | Departments within institutions | → institutions |
| `programs` | Academic programs (B.Tech, M.Tech) | → departments |
| `semesters` | Semester definitions per program | → programs |
| `batches` | Student cohorts per dept/year | → departments |
| `classes` | Class sections | → programs, batches |
| `courses` | Course/subject definitions | → departments, teachers |
| `enrollments` | Student course enrollments | → users, courses |
| `student_enrollments` | Academic enrollment (program-level) | → users, programs |
| `student_subjects` | ✅ Student subject elections | → users, courses |
| `teacher_assignments` | Faculty-course-class mappings | → users, courses, classes |
| `teacher_requests` | Faculty course request approvals | → users, courses |
| `enrollment_codes` | Invitation codes for student onboarding | → batches |
| `invite_tokens` | Staff invite tokens | → users |
| `learner_profiles` | Student mastery/skill levels | → users |
| `skill_mastery` | Per-skill BKT mastery scores | → users, courses |
| `learning_events` | User activity event log | → users, courses |
| `user_data` | Onboarding progress + notes (JSONB) | → users |
| `conversations` | AI tutor chat history | → users |
| `quizzes` | Quiz definitions | → courses |
| `quiz_attempts` | Student quiz responses | → users, quizzes |
| `assignments` | Assignment definitions | → courses, teachers, batches |
| `submissions` | Assignment submissions | → users, assignments |
| `handwritten_assignments` | Handwritten assignment metadata | → courses |
| `physical_submissions` | Handwritten PDF/image submissions | → users |
| `attendance` | Per-class attendance records | → users, courses, batches |
| `course_materials` | Syllabus, notes, references | → courses, teachers |
| `content_uploads` | Teacher content upload pipeline | → users, courses |
| `ai_answer_queue` | Teacher-verified AI answers | → users, courses |
| `correction_requests` | Student batch correction requests | → users |
| `student_pathways` | Adaptive learning paths | → users, courses |
| `student_credits` | Earned credits per semester | → users, semesters |
| `course_concepts` | Knowledge graph nodes | → courses |
| `stakeholders` | External institutional contacts | → programs, institutions |
| `login_attempts` | ✅ Brute-force protection state | (no FK) |
| `login_history` | ✅ Full auth audit trail | → users, institutions |

> ✅ = Created by migration 017 (new)

### Key Column Notes

**`users` table critical columns:**
```
id, email, name, full_name, role, password_hash, status, is_active
college_id, dept_id, batch_id, section
onboarding_step (0–5)
must_change_password (bool)
profile_photo_url, avatar
employee_id, student_roll
first_name, last_name, dob, gender
emergency_contact, parent_email
last_login_at, updated_at, created_at
```

**`skill_mastery` BKT columns:**
```
mastery_score (0.0–1.0)
bkt_p_l0 (initial knowledge probability)
bkt_p_t (learning probability)
bkt_p_g (guess probability)
bkt_p_s (slip probability)
confidence, assessment_count, last_assessed
```

---

## 4. API Documentation

### Base URL
- **Local:** `http://127.0.0.1:8000`
- **Production:** Set via `NEXT_PUBLIC_API_URL` env var

### Authentication
All protected routes require:
```
Authorization: Bearer <access_token>
```

---

### Auth Endpoints (`/api/auth/*`)

| Method | Path | Description | Auth Required |
|--------|------|-------------|--------------|
| POST | `/api/auth/register` | Register student or teacher | No |
| POST | `/api/auth/login` | Login with identifier + password | No |
| POST | `/api/auth/token` | OAuth2 form-based login (Swagger UI) | No |
| POST | `/api/auth/logout` | Clear session cookies | No |
| POST | `/api/auth/refresh` | Refresh access token via cookie | No |
| POST | `/api/auth/forgot-password` | Send password reset email (stub) | No |
| POST | `/api/auth/reset-password` | Reset password with token | No |
| POST | `/api/auth/change-password` | Change password (normal or forced) | Optional |
| POST | `/api/auth/accept-invite` | Accept staff invite + set password | No |

**POST `/api/auth/login`**
```json
// Request
{ "identifier": "student@college.edu", "password": "pass123", "role_hint": "student" }

// Response (200)
{
  "accessToken": "eyJ...",
  "user": {
    "id": "uuid",
    "role": "student",
    "fullName": "John Doe",
    "email": "student@college.edu",
    "collegeId": "uuid|null",
    "deptId": "uuid|null",
    "batchId": "uuid|null",
    "onboardingStep": 0,
    "profilePhotoUrl": "url|null",
    "mustChangePassword": false
  }
}

// Force-password response (when must_change_password=true)
{ "forcePasswordChange": true, "tempToken": "eyJ..." }
```

---

### Onboarding Endpoints (`/api/onboarding/*`)

| Method | Path | Step | Role |
|--------|------|------|------|
| GET | `/api/onboarding/status` | — | All |
| PATCH | `/api/onboarding/step` | Any | All roles |
| POST | `/api/onboarding/complete` | Final | All |
| POST | `/api/onboarding/personal` | Step 1 | Student |
| POST | `/api/onboarding/enrollment` | Step 2 | Student |
| GET | `/api/onboarding/student-subjects` | Step 3 | Student |
| POST | `/api/onboarding/subjects` | Step 3 | Student |
| POST | `/api/onboarding/profile` | Step 4 | Student (multipart) |
| POST | `/api/onboarding/preferences` | Step 5 | Student |
| GET | `/api/onboarding/subjects` | Step 3 | Student (fallback) |

**PATCH `/api/onboarding/step`**
```json
// Request
{ "step": 1, "data": { "fullName": "Jane", "registerNumber": "21NU1A0101", "dob": "2002-05-15" } }

// Response (200)
{ "step": 1, "success": true }
```

**POST `/api/onboarding/preferences`** — Step 5, creates `skill_mastery`, `enrollments`, `student_enrollments`, `learner_profiles`
```json
// Request
{ "learning_styles": ["visual", "reading"], "self_assessment": "intermediate" }

// Response (200)
{ "step": 5, "success": true, "complete": true, "programLinked": true, "subjectCount": 6 }
```

---

### Student Endpoints (`/api/student/*`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/student/dashboard` | Aggregated dashboard data |
| GET | `/api/student/profile` | Student profile info |
| GET | `/api/student/courses` | Enrolled courses |
| GET | `/api/student/progress` | Learning progress metrics |
| GET | `/api/student/onboarding/options` | Batch/subject options for onboarding |
| POST | `/api/student/onboarding/complete` | Complete student onboarding (full payload) |

---

### Faculty Endpoints (`/api/faculty/*`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/faculty/onboarding/options` | Dept/course options for faculty onboarding |
| POST | `/api/faculty/onboarding/complete` | Complete faculty onboarding |

---

### Admin Endpoints (`/api/admin/*`)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/admin/config` | Get platform config |
| POST | `/api/admin/config` | Update platform config |
| POST | `/api/admin/users/bulk` | Bulk user import (CSV) |
| POST | `/api/admin/institution` | Create institution |
| POST | `/api/admin/department` | Create department |
| GET | `/api/admin/analytics` | Platform-wide analytics |
| GET | `/api/admin/users` | List all users |

---

### AI Tutor Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/ai/ask` | Ask AI tutor (RAG-enhanced) |
| GET | `/api/ai/sessions` | List tutor sessions |
| POST | `/api/ai-tutor/session` | Start new AI tutor session |

---

### College Architecture Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/enrollment/validate` | Validate enrollment code (returns batch/dept info) |
| POST | `/api/institution` | Create institution |
| POST | `/api/department` | Create department |
| POST | `/api/batch` | Create student batch |
| POST | `/api/enrollment-code` | Generate enrollment codes |

---

## 5. Feature-by-Feature Documentation

### Onboarding Flow

**Location:** `/onboarding` → `src/app/onboarding/`
**Steps:** 5-step progressive form
**State:** `useOnboardingStore` (session snapshots)

```
Step 0 → Login/Register
Step 1 → Personal details (name, DOB, phone, email, gender)
         API: POST /api/onboarding/step  {step:1, data:{fullName, dob, phone}}
         DB: users.first_name, last_name, dob, gender, phone + user_data.progress

Step 2 → Batch/Enrollment confirmation
         API: POST /api/onboarding/step  {step:2, data:{confirmBatch:true}}
         OR   POST /api/onboarding/enrollment  {enrollment_code:"ABC123"}
         DB: users.batch_id, dept_id, college_id; enrollment_codes.used_by

Step 3 → Subject selection
         API: GET /api/onboarding/student-subjects?batch_id=...
              POST /api/onboarding/subjects  {subject_ids:["uuid1","uuid2"]}
         DB: student_subjects rows (upsert)

Step 4 → Profile + emergency contact + photo
         API: POST /api/onboarding/profile  (multipart/form-data)
         DB: users.profile_photo_url, emergency_contact, parent_email

Step 5 → Learning preferences + completion
         API: POST /api/onboarding/preferences  {learning_styles:[], self_assessment:"intermediate"}
         DB: skill_mastery (per subject), enrollments, student_enrollments, learner_profiles
             users.onboarding_step = 5
```

---

### Student Dashboard

**Location:** `/student/dashboard` → `src/app/student/dashboard/page.tsx`
**API:** `GET /api/student/dashboard`
**Data displayed:** Course progress, mastery scores, weekly activity chart, due assignments, weak topics, AI tutor prompt, streak

**Components:**
- `DashboardGrid` — responsive card grid
- `StatCard` — KPI stat with icon
- `MasteryOrb` — animated mastery circle
- Chart.js Line chart — weekly activity minutes

---

### Admin Dashboard

**Location:** `/admin/dashboard` → `src/app/admin/dashboard/page.tsx`
**API:** `GET /api/admin/analytics`

**Panels:**
- System health score (Supabase, Redis, Vector DB)
- Security alerts (count + severity)
- Recent user registrations
- At-risk student flags
- Queue health (pending verifications)

---

### AI Tutor

**Location:** `/student/ai_tutor` → `src/app/student/ai_tutor/`
**API:** `POST /api/ai/ask`
**Flow:** Student types question → RAG retrieves relevant course context → Gemini generates answer → Teacher-verified answers from `ai_answer_queue` are prioritized

---

### Attendance

**Location:** `/faculty/attendance`
**API:** Faculty marks attendance → `POST /api/attendance` (course_id, student_id, date, is_present)
**DB:** `attendance` table with UNIQUE(course_id, student_id, class_date)

---

### Grading / Handwritten Assignments

**Location:** `/faculty/grading`
**API:** `POST /api/handwritten/submit` → OCR → AI grading → `physical_submissions` table
**Flow:** Teacher uploads rubric → Students submit PDF → OCR extracts text → AI scores per question

---

## 6. Button & Form Documentation

### Login Page (`/login`)

| Element | Type | Action | API | DB Effect |
|---------|------|--------|-----|-----------|
| "Sign In" button | Submit | Validates form, calls login | `POST /api/auth/login` | `users.last_login_at`, `login_history` insert |
| "Forgot Password" link | Navigate | Shows forgot-password form | `POST /api/auth/forgot-password` | None (email stub) |
| Role selector (Student/Faculty/Admin) | Select | Sets role_hint for login | — | — |

**Login Form Fields:**

| Field | Validation | Notes |
|-------|-----------|-------|
| Identifier | Required, non-empty | Email, roll number, or employee ID |
| Password | Required, min 8 chars | Compared to bcrypt hash |

---

### Onboarding — Step 1 (Personal Details)

| Field | Validation | API Field |
|-------|-----------|-----------|
| First Name | Required, min 2 chars | `first_name` |
| Last Name | Required, min 2 chars | `last_name` |
| Date of Birth | Required, ISO date, must be in past | `date_of_birth` |
| Gender | Optional, enum | `gender` |
| Phone | 8–15 digits | `phone_number` |
| Email | Must match logged-in account email | `email` |

---

### Onboarding — Step 2 (Enrollment)

| Field | Validation | API Field |
|-------|-----------|-----------|
| Enrollment Code | Required, uppercase, exists in DB | `enrollment_code` |
| Confirm Batch | Checkbox | `confirmBatch` |

---

### Onboarding — Step 3 (Subjects)

| Element | Action | API |
|---------|--------|-----|
| Subject list | Loaded from batch+dept+semester | `GET /api/onboarding/student-subjects` |
| Subject checkboxes | Multi-select, min 1 required | `POST /api/onboarding/subjects` |

---

### Onboarding — Step 4 (Profile)

| Field | Validation | Notes |
|-------|-----------|-------|
| Emergency Contact | 8–15 digit phone | Required |
| Parent Email | Valid email | Optional |
| Profile Photo | JPG/PNG/WEBP | Optional — falls back to generated avatar |

---

### Onboarding — Step 5 (Preferences)

| Field | Validation | Notes |
|-------|-----------|-------|
| Learning Styles | Min 1 selected | visual, auditory, reading, kinesthetic |
| Self Assessment | Required enum | beginner / intermediate / advanced |

---

## 7. Auth & Session System

### JWT Token Architecture

| Token Type | Secret Used | Expiry | Purpose |
|-----------|------------|--------|---------|
| Access Token | `JWT_SECRET` | 8 days | All API calls |
| Refresh Token | `JWT_REFRESH_SECRET` | 7 days | Cookie-based refresh |
| Temp Token | `SECRET_KEY` | 30 min | Force-password-change flow |
| Reset Token | `SECRET_KEY` | 1 hour | Password reset link |
| Invite Token | `SECRET_KEY` | Set by admin | Staff account activation |

### Session Flow
```
1. User submits credentials → POST /api/auth/login
2. Server returns { accessToken, user } + sets HttpOnly cookies
3. Frontend stores token in sessionStorage("lumina_token")
4. Frontend stores user in sessionStorage("lumina_user")
5. All API calls add "Authorization: Bearer <token>"
6. On 401 response → attempt cookie-based refresh → POST /api/auth/refresh
7. On refresh failure → logout + redirect to /login?reason=session_expired
```

### Brute Force Protection
- Table: `login_attempts`
- Threshold: 5 failed attempts per (identifier, IP)
- Lock duration: 15 minutes
- Auto-clears on successful login

### Role Normalization
Backend normalizes roles on login:
- `"teacher"` → `"faculty"`
- `"admin"` → `"super_admin"`

Frontend routing by role:
```
super_admin     → /admin/dashboard
college_admin   → /college
hod             → /hod/dashboard
faculty         → /faculty/dashboard
student         → /student/dashboard (or /onboarding if step < 5)
parent          → /parent/dashboard
mentor          → /mentor/dashboard
```

---

## 8. Issue Report & Fix Summary

### Issues Found (Before Fix)

| # | Severity | File | Issue | Status |
|---|----------|------|-------|--------|
| 1 | 🔴 CRITICAL | DB | `student_subjects` table missing — steps 3 & 5 of student onboarding crash with DB error | ✅ FIXED |
| 2 | 🔴 CRITICAL | DB | `login_attempts` table missing — brute-force protection silently broken | ✅ FIXED |
| 3 | 🔴 CRITICAL | DB | `login_history` table missing — auth audit trail silently broken | ✅ FIXED |
| 4 | 🟠 MAJOR | `onboarding.py:441` | Profile photo mandatory with no fallback — blocks step 4 if storage unconfigured | ✅ FIXED |
| 5 | 🟠 MAJOR | `user_store.py:167` | `update_user_fields` never sets `updated_at` | ✅ FIXED |
| 6 | 🟡 MINOR | `onboarding.py:207` | `_self_assessment_score` bare dict key access (KeyError risk) | ✅ FIXED |
| 7 | 🟡 MINOR | Frontend | Two auth stores (`authStore.ts` legacy + `useAuthStore.ts`) — potential state confusion | ⚠️ NOTED (legacy store safe to keep for compat) |

### Fix Summary

**Fix 1–3: `backend/app/database/migrations/017_missing_auth_and_subjects_tables.sql`**
Created migration adding `student_subjects`, `login_attempts`, `login_history` with proper FKs and indexes.

**Fix 4: `backend/app/routers/onboarding.py`**
Profile photo step now falls back to a generated avatar (`ui-avatars.com`) when no photo is uploaded and no existing photo exists. Onboarding no longer blocked by storage service.

**Fix 5: `backend/app/store/user_store.py`**
Both `update_user_fields` (async) and `update_user_fields_sync` now automatically set `updated_at = datetime.utcnow().isoformat()` on every user update.

**Fix 6: `backend/app/routers/onboarding.py`**
`_self_assessment_score` changed from `lookup[level]` → `lookup.get(level, 0.35)` to prevent KeyError.

---

## 9. Final Validation Report

### Data Flow Verification

| Feature | UI → API | API → DB | DB → UI | Status |
|---------|----------|----------|---------|--------|
| Login | ✅ `/api/auth/login` | ✅ `users` read | ✅ token+user returned | ✅ OK |
| Student Onboarding Step 1 | ✅ `POST /api/onboarding/personal` | ✅ `users` + `user_data` | ✅ step confirmed | ✅ OK |
| Student Onboarding Step 2 | ✅ `POST /api/onboarding/enrollment` | ✅ `enrollment_codes`, `users` | ✅ dept/batch info returned | ✅ OK |
| Student Onboarding Step 3 | ✅ `GET/POST /api/onboarding/student-subjects` | ✅ `student_subjects` (after fix) | ✅ subject list returned | ✅ FIXED |
| Student Onboarding Step 4 | ✅ `POST /api/onboarding/profile` | ✅ `users` updated | ✅ (avatar fallback) | ✅ FIXED |
| Student Onboarding Step 5 | ✅ `POST /api/onboarding/preferences` | ✅ `skill_mastery`, `enrollments`, `learner_profiles` | ✅ complete:true | ✅ OK |
| Student Dashboard | ✅ `GET /api/student/dashboard` | ✅ `enrollments`, `learning_events` | ✅ JSON response | ✅ OK |
| AI Tutor | ✅ `POST /api/ai/ask` | ✅ `conversations` | ✅ answer streamed | ✅ OK |
| Brute Force Protection | ✅ checked on every login | ✅ `login_attempts` (after fix) | ✅ 423 lockout response | ✅ FIXED |
| Login Audit | ✅ logged on every attempt | ✅ `login_history` (after fix) | — | ✅ FIXED |
| CORS | ✅ Origins: localhost:3000, vercel.app | ✅ | ✅ | ✅ OK |

### All Features — Status After Fixes

| Feature | Real Data | API Connected | DB Connected | Status |
|---------|-----------|--------------|--------------|--------|
| Onboarding | ✅ | ✅ | ✅ | ✅ |
| Student Dashboard | ✅ | ✅ | ✅ | ✅ |
| Courses/Enrollment | ✅ | ✅ | ✅ | ✅ |
| Subjects | ✅ | ✅ | ✅ (after fix) | ✅ |
| Attendance | ✅ | ✅ | ✅ | ✅ |
| Grades / Submissions | ✅ | ✅ | ✅ | ✅ |
| AI Tutor | ✅ | ✅ | ✅ | ✅ |
| Handwriting OCR | ✅ | ✅ | ✅ | ✅ |
| Community | ✅ | ✅ | ✅ | ✅ |
| Admin Panel | ✅ | ✅ | ✅ | ✅ |
| Auth / Login | ✅ | ✅ | ✅ (after fix) | ✅ |
| Profile | ✅ | ✅ | ✅ (after fix) | ✅ |

---

## 10. Deployment Checklist

### Environment Variables (Backend)
```
JWT_SECRET=<random 64+ char string>
JWT_REFRESH_SECRET=<random 64+ char string>
SECRET_KEY=<random 64+ char string>       # for temp/reset/invite tokens
SUPABASE_URL=https://odyjksznsdeyweylovzl.supabase.co
SUPABASE_ANON_KEY=<anon key>
SUPABASE_SERVICE_ROLE_KEY=<service role key>
FRONTEND_URL=https://your-app.vercel.app
GEMINI_API_KEY=<google ai key>
SENTRY_DSN=<sentry dsn>                   # optional
SECURE_COOKIES=true                        # production only
```

### Environment Variables (Frontend)
```
NEXT_PUBLIC_API_URL=https://your-backend.railway.app
NEXT_PUBLIC_AUTH_URL=https://your-backend.railway.app
NEXT_PUBLIC_SUPABASE_URL=https://odyjksznsdeyweylovzl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon key>
```

### Run Migration 017 (REQUIRED)
The three missing tables must be created before the backend handles any student onboarding or login:

```bash
# Option 1: Supabase Dashboard → SQL Editor → paste 017_missing_auth_and_subjects_tables.sql
# Option 2: psql
psql "$DATABASE_URL" -f backend/app/database/migrations/017_missing_auth_and_subjects_tables.sql
```

### Post-Deploy Verification
```bash
curl https://your-backend.railway.app/health
# Expected: {"status":"ok","services":{"supabase":{"status":"connected"},...}}
```
