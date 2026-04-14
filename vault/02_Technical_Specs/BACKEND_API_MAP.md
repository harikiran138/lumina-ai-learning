# Backend API Map

> **Last Updated:** 2026-04-14 | **Source:** `backend/app/main.py` router registry
>
> Complete HTTP endpoint reference for all Lumina API routes. Organized by domain. Authentication required on all routes unless marked `Public`.

---

## 🔐 Authentication — `/api/auth`
**Router:** `backend/app/routers/auth.py`

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/login` | Public | Email/password → JWT pair |
| POST | `/api/auth/register` | Public | Create new user account |
| POST | `/api/auth/refresh` | Refresh Token | Rotate access token |
| POST | `/api/auth/logout` | Bearer | Blacklist current token |
| POST | `/api/auth/change-password` | Bearer | Update password |
| GET | `/api/auth/me` | Bearer | Current user profile |

---

## 🎓 Student — `/api/student`
**Router:** `backend/app/routers/student.py` | **Guard:** `student` role

| Method | Path | Description |
|---|---|---|
| GET | `/api/student/dashboard` | Full dashboard payload |
| POST | `/api/student/tutor/ask` | Submit question to AI Tutor (TILA) |
| GET | `/api/student/tutor/answer/{id}` | Poll for AI answer |
| GET | `/api/student/analytics` | Personal performance analytics |
| POST | `/api/student/activity` | Log learning activity |
| GET | `/api/student/badges` | Gamification badges |
| GET | `/api/student/leaderboard` | Rank leaderboard |
| GET | `/api/student/profile` | Full student profile |
| POST | `/api/student/profile/update` | Update profile fields |
| GET | `/api/student/profile/analytics` | Profile-level analytics |
| GET | `/api/student/profile/projections` | Grade projections |
| GET | `/api/student/subjects/list` | Enrolled subjects |
| GET | `/api/student/attendance/summary` | Attendance summary |
| GET | `/api/student/attendance/detail` | Detailed attendance |
| GET | `/api/student/assignments/list` | Active assignments |
| POST | `/api/student/assignments/submit` | Submit assignment |
| GET | `/api/student/grades/list` | Grade list |
| GET | `/api/student/materials/list` | Study materials |
| GET | `/api/student/certificates` | Earned certificates |
| GET | `/api/student/adaptive/next-question` | DKT-powered next question |
| GET | `/api/student/review/schedule` | FSRS spaced-repetition schedule |
| GET | `/api/student/spaced-repetition/list` | Cards due for review |
| POST | `/api/student/spaced-repetition/submit` | Submit FSRS card review |
| POST | `/api/student/quiz/submit-answer` | Submit quiz answer |
| POST | `/api/student/behavior/ingest` | Log behavioral signal |
| GET | `/api/student/intelligence/report` | Personalization report |
| GET | `/api/student/intelligence` | Full intelligence payload |
| GET | `/api/student/intelligence/debug/{question_id}` | Debug intelligence for question |
| GET | `/api/student/debug/trace` | System trace for debugging |
| GET | `/api/student/onboarding/options` | Onboarding question options |
| POST | `/api/student/onboarding/complete` | Complete onboarding flow |

---

## 🧑‍🏫 Teacher — `/api/teacher`
**Router:** `backend/app/routers/teacher.py` | **Guard:** `teacher`, `hod`, `college_admin`, `super_admin`

| Method | Path | Description |
|---|---|---|
| GET | `/api/teacher/dashboard` | Teacher dashboard (students, assignments, interventions) |
| GET | `/api/teacher/onboarding/options` | Onboarding question options |
| POST | `/api/teacher/onboarding/complete` | Complete teacher onboarding |
| GET | `/api/teacher/subjects` | Assigned subjects/courses |
| GET | `/api/teacher/students/{batch_id}` | Students in a batch |
| GET | `/api/teacher/interventions/queue` | Pending interventions |
| PATCH | `/api/teacher/interventions/{id}` | Update intervention status |
| GET | `/api/teacher/heatmap/{course_id}` | Student mastery heatmap |
| POST | `/api/teacher/content/upload` | Upload content file |
| GET | `/api/teacher/content/scaffold/{upload_id}` | Get generated content scaffold |
| POST | `/api/teacher/content/scaffold/approve/{upload_id}` | Approve scaffold |
| GET | `/api/teacher/verification/queue` | AI-graded answers awaiting verification |
| POST | `/api/teacher/submissions/physical/process/{submission_id}` | Process handwritten submission |
| GET | `/api/teacher/analytics/misconceptions` | Common misconceptions analysis |
| GET | `/api/teacher/analytics/growth` | Student growth trends |
| GET | `/api/teacher/students/{student_id}/analytics` | Per-student analytics |
| GET | `/api/teacher/requests` | Teacher assignment requests |
| PATCH | `/api/teacher/requests/{id}` | Update request status |
| GET | `/api/teacher/assignments` | List assignments |
| POST | `/api/teacher/assignments/request` | Request new assignment (→ HOD approval) |

---

## 🏛 HOD — `/api/hod`
**Router:** `backend/app/routers/hod.py` | **Guard:** `hod`, `college_admin`, `super_admin`

| Method | Path | Description |
|---|---|---|
| GET | `/api/hod/dashboard` | HOD dashboard (dept stats, teachers, programs, pending requests) |
| GET | `/api/hod/department` | Department details |
| GET | `/api/hod/teachers` | All department teachers |
| GET | `/api/hod/programs` | All department programs |
| GET | `/api/hod/requests` | Pending teacher requests |
| PATCH | `/api/hod/requests/{id}` | Approve (`APPROVED`) or reject (`REJECTED`) teacher request |

---

## 🔧 Admin — `/api/admin`
**Router:** `backend/app/routers/admin.py` | **Guard:** `college_admin`, `super_admin`

| Method | Path | Description |
|---|---|---|
| GET | `/api/admin/config` | Platform config and feature flags |
| POST | `/api/admin/config` | Update platform config |
| POST | `/api/admin/shadow-mode` | Toggle shadow mode |
| GET | `/api/admin/dashboard` | Admin system dashboard |
| GET | `/api/admin/health` | System health audit |
| GET | `/api/admin/queue-health` | AI queue health stats |
| GET | `/api/admin/guardian` | Guardian agent status |
| GET | `/api/admin/roles/matrix` | Role-permission matrix |
| POST | `/api/admin/roles/matrix` | Update role-permission matrix |
| GET | `/api/admin/users` | List all users |
| POST | `/api/admin/users` | Create user |
| DELETE | `/api/admin/users/{id}` | Delete user |
| POST | `/api/admin/users/{id}/status` | Update user active status |
| POST | `/api/admin/users/{id}/role` | Change user role |
| PATCH | `/api/admin/users/by-email` | Update user by email |
| GET | `/api/admin/courses` | List all courses |
| GET | `/api/admin/teachers` | List all teachers |
| GET | `/api/admin/students` | List all students |
| GET | `/api/admin/logs/ai` | AI interaction logs |
| DELETE | `/api/admin/logs/ai/{log_id}` | Delete AI log entry |
| GET | `/api/admin/logs/chat` | Chat session logs |
| GET | `/api/admin/students-progress` | Student progress snapshot |
| GET | `/api/admin/interventions` | All system interventions |
| GET | `/api/admin/institutions` | List institutions |
| POST | `/api/admin/institutions` | Create institution |
| PATCH | `/api/admin/institutions/{id}/status` | Update institution status |
| GET | `/api/admin/institutions/{id}/departments` | List departments |
| POST | `/api/admin/institutions/{id}/departments` | Create department |
| PATCH | `/api/admin/institutions/{id}/departments/{dept_id}` | Update department |
| PATCH | `/api/admin/institutions/{id}/departments/{dept_id}/hod` | Assign HOD |
| GET | `/api/admin/teachers/stats` | Teacher performance stats |
| GET | `/api/admin/institutions/{id}/programs` | List programs |
| POST | `/api/admin/institutions/{id}/programs` | Create program |
| GET | `/api/admin/programs/{id}/semesters` | List semesters |
| POST | `/api/admin/programs/{id}/semesters` | Create semester |
| PATCH | `/api/admin/classes/{id}` | Update class |
| GET | `/api/admin/classes/{id}/summary` | Class summary |
| POST | `/api/admin/connections/link` | Link student to class/batch |
| GET | `/api/admin/connections` | List student connections |
| GET | `/api/admin/compliance/deletions` | GDPR deletion requests |
| POST | `/api/admin/compliance/deletions/{id}/process` | Process deletion |
| GET | `/api/admin/compliance/audit-logs` | Compliance audit logs |
| GET | `/api/admin/compliance` | Compliance dashboard |
| GET | `/api/admin/guardian-log` | Guardian AI activity log |
| GET | `/api/admin/reports` | Admin reports |
| GET | `/api/admin/students/{id}/enrollment` | Student enrollment details |
| POST | `/api/admin/students/{id}/promote` | Promote student to next semester |
| GET | `/api/admin/students/{id}/credits` | Student credit summary |
| POST | `/api/admin/students/{id}/credits` | Assign credits |
| POST | `/api/admin/bulk-enrollment` | CSV bulk enrollment |
| GET | `/api/admin/departments` | List departments (shorthand) |
| POST | `/api/admin/departments` | Create department |
| DELETE | `/api/admin/departments/{id}` | Delete department |
| GET | `/api/admin/classes` | List classes |
| POST | `/api/admin/classes` | Create class |
| DELETE | `/api/admin/classes/{id}` | Delete class |
| GET | `/api/admin/ai/prompts` | AI prompt audit |
| GET | `/api/admin/ai/models` | Available AI models |
| GET | `/api/admin/ai/costs` | AI cost tracking |
| GET | `/api/admin/parents/pending-verification` | Pending parent verifications |

---

## 🤖 AI — `/api`
**Router:** `backend/app/routers/ai.py` | Multiple guards

| Method | Path | Description |
|---|---|---|
| POST | `/api/tutor` | Core AI tutor endpoint (TILA) |
| GET | `/api/ai` | Hybrid AI endpoint (OpenRouter) |
| POST | `/api/ai/generate` | AI generation (Hybrid router) |

---

## 📋 AI Queue — `/api`
**Router:** `backend/app/routers/ai_queue.py`

| Method | Path | Description |
|---|---|---|
| POST | `/api/ai/queue/enqueue` | Enqueue a question |
| GET | `/api/ai/queue/status/{id}` | Poll queue status |
| POST | `/api/ai/queue/process` | Trigger processing (internal) |

---

## 🏗 Knowledge Pipeline — `/api/v1/unit-pipeline`
**Router:** `backend/app/routers/unit_pipeline.py`

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/unit-pipeline/generate` | Generate knowledge units from content |
| GET | `/api/v1/unit-pipeline/status/{job_id}` | Pipeline job status |

---

## ✍️ OCR / Handwritten — `/api/v1/handwritten`
**Router:** `backend/app/routers/handwritten.py`

| Method | Path | Description |
|---|---|---|
| POST | `/api/v1/handwritten/process` | Upload and process handwritten document |
| GET | `/api/v1/handwritten/result/{id}` | Get OCR result |

---

## 👨‍👩‍👧 Support Roles

| Prefix | Router | Guard | Description |
|---|---|---|---|
| `/api/parent` | `parent.py` | `parent` | Parent portal (child progress, goals) |
| `/api/mentor` | `mentor.py` | `mentor` | Mentorship sessions and milestones |
| `/api/peer_tutor` | `peer_tutor.py` | `peer_tutor` | Peer tutoring sessions |
| `/api/counselor` | `counselor.py` | `counselor` | Wellbeing and academic counseling |
| `/api/content_creator` | `content_creator.py` | `content_creator` | Course content authoring |
| `/api/researcher` | `researcher.py` | `researcher` | Research data access |
| `/api/alumni` | `alumni.py` | `alumni` | Alumni portal |

---

## 🛠 Platform Services

| Prefix | Router | Description |
|---|---|---|
| `/api/personalization` | `personalization.py` | Personalization state and events |
| `/api/community` | `community.py` | Study groups, discussion |
| `/api/knowledge-graph` | `knowledge_graph.py` | Concept graph queries |
| `/api/pathway` | `pathway.py` | Learning pathway engine |
| `/api/notifications` | `notifications.py` | Push/in-app notifications |
| `/api/gamification` | `gamification.py` | Badges, streaks, XP |
| `/api/fsrs` | `fsrs.py` | Spaced repetition scheduler |
| `/api/ai-tools` | `ai_tools.py` | Auxiliary AI tools |
| `/api/exam-mode` | `exam_mode.py` | Exam mode activation |
| `/api/progress` | `progress.py` | Student progress tracking |
| `/api/study-groups` | `study_groups.py` | Study group management |
| `/api/wellbeing` | `wellbeing.py` | Wellbeing check-ins |
| `/api/monitoring` | `ai_governance.py` | AI audit and governance |
| `/ws` | `realtime.py` | WebSocket real-time channel |

---

## 🔧 Infrastructure

| Path | Description |
|---|---|
| `GET /health` | Simple health check (no auth) |
| `GET /` | API version root |
| `GET /metrics` | Prometheus metrics |

---

*→ [[FULL_PROJECT_CATALOG]] | [[SYSTEM_ARCHITECTURE]] | [[START_HERE]]*
