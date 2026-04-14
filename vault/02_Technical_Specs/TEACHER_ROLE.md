# Teacher Role — Login, Sidebar & Feature Connections

## 1. Login

### How to Log In
Navigate to `/login`. Use the **Sign In** tab.

| Field | Value |
|-------|-------|
| Email | your registered email |
| Password | your password |

**Demo account (development only):**
```
Email:    teacher@lumina.com
Password: teacher123
```

### Sign Up (New Teacher)
1. Click **Sign Up** tab on `/login`
2. Select **Teacher** role
3. Enter Full Name, Email, Password
4. Submit → auto-login → redirect to `/teacher/dashboard`

### What Happens on Login
```
POST /api/auth/token  →  JWT token (8-day expiry)
GET  /api/auth/me     →  User profile (id, email, name, role: "teacher")
sessionStorage.setItem("lumina_token", token)
sessionStorage.setItem("lumina_user", JSON.stringify(user))
Redirect → /teacher/dashboard
```

---

## 2. Sidebar Navigation

All teacher pages live under `/teacher/` and share a fixed sidebar (width: 64).

| Menu Item | Route | Purpose |
|-----------|-------|---------|
| Dashboard | `/teacher/dashboard` | Student counts, mastery stats, pending grading |
| My Courses | `/teacher/courses` | View & manage your courses |
| Create Assignment | `/teacher/assignments/create` | Create new assignment for a course |
| AI Course Creator | `/teacher/ai-generator` | Upload PDF → AI generates course |
| Students | `/teacher/students` | View enrolled students |
| Resources | `/teacher/resources` | Teaching materials |
| Settings | `/teacher/settings` | Account preferences |

---

## 3. Page-by-Page Feature Map

### `/teacher/dashboard`
**Backend:** `GET /api/courses/teacher/dashboard`
**Returns:**
```json
{
  "avg_mastery": 68.5,
  "total_students": 24,
  "total_sessions": 48,
  "courseCount": 3,
  "courses": [...]
}
```
Also fetches: `GET /api/assignments/list` for pending grading count.

**UI:** Stat cards for Students / Active Courses / Avg Mastery / Pending Grading.

---

### `/teacher/courses`
**Backend:**
```
GET  /api/courses/teacher/list        → your courses
GET  /api/courses/{courseId}          → course details (modules, lessons)
PATCH /api/courses/{courseId}         → update title/description
DELETE /api/courses/{courseId}        → delete course
POST /api/courses/{courseId}/publish  → publish course
```

---

### `/teacher/create-course`
**Backend:** `POST /api/courses/` (JSON body)
```json
{
  "name": "Course Title",
  "code": "cs201",
  "description": "About this course"
}
```
Redirects to course detail page after creation.

---

### `/teacher/ai-generator`
**Flow:**
1. Upload a PDF file (lecture notes, textbook chapter)
2. Frontend extracts text via `extractTextFromPDF()`
3. Sends to backend to generate structured course modules
4. Teacher reviews the AI-generated outline
5. Saves as a new course

**Backend:** `POST /api/courses/` with AI-generated structure.

---

### `/teacher/assignments`
**Backend:** `GET /api/assignments/list`
Lists all assignments for courses the teacher owns.

---

### `/teacher/assignments/create`
**Backend:** `POST /api/assignments/create` (multipart form)
```
title, course_id, description, due_date
```
Only teachers can create assignments.

---

### `/teacher/assignments/{id}/submissions`
**Backend:**
```
GET /api/assignments/{id}/submissions
    → list of student submissions with status, file, grade

POST /api/assignments/{id}/submissions/{sid}/grade
    → triggers async AI grading (OCR + LLM)
    → returns { task_id }

GET /api/assignments/{id}/analytics
    → { submission_count, graded_count, avg_grade, min_grade, max_grade }
```

---

### `/teacher/grading`
**Backend:** `GET /api/assignments/list` + submission counts.
Shows pending vs. graded submissions, allows manual score override.

---

### `/teacher/students`
**Backend:** `GET /api/courses/teacher/students`
Returns list of students enrolled in this teacher's courses with progress data.

---

## 4. Course & Module Management

```
Create Course
  POST /api/courses/

Add Module to Course
  POST /api/courses/{courseId}/modules
  Body: { title, description }

Add Lesson to Module
  POST /api/courses/{courseId}/modules/{moduleId}/lessons
  Body: { title, content, type: "text"|"video"|"quiz" }

Update All Modules (bulk)
  PUT /api/courses/{courseId}/modules
  Body: { modules: [...] }

Delete Module
  DELETE /api/courses/{courseId}/modules/{moduleId}

Delete Lesson
  DELETE /api/courses/{courseId}/modules/{moduleId}/lessons/{lessonId}
```

---

## 5. Grading Flow (Async)

```
Student submits file
  POST /api/assignments/submit  (multipart)
      │
      └── File saved to storage (S3 or local /uploads)
          Submission record created in Supabase

Teacher clicks "Grade"
  POST /api/assignments/{id}/submissions/{sid}/grade
      │
      └── Celery task dispatched (task_grade_submission)
          │
          ├── Download file from storage
          ├── OCR → extract text (ocr_service)
          ├── Grade → LLM evaluates against rubric (grader_service)
          └── Update submission: { score, feedback, ocr_text, status: "graded" }

Teacher views report
  GET /api/assignments/{id}/submissions/{sid}/report
```

---

## 6. Data Flow Diagram

```
Browser (sessionStorage: token + user)
    │
    ├── GET /api/courses/teacher/dashboard  ──► AnalyticsStore ──► Supabase (assessment_sessions)
    ├── GET /api/courses/teacher/list       ──► CourseStore ──► Supabase (courses)
    ├── GET /api/courses/teacher/students   ──► CourseStore + Supabase (progress, users)
    ├── POST /api/courses/                  ──► CourseStore ──► Supabase (courses)
    ├── POST /api/assignments/create        ──► AssignmentStore ──► Supabase (assignments)
    ├── GET /api/assignments/list           ──► AssignmentStore ──► Supabase (assignments, submissions)
    └── POST /api/assignments/{id}/submissions/{sid}/grade
            └──► Celery Worker ──► OCR ──► LLM Grader ──► Supabase (submissions)
```
