# Complete Student Role - All Related Files & Features Flow

**Project:** Lumina LMS (B.Tech CSE Capstone)  
**Date:** April 15, 2026  
**Scope:** Complete student lifecycle from signup → login → all features

---

## 📋 Table of Contents

1. [Student Role Overview](#student-role-overview)
2. [Phase 1: User Registration & Signup](#phase-1-user-registration--signup)
3. [Phase 2: Authentication & Login](#phase-2-authentication--login)
4. [Phase 3: Dashboard & Course Management](#phase-3-dashboard--course-management)
5. [Phase 4: Learning Features](#phase-4-learning-features)
6. [Phase 5: Assessment & Submissions](#phase-5-assessment--submissions)
7. [Phase 6: AI Tutor & Queue System (TILA)](#phase-6-ai-tutor--queue-system-tila)
8. [Phase 7: Analytics & Progress Tracking](#phase-7-analytics--progress-tracking)
9. [Phase 8: Social & Community Features](#phase-8-social--community-features)
10. [Database Models](#database-models)
11. [Frontend Components & Pages](#frontend-components--pages)

---

## Student Role Overview

**Student (STU)** - Primary end-user of Lumina  

**Login Identifier:** Hall ticket number (e.g., `22NU1A0519`)  
**Responsibilities:** Learning, submitting assignments, asking questions  
**Key Rules:**
- Cannot see other students' data
- AI tutor answers must be teacher-approved (TILA pattern)
- Adaptive learning via BKT+DKT knowledge tracing
- Personalized pathway via PPO agent

---

## PHASE 1: User Registration & Signup

### 📚 Vault Documentation
- [vault/lumina-lms-vault/04-data-flow/01-user-registration-flow.md](vault/lumina-lms-vault/04-data-flow/01-user-registration-flow.md)
- [vault/lumina-lms-vault/02-roles/05-learner.md](vault/lumina-lms-vault/02-roles/05-learner.md)

### 🔧 Backend Files

#### Authentication & User Management
| File | Purpose | Key Functions |
|------|---------|---------------|
| [backend/app/routers/auth.py](backend/app/routers/auth.py) | Authentication endpoints | `POST /api/auth/register` - Student registration |
| [backend/app/routers/users.py](backend/app/routers/users.py) | User operations | Create, read, update user profiles |
| [backend/app/routers/onboarding_unified.py](backend/app/routers/onboarding_unified.py) | Unified onboarding flow | Student onboarding process |
| [backend/app/routers/admin.py](backend/app/routers/admin.py) | Admin student import | `POST /api/admin/students/bulk-import` |

#### Database Models
| Model | File | Purpose |
|-------|------|---------|
| `User` | [backend/app/database/models.py](backend/app/database/models.py) | User accounts (all roles including students) |
| `StudentProfile` | [backend/app/database/models.py](backend/app/database/models.py) | Student-specific data (hall ticket, branch, year, section) |

#### Services
| Service | File | Purpose |
|---------|------|---------|
| User Creation Service | [backend/app/services/user_service.py](backend/app/services/user_service.py) | Create student accounts |
| Onboarding Service | [backend/app/services/onboarding_service.py](backend/app/services/onboarding_service.py) | Handle student onboarding |
| Profile Service | [backend/app/services/profile_service.py](backend/app/services/profile_service.py) | Manage student profiles |

### 🎨 Frontend Files

| Page | File | Purpose |
|------|------|---------|
| Signup Form | [frontend/web/src/app/auth/signup/page.tsx](frontend/web/src/app/auth/signup/page.tsx) | Student signup page |
| Registration | [frontend/web/src/app/auth/register/page.tsx](frontend/web/src/app/auth/register/page.tsx) | Registration process |
| Onboarding | [frontend/web/src/app/onboarding/page.tsx](frontend/web/src/app/onboarding/page.tsx) | Initial onboarding flow |

### API Endpoints

```
POST /api/auth/register              # Student registration
POST /api/admin/students/bulk-import # Bulk student import (CSV)
GET  /api/auth/me                    # Get current user (student)
POST /api/users/{user_id}/profile    # Update student profile
```

---

## PHASE 2: Authentication & Login

### 📚 Vault Documentation
- [vault/lumina-lms-vault/06-auth/01-auth-overview.md](vault/lumina-lms-vault/06-auth/01-auth-overview.md)
- [vault/lumina-lms-vault/06-auth/03-jwt-flow.md](vault/lumina-lms-vault/06-auth/03-jwt-flow.md)
- [vault/lumina-lms-vault/10-diagrams/02-auth-flow.md](vault/lumina-lms-vault/10-diagrams/02-auth-flow.md)

### 🔧 Backend Files

| File | Purpose | Key Functions |
|------|---------|---------------|
| [backend/app/routers/auth.py](backend/app/routers/auth.py) | Auth endpoints | `POST /api/auth/login` - Student login |
| [backend/app/core/security.py](backend/app/core/security.py) | JWT & security | Create JWT token, verify token |
| [backend/app/middleware/auth_middleware.py](backend/app/middleware/auth_middleware.py) | Auth middleware | Verify token on each request |
| [backend/app/core/limiter.py](backend/app/core/limiter.py) | Rate limiting | Brute-force protection (5 attempts → 30min lockout) |

#### Authentication Flow
```python
# Student Login Flow
1. POST /api/auth/login { identifier: "22NU1A0519", password: "..." }
2. Backend verifies hall_ticket in users table
3. Bcrypt hash validation (cost 12)
4. JWT created with: user_id, institution_id, role="student", course_ids
5. Stored in HttpOnly cookie "access_token" (60-minute TTL)
6. Refresh token stored (30-day TTL)
7. Student redirected to dashboard
```

### JWT Token Structure for Student
```json
{
  "sub": "user-uuid",
  "user_id": "uuid",
  "institution_id": "uuid",
  "role": "student",
  "username": "22NU1A0519",
  "department_id": "uuid",
  "iat": 1713192000,
  "exp": 1713195600
}
```

### 🎨 Frontend Files

| Page | File | Purpose |
|------|------|---------|
| Login Page | [frontend/web/src/app/auth/login/page.tsx](frontend/web/src/app/auth/login/page.tsx) | Student login form |
| Auth Context | [frontend/web/src/contexts/AuthContext.tsx](frontend/web/src/contexts/AuthContext.tsx) | JWT session management |
| Auth Hook | [frontend/web/src/hooks/useAuth.ts](frontend/web/src/hooks/useAuth.ts) | Authentication hook |

### API Endpoints

```
POST /api/auth/login           # Login with hall_ticket & password
POST /api/auth/logout          # Logout and clear tokens
POST /api/auth/refresh         # Refresh JWT token
POST /api/auth/forgot-password # Forgot password flow
POST /api/auth/reset-password  # Reset password
POST /api/auth/change-password # Change password (authenticated)
```

### Demo Credentials (Development Only)
```
Hall Ticket: 22NU1A0519
Password:    student@123
(Requires: DEMO_MODE=true environment variable)
```

---

## PHASE 3: Dashboard & Course Management

### 📚 Vault Documentation
- [vault/lumina-lms-vault/08-features/03-learner-dashboard.md](vault/lumina-lms-vault/08-features/03-learner-dashboard.md)

### 🔧 Backend Files

| File | Purpose | Key Endpoints |
|------|---------|---------------|
| [backend/app/routers/student.py](backend/app/routers/student.py) | **Main student endpoints** (62KB!) | Dashboard, courses, progress |
| [backend/app/routers/courses.py](backend/app/routers/courses.py) | Course management | `GET /api/courses` |
| [backend/app/routers/enrollments.py](backend/app/routers/enrollments.py) | Course enrollment | Student enrollment operations |
| [backend/app/routers/curriculum.py](backend/app/routers/curriculum.py) | Learning paths | Pathway recommendations |
| [backend/app/routers/progress.py](backend/app/routers/progress.py) | Progress tracking | Student progress data |

#### Student Router Endpoints
```
GET  /api/student/dashboard           # Student dashboard data
GET  /api/student/courses             # Enrolled courses
GET  /api/student/profile             # Student profile
GET  /api/student/enrollments         # Enrollment list
POST /api/student/enroll/{course_id}  # Enroll in course
GET  /api/student/schedule            # Class schedule
GET  /api/student/notifications       # Student notifications
```

### 🎨 Frontend Files

| Page | File | Purpose |
|------|------|---------|
| Dashboard | [frontend/web/src/app/student/dashboard/page.tsx](frontend/web/src/app/student/dashboard/page.tsx) | Main student dashboard |
| Profile | [frontend/web/src/app/student/profile/page.tsx](frontend/web/src/app/student/profile/page.tsx) | Student profile editing |
| Settings | [frontend/web/src/app/student/settings/page.tsx](frontend/web/src/app/student/settings/page.tsx) | Preferences and settings |
| My Courses | [frontend/web/src/app/student/courses/page.tsx](frontend/web/src/app/student/courses/page.tsx) | List of enrolled courses |
| Course Details | [frontend/web/src/app/student/courses/[courseId]/page.tsx](frontend/web/src/app/student/courses/[courseId]/page.tsx) | Single course view |
| Course Explorer | [frontend/web/src/app/student/course_explorer/page.tsx](frontend/web/src/app/student/course_explorer/page.tsx) | Browse available courses |
| Enrollment | [frontend/web/src/app/student/enrollment/page.tsx](frontend/web/src/app/student/enrollment/page.tsx) | Course enrollment interface |

### Components
```
StudentDashboard/
  ├── EnrolledCourses.tsx
  ├── UpcomingClasses.tsx
  ├── RecentSubmissions.tsx
  ├── QuickStats.tsx
  └── NotificationBell.tsx
```

---

## PHASE 4: Learning Features

### 📚 Vault Documentation
- [vault/lumina-lms-vault/08-features/04-ai-tutor.md](vault/lumina-lms-vault/08-features/04-ai-tutor.md)
- [vault/lumina-lms-vault/08-features/06-knowledge-tracing.md](vault/lumina-lms-vault/08-features/06-knowledge-tracing.md)

### 4.1 Lessons & Course Content

#### Backend Files

| File | Purpose |
|------|---------|
| [backend/app/routers/materials.py](backend/app/routers/materials.py) | Course materials/lessons |
| [backend/app/routers/lesson_page.py](backend/app/routers/lesson_page.py) | Lesson content delivery |

#### Frontend Files

| Page | File | Purpose |
|------|------|---------|
| Lesson Page | [frontend/web/src/app/student/lesson_page/page.tsx](frontend/web/src/app/student/lesson_page/page.tsx) | View lesson content |

### 4.2 Spaced Repetition (FSRS v5)

#### Backend Files

| File | Purpose |
|------|---------|
| [backend/app/routers/fsrs.py](backend/app/routers/fsrs.py) | FSRS scheduling |
| [backend/app/routers/flashcards.py](backend/app/routers/flashcards.py) | Flashcard management |

#### Frontend Files

| Page | File | Purpose |
|------|------|---------|
| Spaced Repetition | [frontend/web/src/app/student/spaced_repetition/page.tsx](frontend/web/src/app/student/spaced_repetition/page.tsx) | FSRS study sessions |

### 4.3 Notes & Study Materials

#### Frontend Files

| Page | File | Purpose |
|------|------|---------|
| My Notes | [frontend/web/src/app/student/my_notes/page.tsx](frontend/web/src/app/student/my_notes/page.tsx) | Personal note-taking |

---

## PHASE 5: Assessment & Submissions

### 📚 Vault Documentation
- [vault/lumina-lms-vault/04-data-flow/05-assessment-flow.md](vault/lumina-lms-vault/04-data-flow/05-assessment-flow.md)

### 🔧 Backend Files

| File | Purpose | Key Endpoints |
|------|---------|---------------|
| [backend/app/routers/assessment.py](backend/app/routers/assessment.py) | Quiz endpoints | `POST /api/quiz/submit` |
| [backend/app/routers/assignments.py](backend/app/routers/assignments.py) | Assignment submission | `POST /api/assignments/{id}/submit` |
| [backend/app/routers/handwritten.py](backend/app/routers/handwritten.py) | Handwritten answer processing | Image upload & OCR |
| [backend/app/routers/handwriting_simple.py](backend/app/routers/handwriting_simple.py) | Handwriting recognition | TrOCR pipeline |

#### Assessment Flow
```
Student Takes Quiz:
1. GET /api/quiz/{quiz_id}          → Get questions (shuffled per student)
2. POST /api/quiz/submit             → Submit answers
3. Backend: BKT + DKT update         → Update knowledge state
4. Backend: FSRS update              → Schedule review cards
5. GET /api/quiz/{quiz_id}/results   → View instant results
```

### 🎨 Frontend Files

| Page | File | Purpose |
|------|------|---------|
| Assessment | [frontend/web/src/app/student/assessment/page.tsx](frontend/web/src/app/student/assessment/page.tsx) | Take quizzes |
| Assignments | [frontend/web/src/app/student/assignments/page.tsx](frontend/web/src/app/student/assignments/page.tsx) | View & submit assignments |
| Handwriting | [frontend/web/src/app/student/handwriting/page.tsx](frontend/web/src/app/student/handwriting/page.tsx) | Submit handwritten work |
| Grades | [frontend/web/src/app/student/grades/page.tsx](frontend/web/src/app/student/grades/page.tsx) | View grades & results |

### API Endpoints

```
GET    /api/quiz/{quiz_id}              # Get quiz with shuffled questions
POST   /api/quiz/submit                 # Submit quiz answers
GET    /api/quiz/{quiz_id}/results      # View graded results
GET    /api/assignments                 # List assignments
POST   /api/assignments/{id}/submit     # Submit assignment
GET    /api/assignments/{id}            # Get assignment details
POST   /api/handwriting/upload          # Upload handwritten answer
GET    /api/grades                      # View all grades
```

---

## PHASE 6: AI Tutor & Queue System (TILA)

### 📚 Vault Documentation
- [vault/lumina-lms-vault/04-data-flow/04-ai-agent-job-flow.md](vault/lumina-lms-vault/04-data-flow/04-ai-agent-job-flow.md)
- [vault/lumina-lms-vault/03-agents/02-tutor-agent.md](vault/lumina-lms-vault/03-agents/02-tutor-agent.md)

### TILA Pattern (Teacher-mediated AI)
```
1. Student asks question → Dispatch to AI Engine
2. Tutor Agent (Claude Sonnet) generates answer → RAG-grounded
3. Guardian Agent (Claude Haiku) validates answer
4. Answer lands in Teacher's queue (status=PENDING)
5. Student sees: "Wait for teacher approval"
6. Teacher reviews & approves/rejects
7. Only on APPROVE → Student sees answer
8. Approved Q&A indexed into RAG for future students
```

### 🔧 Backend Files

| File | Purpose | Key Endpoints |
|------|---------|---------------|
| [backend/app/routers/ai_tutor.py](backend/app/routers/ai_tutor.py) | Student-facing tutor | `POST /api/ai-tutor/ask` |
| [backend/app/routers/ai_queue.py](backend/app/routers/ai_queue.py) | Queue management | `GET /api/ai-queue/status` |
| [backend/app/routers/ai.py](backend/app/routers/ai.py) | AI engine interface | Agent orchestration |
| [backend/app/routers/ai_agents.py](backend/app/routers/ai_agents.py) | Agent endpoints | Individual agent endpoints |

#### RAG Service
| File | Purpose |
|------|---------|
| [backend/app/rag/faiss_store.py](backend/app/rag/faiss_store.py) | FAISS vector store |
| [backend/app/rag/retriever.py](backend/app/rag/retriever.py) | Answer retrieval |

### 🎨 Frontend Files

| Page | File | Purpose |
|------|------|---------|
| AI Tutor | [frontend/web/src/app/student/ai_tutor/page.tsx](frontend/web/src/app/student/ai_tutor/page.tsx) | Chat interface with AI tutor |

### API Endpoints

```
POST   /api/ai-tutor/ask                # Ask a question
GET    /api/ai-tutor/answer/{q_id}     # Get answer (when approved)
GET    /api/ai-queue/status            # Check queue status
GET    /api/ai-queue/my-questions      # Student's questions
```

---

## PHASE 7: Analytics & Progress Tracking

### 📚 Vault Documentation
- [vault/lumina-lms-vault/08-features/06-knowledge-tracing.md](vault/lumina-lms-vault/08-features/06-knowledge-tracing.md)
- [vault/lumina-lms-vault/08-features/08-dropout-prediction.md](vault/lumina-lms-vault/08-features/08-dropout-prediction.md)

### 7.1 Knowledge Tracing

#### Backend Files

| File | Purpose |
|------|---------|
| [backend/learner_profile/models/bkt.py](backend/learner_profile/models/bkt.py) | Bayesian Knowledge Tracing |
| [backend/learner_profile/models/dkt.py](backend/learner_profile/models/dkt.py) | Deep Knowledge Tracing (LSTM) |
| [backend/app/personalization/dkt_engine.py](backend/app/personalization/dkt_engine.py) | DKT inference engine |
| [backend/app/routers/personalization.py](backend/app/routers/personalization.py) | Personalization endpoints |

### 7.2 Progress Dashboard

#### Frontend Files

| Page | File | Purpose |
|------|------|---------|
| Progress | [frontend/web/src/app/student/progress/page.tsx](frontend/web/src/app/student/progress/page.tsx) | Overall progress view |
| Knowledge Graph | [frontend/web/src/app/student/progress/knowledge-graph/page.tsx](frontend/web/src/app/student/progress/knowledge-graph/page.tsx) | Knowledge component mastery |

### 7.3 Dropout Risk Prediction

#### Backend Files

| File | Purpose |
|------|---------|
| [backend/app/routers/dropout.py](backend/app/routers/dropout.py) | Dropout prediction endpoints |
| [backend/ml_services/dropout_prediction.py](backend/ml_services/dropout_prediction.py) | ML model for dropout |

### 7.4 Personalized Learning Path

#### Backend Files

| File | Purpose |
|------|---------|
| [backend/app/routers/pathway.py](backend/app/routers/pathway.py) | Pathway recommendations |
| [backend/app/personalization/authenticity_engine.py](backend/app/personalization/authenticity_engine.py) | Authenticity scoring |
| [backend/app/personalization/kpi_engine.py](backend/app/personalization/kpi_engine.py) | KPI tracking |

### API Endpoints

```
GET    /api/student/knowledge-state    # Get mastery for all KCs
GET    /api/student/progress-summary   # Overall progress
GET    /api/student/dropout-risk       # Dropout risk badge (LOW/MED/HIGH)
GET    /api/student/next-lesson        # Recommended next topic
GET    /api/analytics/performance      # Student analytics
```

---

## PHASE 8: Social & Community Features

### 📚 Vault Documentation
- [vault/lumina-lms-vault/08-features/05-community.md](vault/lumina-lms-vault/08-features/05-community.md)

### 🔧 Backend Files

| File | Purpose | Key Endpoints |
|------|---------|---------------|
| [backend/app/routers/community.py](backend/app/routers/community.py) | Discussion forums | `POST /api/community/post` |
| [backend/app/routers/study_groups.py](backend/app/routers/study_groups.py) | Study group collaboration | Create/join groups |
| [backend/app/routers/gamification.py](backend/app/routers/gamification.py) | Gamification features | Badges, points, leaderboard |
| [backend/app/routers/peer_tutor.py](backend/app/routers/peer_tutor.py) | Peer tutoring | Student-to-student help |

### 🎨 Frontend Files

| Page | File | Purpose |
|------|------|---------|
| Community | [frontend/web/src/app/student/community/page.tsx](frontend/web/src/app/student/community/page.tsx) | Discussion forums & posts |
| Leaderboard | [frontend/web/src/app/student/leaderboard/page.tsx](frontend/web/src/app/student/leaderboard/page.tsx) | Rankings & gamification |
| Achievements | [frontend/web/src/app/student/achievements/page.tsx](frontend/web/src/app/student/achievements/page.tsx) | Badges & awards |

### API Endpoints

```
POST   /api/community/post              # Create forum post
GET    /api/community/posts             # Get posts (course-scoped)
POST   /api/community/post/{id}/reply   # Reply to post
GET    /api/leaderboard                 # Student rankings
GET    /api/achievements                # Student badges
```

---

## Additional Student Features

### Attendance & Schedule

#### Backend Files
| File | Purpose |
|------|---------|
| [backend/app/routers/attendance.py](backend/app/routers/attendance.py) | Attendance tracking |
| [backend/app/routers/schedule.py](backend/app/routers/schedule.py) | Class schedule |

#### Frontend Files
| Page | File |
|------|------|
| Attendance | [frontend/web/src/app/student/attendance/page.tsx](frontend/web/src/app/student/attendance/page.tsx) |

### Exam Readiness

#### Frontend Files
| Page | File |
|------|------|
| Exam Readiness | [frontend/web/src/app/student/exam_readiness/page.tsx](frontend/web/src/app/student/exam_readiness/page.tsx) |

### Notifications

#### Backend Files
| File | Purpose |
|------|---------|
| [backend/app/routers/notifications.py](backend/app/routers/notifications.py) | Notification delivery |
| [backend/app/routers/realtime.py](backend/app/routers/realtime.py) | Real-time updates (WebSocket) |

---

## Database Models

###  Student-Related Tables in Supabase PostgreSQL

```
users (all roles)
├── id (UUID)
├── institution_id (UUID) - multi-tenant scoping
├── username (hall_ticket for student)
├── email
├── password_hash (bcrypt)
├── role ('student')
├── created_at
└── updated_at

student_profiles
├── id (UUID)
├── user_id (FK → users)
├── institution_id (UUID)
├── hall_ticket
├── branch (CSE, ECE, ME, etc)
├── year (1, 2, 3, 4)
├── section (A, B, C, etc)
├── achievements
├── dropout_risk_score
└── updated_at

enrollments
├── id (UUID)
├── student_id (FK → users)
├── course_id (FK → courses)
├── institution_id (UUID)
├── status ('active', 'completed', 'dropped')
├── enrolled_at
└── completed_at

quiz_submissions
├── id (UUID)
├── student_id (FK → users)
├── quiz_id (FK → quizzes)
├── answers { kc_id: conception, answer: correct/incorrect }
├── score
├── submitted_at
└── graded_at

assignment_submissions
├── id (UUID)
├── student_id (FK → users)
├── assignment_id (FK → assignments)
├── submission_url / text
├── status ('draft', 'submitted', 'graded', 'rejected')
└── submitted_at

ai_tutor_questions
├── id (UUID)
├── student_id (FK → users)
├── course_id (FK → courses)
├── question_text
├── status ('PENDING', 'APPROVED', 'REJECTED')
├── answer_text
├── teacher_id (FK → users) - Teacher who approved
├── created_at
└── teacher_reviewed_at

knowledge_state
├── id (UUID)
├── student_id (FK → users)
├── knowledge_component_id (FK → kcs)
├── mastery_probability (BKT P(mastery))
├── updated_at
└── source ('quiz_submission', 'assessment', 'interaction')

dropout_features
├── student_id (FK → users)
├── institution_id (UUID)
├── recent_quiz_avg (last 3 quizzes avg)
├── attendance_percentage
├── ai_engagement_score
├── last_updated
└── prediction_score (0-1)

flashcard_sessions
├── id (UUID)
├── student_id (FK → users)
├── reviewed_at
├── stability
├── difficulty
└── retrievability

community_posts
├── id (UUID)
├── author_id (FK → users) - student
├── course_id (FK → courses)
├── title
├── content
├── is_editable_by_author
├── created_at
└── updated_at
```

---

## Full Student API Reference

### Authentication
```
POST /api/auth/register                  # Signup
POST /api/auth/login                     # Login with hall_ticket
POST /api/auth/logout                    # Logout
POST /api/auth/refresh                   # Refresh token
POST /api/auth/change-password           # Change password
GET  /api/auth/me                        # Get current user
```

### Dashboard & Profile
```
GET  /api/student/dashboard             # Dashboard data
GET  /api/student/profile               # Student profile
PUT  /api/student/profile               # Update profile
GET  /api/student/notifications         # Student notifications
GET  /api/student/enrollments           # Enrolled courses
POST /api/student/enroll/{course_id}    # Enroll in course
```

### Learning
```
GET  /api/courses                       # Browse courses
GET  /api/courses/{course_id}           # Course details
GET  /api/courses/{course_id}/content   # Course content/lessons
GET  /api/student/pathway               # Next lesson recommendation
GET  /api/student/knowledge-state       # Mastery percentages
```

### Assessment
```
GET    /api/quiz/{quiz_id}              # Get quiz questions (shuffled)
POST   /api/quiz/submit                 # Submit quiz
GET    /api/quiz/{quiz_id}/results      # Quiz results
GET    /api/assignments                 # List assignments
POST   /api/assignments/{id}/submit     # Submit assignment
GET    /api/grades                      # View all grades
```

### AI Tutor
```
POST   /api/ai-tutor/ask                # Ask question
GET    /api/ai-tutor/answer/{q_id}     # Get approved answer
GET    /api/ai-queue/status             # Queue status
GET    /api/ai-queue/my-questions       # My pending questions
```

### Analytics & Progress
```
GET    /api/student/progress-summary    # Overall progress
GET    /api/student/dropout-risk        # Dropout risk badge
GET    /api/analytics/performance       # Detailed analytics
GET    /api/student/achievements        # Badges & achievements
GET    /api/leaderboard                 # Rankings
```

### Community
```
POST   /api/community/post              # Create post
GET    /api/community/posts             # List posts
POST   /api/community/post/{id}/reply   # Reply to post
GET    /api/study_groups                # List study groups
```

### Utilities
```
GET    /api/student/schedule            # Class schedule
GET    /api/student/attendance          # Attendance record
GET    /api/flashcards                  # Spaced repetition cards
POST   /api/handwriting/upload          # Upload handwritten work
```

---

## Frontend Component Structure

```
frontend/web/src/
├── app/
│   ├── auth/                           # Authentication pages
│   │   ├── login/page.tsx
│   │   ├── signup/page.tsx
│   │   ├── forgot-password/page.tsx
│   │   └── reset-password/page.tsx
│   └── student/                        # Student dashboard pages
│       ├── dashboard/page.tsx          # Main dashboard
│       ├── profile/page.tsx            # Edit profile
│       ├── settings/page.tsx           # Preferences
│       ├── courses/                    # Course management
│       │   ├── page.tsx                # List courses
│       │   └── [courseId]/page.tsx    # Course details
│       ├── assessment/page.tsx         # Take quizzes
│       ├── assignments/page.tsx        # Submit assignments
│       ├── grades/page.tsx             # View grades
│       ├── ai_tutor/page.tsx           # Chat with AI
│       ├── progress/page.tsx           # Progress tracking
│       ├── knowledge-graph/page.tsx    # Knowledge visualization
│       ├── spaced_repetition/page.tsx  # Flashcard study
│       ├── my_notes/page.tsx           # Personal notes
│       ├── community/page.tsx          # Discussion forum
│       ├── leaderboard/page.tsx        # Rankings
│       ├── achievements/page.tsx       # Badges
│       ├── attendance/page.tsx         # Attendance record
│       ├── handwriting/page.tsx        # Handwritten submissions
│       ├── exam_readiness/page.tsx     # Exam prep
│       └── lesson_page/page.tsx        # View lesson content
│
├── components/
│   ├── StudentDashboard/
│   ├── CourseCard/
│   ├── QuizInterface/
│   ├── AITutorChat/
│   ├── ProgressChart/
│   ├── KnowledgeGraph/
│   └── ... other components
│
├── hooks/
│   ├── useAuth.ts                      # Auth hook
│   ├── useStudent.ts                   # Student data hook
│   ├── useCourses.ts                   # Course data hook
│   ├── useProgress.ts                  # Progress tracking hook
│   └── ... other hooks
│
├── lib/
│   ├── api.ts                          # API client
│   ├── student-services.ts             # Student-specific services
│   └── ... other utilities
│
└── contexts/
    ├── AuthContext.tsx                 # Auth state
    ├── StudentContext.tsx              # Student state
    └── ... other contexts
```

---

## Key Services & Utils

### Backend Services

| Service | Location | Purpose |
|---------|----------|---------|
| UserService | `backend/app/services/user_service.py` | User CRUD operations |
| StudentService | `backend/app/services/student_service.py` | Student-specific logic |
| EnrollmentService | `backend/app/services/enrollment_service.py` | Course enrollment |
| AssessmentService | `backend/app/services/assessment_service.py` | Quiz/assignment grading |
| AITutorService | `backend/app/services/ai_tutor_service.py` | AI agent orchestration |
| KnowledgeService | `backend/app/services/knowledge_service.py` | BKT+DKT calculations |
| NotificationService | `backend/app/services/notification_service.py` | Send notifications |

### Frontend Hooks & Utilities

| Hook/Util | Location | Purpose |
|-----------|----------|---------|
| useAuth | `frontend/web/src/hooks/useAuth.ts` | Authentication |
| useStudent | `frontend/web/src/hooks/useStudent.ts` | Student data fetching |
| useCourses | `frontend/web/src/hooks/useCourses.ts` | Course management |
| useProgress | `frontend/web/src/hooks/useProgress.ts` | Progress tracking |
| useAITutor | `frontend/web/src/hooks/useAITutor.ts` | AI tutor interaction |
| apiClient | `frontend/web/src/lib/api.ts` | HTTP client |

---

## Database Migrations (Related to Students)

Located in: `backend/app/database/migrations/`

| Migration | Purpose |
|-----------|---------|
| `001_create_users.sql` | Create users table |
| `002_create_student_profiles.sql` | Create student_profiles |
| `003_create_enrollments.sql` | Create enrollments table |
| `004_create_quiz_submissions.sql` | Quiz submission tracking |
| `005_create_assignments.sql` | Assignment management |
| `006_create_knowledge_state.sql` | Knowledge tracing data |
| `007_create_ai_queue.sql` | AI tutor queue |
| `008_create_dropout_features.sql` | Dropout prediction features |
| ... (11 migrations total) |

---

## Configuration Files

### Environment Variables for Student Features
```bash
# Authentication
JWT_SECRET_KEY=your-secret-key
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
REFRESH_TOKEN_EXPIRE_DAYS=30

# Database
DATABASE_URL=postgresql://user:pass@localhost/lumina_db
REDIS_URL=redis://localhost:6379

# AI Services
CLAUDE_API_KEY=sk-...
PATHWAY_API_URL=http://localhost:8001
FAISS_INDEX_PATH=./data/faiss_indices

# Features
DEMO_MODE=false (set to true for demo credentials)
ENABLE_HANDWRITING=true
ENABLE_AI_TUTOR=true
ENABLE_DROPOUT_PREDICTION=true
```

---

## Testing

### Test Files
| Test | Location | Purpose |
|------|----------|---------|
| Student Auth Tests | `backend/tests/test_auth_student.py` | Student auth flow |
| Student Dashboard Tests | `backend/tests/test_student_dashboard.py` | Dashboard endpoints |
| Assessment Tests | `backend/tests/test_assessment.py` | Quiz/assignment submission |
| AI Tutor Tests | `backend/tests/test_ai_tutor.py` | TILA queue system |

### Frontend Tests
| Test | Location | Purpose |
|------|----------|---------|
| Dashboard Tests | `frontend/web/src/app/student/__tests__/dashboard.test.tsx` | Dashboard rendering |
| Auth Tests | `frontend/web/src/__tests__/auth.test.tsx` | Login/signup flow |
| API Tests | `frontend/web/src/__tests__/api.test.ts` | API client tests |

---

## Summary: Student Flow Chart

```
SIGNUP FLOW
└─→ Register (hall_ticket, password, email)
    └─→ Create user + student_profile
        └─→ Redirect to login

LOGIN FLOW
└─→ Login (hall_ticket, password)
    └─→ Verify credentials
        └─→ Generate JWT
            └─→ Store in HttpOnly cookie
                └─→ Redirect to dashboard

DASHBOARD
└─→ View enrolled courses
    └─→ View notifications
        └─→ View upcoming class schedule
            └─→ Show recommended next lesson
                └─→ Show dropout risk badge

COURSE INTERACTION
├─→ View course content/lessons
├─→ Take quiz
│   └─→ Submit answers
│       └─→ View instant results
│           └─→ Update knowledge state (BKT+DKT)
├─→ Submit assignment
│   └─→ (May require teacher review)
└─→ Ask AI tutor question
    └─→ Wait for teacher approval (TILA)
        └─→ View approved answer (when teacher approves)
            └─→ Approved Q&A indexed for RAG

PERSONALIZED LEARNING
└─→ System calculates mastery (BKT+DKT)
    └─→ PPO agent selects next topic
        └─→ Show recommendation on dashboard
            └─→ Student follows or chooses alternative

PROGRESS TRACKING
└─→ View knowledge graph (mastery per KC)
    └─→ View progress summary
        └─→ See dropout risk prediction
            └─→ View spaced repetition schedule (FSRS)

COMMUNITY
└─→ Create forum posts
    └─→ Reply to classmates
        └─→ Participate in study groups
            └─→ View leaderboard & achievements
```

---

## Complete File Checklist

### ✅ Signup Files
- [ ] backend/app/routers/auth.py (POST /register)
- [ ] backend/app/routers/users.py
- [ ] backend/app/routers/onboarding_unified.py
- [ ] backend/app/database/models.py (User, StudentProfile)
- [ ] backend/app/services/user_service.py
- [ ] frontend/web/src/app/auth/signup/page.tsx

### ✅ Login Files
- [ ] backend/app/routers/auth.py (POST /login)
- [ ] backend/app/core/security.py
- [ ] backend/app/core/limiter.py
- [ ] frontend/web/src/app/auth/login/page.tsx
- [ ] frontend/web/src/hooks/useAuth.ts

### ✅ Dashboard Files
- [ ] backend/app/routers/student.py (primary file - 62KB)
- [ ] frontend/web/src/app/student/dashboard/page.tsx

### ✅ Course Management
- [ ] backend/app/routers/courses.py
- [ ] backend/app/routers/enrollments.py
- [ ] frontend/web/src/app/student/courses/page.tsx

### ✅ Assessment
- [ ] backend/app/routers/assessment.py
- [ ] backend/app/routers/assignments.py
- [ ] backend/app/routers/handwriting.py
- [ ] frontend/web/src/app/student/assessment/page.tsx

### ✅ AI Tutor
- [ ] backend/app/routers/ai_tutor.py
- [ ] backend/app/routers/ai_queue.py
- [ ] frontend/web/src/app/student/ai_tutor/page.tsx

### ✅ Progress Tracking
- [ ] backend/learner_profile/models/bkt.py
- [ ] backend/learner_profile/models/dkt.py
- [ ] backend/app/routers/personalization.py
- [ ] frontend/web/src/app/student/progress/page.tsx

### ✅ Community
- [ ] backend/app/routers/community.py
- [ ] backend/app/routers/gamification.py
- [ ] frontend/web/src/app/student/community/page.tsx

---

**Document Last Updated:** April 15, 2026  
**Total Files Listed:** 80+  
**Coverage:** 100% of student-related files from signup to all features

*This document serves as a comprehensive reference for all student role related files in the Lumina LMS project.*
