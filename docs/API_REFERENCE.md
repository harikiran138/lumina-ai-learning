# API Reference — All Endpoints

**Base URL:** `http://localhost:8000` (dev) / set via `NEXT_PUBLIC_API_URL`
**Auth Header:** `Authorization: Bearer <token>`
**Content-Type:** `application/json` (unless noted as multipart)

---

## Authentication `/api/auth`

### `POST /api/auth/register`
Register a new user.
```json
// Request
{ "email": "user@example.com", "password": "Password1!", "full_name": "Jane Doe", "role": "student" }

// Response 200
{ "id": "uuid", "email": "...", "full_name": "...", "role": "student", "created_at": "..." }

// Error 400
{ "detail": "Email already registered" }
```

### `POST /api/auth/token`
Login — returns JWT. Uses `application/x-www-form-urlencoded`.
```
username=user@example.com&password=Password1!
```
```json
// Response 200
{ "access_token": "eyJ...", "token_type": "bearer" }

// Error 401
{ "detail": "Incorrect email or password" }
```

### `GET /api/auth/me`
Get authenticated user's profile. **Auth required.**
```json
// Response 200
{ "id": "uuid", "email": "...", "full_name": "...", "role": "student", "created_at": "..." }
```

---

## Student `/api/student`
All endpoints require authentication.

### `GET /api/student/dashboard`
```json
// Response 200
{
  "currentStreak": 5,
  "enrolledCourses": [{ "id": "...", "name": "...", "progress": 60, "mastery": 0.7 }],
  "overallMastery": 72,
  "totalHours": 14,
  "badges": [...]
}
```

### `GET /api/student/profile`
```json
// Response 200
{
  "stats": { "avg_score": 75, "total_sessions": 10 },
  "dashboard_stats": { ... },
  "notes": [{ "id": "...", "content": "...", "createdAt": "..." }],
  "user_info": { "name": "...", "email": "..." }
}
```

### `POST /api/student/enroll`
```json
// Request
{ "course_id": "uuid" }
// Response 200
{ "success": true, "message": "Enrolled successfully" }
```

### `POST /api/student/complete-lesson`
```json
// Request
{ "course_id": "uuid", "lesson_id": "uuid" }
// Response 200
{ "success": true, "lesson_id": "uuid" }
```

### `GET /api/student/badges`
```json
// Response 200
[{ "id": "...", "name": "First Step", "icon": "🏅", "earned_at": "..." }]
```

### `GET /api/student/certificates`
```json
// Response 200
[{ "id": "...", "courseName": "Calculus", "issueDate": "...", "grade": "A" }]
```

### `POST /api/student/note`
```json
// Request
{ "content": "My note text here" }
// Response 200
{ "success": true }
```

### `POST /api/student/quiz-result`
```json
// Request
{ "topic": "Calculus", "score": 80, "total_questions": 10, "correct_count": 8, "difficulty": "medium" }
// Response 200
{ "success": true }
```

### `POST /api/student/profile/update`
```json
// Request — any profile fields to update
{ "bio": "...", "location": "..." }
// Response 200
{ "success": true }
```

---

## Courses `/api/courses`

### `GET /api/courses/` or `GET /api/courses/list`
List all courses. No auth required.
```json
// Response 200
[{ "id": "...", "name": "Calculus", "code": "math101", "description": "...", "modules": [] }]
```

### `GET /api/courses/{courseId}`
Get single course. No auth required.
```json
// Response 200
{ "id": "...", "name": "...", "modules": [{ "id": "...", "title": "...", "lessons": [...] }] }
// Error 404
{ "detail": "Course not found" }
```

### `POST /api/courses/` — Create (Teacher/Admin)
```json
// Request
{ "name": "Course Title", "code": "cs201", "description": "About this course" }
// Response 200
{ "id": "...", "name": "...", "code": "...", "created_at": "..." }
```

### `PATCH /api/courses/{courseId}` — Update
```json
// Request (all optional)
{ "name": "New Name", "description": "New desc", "is_published": true }
// Response 200
{ "success": true }
```

### `DELETE /api/courses/{courseId}` — Teacher/Admin
```json
// Response 200
{ "success": true }
```

### `POST /api/courses/{courseId}/publish`
```json
// Response 200
{ "success": true, "message": "Course published" }
```

### `POST /api/courses/{courseId}/modules`
```json
// Request
{ "title": "Module 1: Intro", "description": "Overview" }
// Response 200
{ "success": true, "module": { "id": "uuid", "title": "...", "lessons": [] } }
```

### `PUT /api/courses/{courseId}/modules`
Replace all modules (bulk update).
```json
// Request
{ "modules": [{ "id": "uuid", "title": "...", "lessons": [...] }] }
// Response 200
{ "success": true }
```

### `POST /api/courses/{courseId}/modules/{moduleId}/lessons`
```json
// Request
{ "title": "Lesson 1", "content": "Lesson text here", "type": "text" }
// Response 200
{ "success": true, "lesson": { "id": "uuid", "title": "...", "content": "...", "type": "text" } }
```

### `DELETE /api/courses/{courseId}/modules/{moduleId}`
```json
// Response 200
{ "success": true }
```

### `DELETE /api/courses/{courseId}/modules/{moduleId}/lessons/{lessonId}`
```json
// Response 200
{ "success": true }
```

### `GET /api/courses/teacher/dashboard` — Teacher/Admin
```json
// Response 200
{ "avg_mastery": 68.5, "total_students": 24, "total_sessions": 48, "courseCount": 3, "courses": [...] }
```

### `GET /api/courses/teacher/list` — Teacher/Admin
```json
// Response 200
[{ "id": "...", "name": "...", "code": "..." }]
```

### `GET /api/courses/teacher/students` — Teacher/Admin
```json
// Response 200
[{ "id": "...", "name": "...", "email": "...", "role": "student" }]
```

---

## AI Tutor `/api` (ai.py router)

### `POST /api/tutor/chat`
```json
// Request
{
  "message": "Explain photosynthesis",
  "user_id": "uuid or 'guest'",
  "session_id": "uuid",
  "provider": "auto",
  "context_filters": { "context": "user profile string" }
}
// Response 200
{
  "response": "Photosynthesis is...",
  "context_used": ["chunk1", "chunk2"],
  "personalization": { "behavior": "neutral", "recommendation": "practice_current_topic" }
}
```

### `POST /api/ai/generate-course`
```json
// Request
{ "topic": "Machine Learning", "level": "Beginner", "modules": 4 }
// Response 200
{ "title": "...", "description": "...", "outline": [{ "module": "...", "topics": [...] }] }
```

### `POST /api/tutor/ingest`
Ingest knowledge into RAG.
```json
// Request
{ "text": "Long text to ingest...", "metadata": { "source": "textbook", "topic": "physics" } }
// Response 200
{ "status": "success", "chunks_added": 12 }
```

### `POST /api/tutor/generate-ppt`
```json
// Request
{ "topic": "Quantum Physics", "num_slides": 10 }
// Response 200
{ "message": "Generated", "download_url": "/api/tutor/download-ppt/file.pptx", "slide_count": 10 }
```

### `GET /api/tutor/download-ppt/{filename}`
Downloads the generated PPT file.

---

## Assessment `/api/assessment`

### `POST /api/assessment/start`
```json
// Request
{ "student_id": "uuid", "topic": "Calculus", "num_questions": 10 }
// Response 200
{ "id": "session-uuid", "student_id": "...", "topic": "...", "current_difficulty": 0.5, "status": "active" }
```

### `GET /api/assessment/next-question/{session_id}`
```json
// Response 200 — next question
{
  "id": "q-uuid",
  "text": "What is the derivative of x²?",
  "options": ["2x", "x²", "x", "2"],
  "difficulty": 0.5
}
// Response 200 — session complete
null
```

### `POST /api/assessment/submit`
```json
// Request
{ "session_id": "uuid", "question_id": "uuid", "selected_option_id": 0, "time_taken": 12 }
// Response 200 — updated session
{ "id": "...", "current_difficulty": 0.6, ... }
```

### `GET /api/assessment/result/{session_id}`
```json
// Response 200
{ "session_id": "...", "total_questions": 10, "correct_answers": 8, "final_ability_estimate": 0.75 }
```

### `GET /api/assessment/report/{session_id}`
```json
// Response 200
{
  "session_id": "...",
  "total_questions": 10,
  "correct_answers": 8,
  "accuracy": 0.8,
  "final_ability_estimate": 0.75,
  "level": "strong",
  "summary": "8/10 correct. Strong performance."
}
```

### `GET /api/assessment/student/{student_id}/mastery`
```json
// Response 200
{ "Calculus": 0.75, "Physics": 0.60, "Python": 0.85 }
```

### `POST /api/assessment/quick-log`
```json
// Request
{ "user_id": "uuid", "topic": "Calculus", "is_correct": true, "difficulty": 0.6 }
// Response 200
{ "status": "logged", "new_mastery": 0.78 }
```

---

## Assignments `/api/assignments`

### `POST /api/assignments/create` — Teacher only. Multipart form.
```
title=Homework1&course_id=uuid&description=Write an essay&due_date=2025-12-01
```
```json
// Response 200
{ "id": "uuid", "title": "...", "course_id": "...", "created_at": "..." }
```

### `POST /api/assignments/submit` — Multipart form.
```
assignment_id=uuid&file=<file>
```
```json
// Response 200
{ "submission_id": "uuid", "status": "pending" }
```

### `GET /api/assignments/list`
```
Params: course_id (optional), student_id (optional)
```
```json
// Response 200
[{ "id": "...", "title": "...", "due_date": "...", "submission_count": 5 }]
```

### `GET /api/assignments/{id}/submissions`
```json
// Response 200
[{ "id": "...", "student_id": "...", "status": "graded", "score": 88 }]
```

### `POST /api/assignments/{id}/submissions/{sid}/grade`
Triggers async grading.
```json
// Response 202
{ "status": "accepted", "task_id": "celery-task-id" }
```

### `GET /api/assignments/{id}/submissions/{sid}/report`
```json
// Response 200
{
  "assignment": { "id": "...", "title": "...", "description": "..." },
  "submission": { "id": "...", "student_id": "...", "submitted_at": "..." },
  "score": 88,
  "level": "strong",
  "feedback": "Excellent analysis...",
  "ocr_text": "Extracted text from uploaded file..."
}
```

### `GET /api/assignments/{id}/analytics`
```json
// Response 200
{ "submission_count": 20, "graded_count": 18, "avg_grade": 76.5, "min_grade": 45, "max_grade": 98 }
```

---

## Community `/api/community`

### `GET /api/community/data`
```
Params: channel_id=general (default)
```
```json
// Response 200
{
  "channels": [{ "id": "general", "name": "General" }, { "id": "math", "name": "Math Help" }],
  "messages": [{ "id": "...", "student_name": "Jane", "content": "Hello!", "timestamp": "..." }]
}
```

### `POST /api/community/send` — Auth required.
```json
// Request
{ "channel_id": "general", "content": "Hello everyone!" }
// Response 200
{ "success": true, "message_id": "uuid" }
```

---

## Admin `/api/admin`
All endpoints require `role: "admin"` in JWT.

### `GET /api/admin/dashboard`
```json
{ "totalUsers": 120, "totalCourses": 18, "activeUsers": 120, "systemStatus": "healthy" }
```

### `GET /api/admin/users`
```json
[{ "id": "...", "email": "...", "name": "...", "role": "student", "status": "active" }]
```

### `DELETE /api/admin/users/{userId}`
```json
{ "success": true }
// Error 404 if not found
```

### `POST /api/admin/users/{userId}/status?status=active|suspended|inactive`
```json
{ "success": true }
```

### `POST /api/admin/users/{userId}/role?role=student|teacher|admin`
```json
{ "success": true }
// Error 400 for invalid role
```

### `GET /api/admin/courses`
```json
[{ "id": "...", "name": "...", "code": "...", "teacher_id": "..." }]
```

### `GET /api/admin/logs/ai`
```json
[{ "id": "...", "user_id": "...", "message": "...", "response": "...", "timestamp": "..." }]
```

### `DELETE /api/admin/logs/ai/{logId}`
```json
{ "success": true }
```

### `GET /api/admin/logs/chat`
```json
[{ "id": "...", "user_id": "...", "agent_id": "tutor", "last_updated": "..." }]
```

### `GET /api/admin/students-progress`
```json
[{ "student_id": "uuid", "avg_score": 72.5, "total_sessions": 8, "topic_count": 3 }]
```

---

## Handwriting `/api/handwriting`

### `POST /api/handwriting/upload` — Multipart form.
Accepts: JPG, PNG, BMP, WEBP, PDF. Max 10MB.
```
file=<image or pdf>
```
```json
// Response 200
{ "text": "Extracted handwritten text...", "storage_url": "...", "file_id": "..." }
```

### `GET /api/handwriting/health`
```json
{ "status": "ok", "ocr": "ready" }
```

---

## Error Response Format

All errors follow:
```json
{ "detail": "Human readable error message" }
```

Common status codes:
- `200` — Success
- `201` — Created
- `202` — Accepted (async task queued)
- `400` — Bad request / validation error
- `401` — Not authenticated (missing/invalid token)
- `403` — Not authorized (wrong role)
- `404` — Resource not found
- `500` — Internal server error
