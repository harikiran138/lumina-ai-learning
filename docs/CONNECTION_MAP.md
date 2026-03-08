# Connection Map — How Everything Is Wired Together

## System Overview

```
┌─────────────────────────────────────────────────────┐
│                    USER BROWSER                     │
│                                                     │
│  Next.js 15 App (frontend/web/)                     │
│  ├── /login            → Auth flow                  │
│  ├── /student/*        → Student dashboard suite    │
│  ├── /teacher/*        → Teacher dashboard suite    │
│  └── /admin/*          → Admin dashboard suite      │
│                                                     │
│  lib/api.ts            → All backend HTTP calls     │
│  lib/ai-tutor/router.ts→ 3-tier AI response system  │
│  lib/ai-tutor/cache.ts → IndexedDB response cache   │
└────────────────┬────────────────────────────────────┘
                 │ HTTP (fetch with Bearer token)
                 │ Base URL: NEXT_PUBLIC_API_URL
                 │          or http://127.0.0.1:8000
                 ▼
┌─────────────────────────────────────────────────────┐
│              FASTAPI BACKEND                        │
│              backend/app/main.py                    │
│                                                     │
│  Routers mounted:                                   │
│  /api/auth/*           ← auth.py                   │
│  /api/tutor/*          ← ai.py  (AI tutor)          │
│  /api/courses/*        ← courses.py                │
│  /api/student/*        ← student.py                │
│  /api/assignments/*    ← assignments.py            │
│  /api/assessment/*     ← assessment/api/router.py  │
│  /api/community/*      ← community.py              │
│  /api/admin/*          ← admin.py                  │
│  /api/ai/*             ← hybrid.py                 │
│  /api/handwriting/*    ← handwriting_simple.py     │
│                                                     │
│  Middleware:                                        │
│  - CORS (allows FRONTEND_URL)                       │
│  - TrustedHost                                      │
│  - JWT auth (via get_current_user dependency)       │
│  - Rate limiting                                    │
│  - Prometheus metrics                               │
└──────┬──────────────┬──────────────────────────────┘
       │              │
       ▼              ▼
┌──────────────┐  ┌──────────────────────────────────┐
│    REDIS     │  │         SUPABASE (PostgreSQL)     │
│  redis:6379  │  │                                  │
│              │  │  Tables: users, courses,          │
│  - Cache     │  │  progress, assignments,           │
│  - Celery    │  │  submissions, assessment_sessions,│
│    broker    │  │  community_messages, user_data,   │
│  - Rate      │  │  ai_logs, conversations,          │
│    limiting  │  │  certificates                    │
└──────────────┘  └──────────────────────────────────┘
                             │
                    ┌────────┘
                    ▼
         ┌──────────────────┐
         │  CELERY WORKER   │
         │  app/worker.py   │
         │                  │
         │  task_grade_     │
         │  submission()    │
         │  ├── OCR         │
         │  ├── LLM Grade   │
         │  └── DB update   │
         └──────────────────┘
```

---

## Authentication Connection

```
┌──────────────┐     POST /api/auth/token      ┌────────────────────┐
│  Login Page  │  ──────────────────────────►  │  auth.py router    │
│  /login      │                               │                    │
│              │  ◄──────────────────────────  │  1. verify email   │
│              │     { access_token }          │  2. check password │
│              │                               │  3. create JWT     │
│              │     GET /api/auth/me          │                    │
│              │  ──────────────────────────►  │  4. return user    │
│              │                               │     profile        │
│              │  ◄──────────────────────────  └────────────────────┘
│              │     { id, name, role, email }
│              │
│  Store in sessionStorage:
│  - lumina_token
│  - lumina_user
│
│  Redirect → /{role}/dashboard
└──────────────┘
```

---

## AI Tutor Connection (3-tier)

```
Student types message
        │
        ▼
[Tier 1] IndexedDB cache lookup  ──► HIT: return cached answer (<5ms)
        │ MISS
        ▼
[Tier 2] Rule-based matcher
        "hello/hi" → greeting
        "who are you" → identity
        "help" → help text      ──► MATCH: return instant (<1ms)
        │ NO MATCH
        ▼
[Tier 3] POST /api/tutor/chat
        {
          message: "...",
          user_id: "<real user id>",
          session_id: "<uuid>",
          context_filters: { context: "<user profile>" }
        }
        │
        ▼
  FastAPI ai.py router
        │
        ├── GuardianAgent.sanitize_input()   ← safety check
        ├── RAG retrieval (top-3 context)    ← knowledge base
        ├── PathwayAgent.get_constraints()   ← personalization
        ├── UserDataStore (quiz history)     ← learner context
        ├── CourseStore (available courses)  ← course context
        ├── LLM (Gemini / Ollama)            ← generate response
        └── AgentStore.save_message()        ← log conversation
        │
        ▼
  {
    response: "...",
    context_used: [...],
    personalization: { behavior, recommendation }
  }
        │
        ▼
  Cache response in IndexedDB
  Display to student
```

---

## Assessment Connection

```
Student starts quiz
        │
POST /api/assessment/start
  { student_id, topic, num_questions }
        │
        ▼
AssessmentEngine creates session
  current_difficulty = 0.5 (start medium)
        │
Loop:
        │
GET /api/assessment/next-question/{session_id}
        │
        ▼
Question selected based on current_difficulty
        │
Student answers
        │
POST /api/assessment/submit
  { session_id, question_id, selected_option_id, time_taken }
        │
        ▼
Engine updates difficulty:
  correct answer → difficulty +0.1
  wrong answer   → difficulty -0.1
  (clamped 0.0–1.0)
        │
GET /api/assessment/report/{session_id}
        │
        ▼
{
  accuracy: 0.8,
  level: "strong|developing|weak",
  final_ability_estimate: 0.75
}
```

---

## Course Management Connection

```
TEACHER                          BACKEND                      SUPABASE
─────────                        ───────                      ────────
Create course ──POST /api/courses/──► CourseStore ──────────► INSERT courses
Add module    ──POST /{id}/modules──► CourseStore ──────────► UPDATE courses (modules jsonb)
Add lesson    ──POST /{id}/modules/{mid}/lessons──► CourseStore ► UPDATE courses
Publish       ──POST /{id}/publish──► CourseStore ──────────► UPDATE is_published=true

STUDENT
───────
Browse        ──GET /api/courses/──────────────► CourseStore ─► SELECT courses
Enroll        ──POST /api/student/enroll────────► StudentStore ► INSERT progress
View lesson   ──GET /api/courses/{id}───────────► CourseStore ─► SELECT courses
Complete      ──POST /api/student/complete-lesson► StudentStore ► UPDATE completedLessons[]
```

---

## Assignment Grading Connection

```
TEACHER creates assignment
  POST /api/assignments/create
  → AssignmentStore → Supabase (assignments)

STUDENT submits file
  POST /api/assignments/submit (multipart)
  → StorageService saves file to /uploads or S3
  → AssignmentStore creates submission record

TEACHER triggers grading
  POST /api/assignments/{id}/submissions/{sid}/grade
  → Celery dispatches task_grade_submission()
  → Returns { task_id } immediately

BACKGROUND WORKER (async)
  1. Download file from storage
  2. OCR: extract text from image/PDF
  3. Grade: LLM evaluates against rubric
  4. Update submission: { score, feedback, ocr_text, status: "graded" }

TEACHER views result
  GET /api/assignments/{id}/submissions/{sid}/report
  → { score, feedback, level: "weak|developing|strong" }
```

---

## Frontend ↔ Backend API Map

| Frontend Call (lib/api.ts) | Backend Endpoint | Auth Required |
|---------------------------|-----------------|---------------|
| `api.login()` | POST /api/auth/token | No |
| `api.createUser()` | POST /api/auth/register | No |
| `api.getCurrentUser()` | — (sessionStorage) | — |
| `api.getDashboardData("student")` | GET /api/student/dashboard | Yes |
| `api.getDashboardData("teacher")` | GET /api/courses/teacher/dashboard | Yes |
| `api.getDashboardData("admin")` | GET /api/admin/dashboard | Yes |
| `api.getStudentProfile()` | GET /api/student/profile | Yes |
| `api.getStudentBadges()` | GET /api/student/badges | Yes |
| `api.getStudentCertificates()` | GET /api/student/certificates | Yes |
| `api.getStudentMastery()` | GET /api/assessment/student/mastery | Yes |
| `api.enrollInCourse()` | POST /api/student/enroll | Yes |
| `api.completeLesson()` | POST /api/student/complete-lesson | Yes |
| `api.saveNote()` | POST /api/student/note | Yes |
| `api.getNotes()` | GET /api/student/profile | Yes |
| `api.saveQuizResult()` | POST /api/student/quiz-result | Yes |
| `api.getCommunityData()` | GET /api/community/data | Yes |
| `api.sendCommunityMessage()` | POST /api/community/send | Yes |
| `api.getTeacherCourses()` | GET /api/courses/teacher/list | Yes |
| `api.getTeacherStudents()` | GET /api/courses/teacher/students | Yes |
| `api.createCourse()` | POST /api/courses/ | Yes |
| `api.getAllCourses()` | GET /api/courses/ | No |
| `api.getCourseDetails()` | GET /api/courses/{id} | No |
| `api.updateCourseDetails()` | PATCH /api/courses/{id} | Yes |
| `api.deleteCourse()` | DELETE /api/courses/{id} | Yes |
| `api.addModule()` | POST /api/courses/{id}/modules | Yes |
| `api.updateCourseStructure()` | PUT /api/courses/{id}/modules | Yes |
| `api.deleteModule()` | DELETE /api/courses/{id}/modules/{mid} | Yes |
| `api.addLesson()` | POST /api/courses/{id}/modules/{mid}/lessons | Yes |
| `api.deleteLesson()` | DELETE /api/courses/{id}/modules/{mid}/lessons/{lid} | Yes |
| `api.publishCourse()` | POST /api/courses/{id}/publish | Yes |
| `api.getAllUsers()` | GET /api/admin/users | Yes (admin) |
| `api.updateUserStatus()` | POST /api/admin/users/{id}/status | Yes (admin) |
| `api.updateUserRole()` | POST /api/admin/users/{id}/role | Yes (admin) |
| `api.deleteUser()` | DELETE /api/admin/users/{id} | Yes (admin) |
| `api.getAllAILogs()` | GET /api/admin/logs/ai | Yes (admin) |
| `api.deleteAILog()` | DELETE /api/admin/logs/ai/{id} | Yes (admin) |
| `api.getAllChatLogs()` | GET /api/admin/logs/chat | Yes (admin) |
| `api.getAllStudentsWithProgress()` | GET /api/admin/students-progress | Yes (admin) |
| `processMessage()` (router.ts) | POST /api/tutor/chat | No (uses user_id param) |

---

## Role-Based Route Access Summary

| Route Pattern | Who Can Access | Redirect if Not Authorized |
|--------------|---------------|---------------------------|
| `/login` | Everyone | → `/{role}/dashboard` if logged in |
| `/dashboard` | Authenticated | → `/login` if not logged in |
| `/student/*` | Student role | Role check in each page |
| `/teacher/*` | Teacher role | Role check in each page |
| `/admin/*` | Admin role | Role check in each page |
| `/api/admin/*` | Admin JWT | 403 Forbidden |
| `/api/student/*` | Any JWT | 401 Unauthorized |
| `/api/courses/teacher/*` | Teacher/Admin JWT | 403 Forbidden |
| `/api/assignments/create` | Teacher JWT | 403 Forbidden |
| `/api/auth/*` | No auth needed | — |
| `/api/courses/list` | No auth needed | — |
| `/api/courses/` (GET) | No auth needed | — |
