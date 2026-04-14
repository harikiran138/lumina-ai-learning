# Student Experience: API Reference

The Student API manages the interaction loop between the learner, the curriculum, and the AI tutor.

## 📖 Endpoints

### 1. Enrollment & Courses
- `GET /student/courses`: Lists all enrolled courses with progress percentages.
- `POST /student/enroll`: Enrolls a student in a new course/batch.
- `GET /student/courses/{course_id}/lessons`: Fetches the curriculum tree for a specific course.

### 2. Personalized Learning (AI)
- `POST /student/tutor/chat`: sends a message to the AI tutor. Returns context-aware response.
- `GET /student/notes`: Retrieves AI-summarized notes for recently viewed lessons.
- `POST /student/activity`: Logs a learning event (e.g., "Lesson Viewed", "Quiz Started").

### 3. Assessment & Grading
- `POST /student/quizzes/{quiz_id}/submit`: Processes quiz answers and returns immediate feedback.
- `GET /student/results`: Aggregated view of historical performance.
- `GET /student/analytics/focus`: Retrieves periodic AI analysis of study patterns.

### 4. Direct Support
- `GET /student/parent-link`: Generates the unique code for a parent to link their account.
- `POST /student/counselor/request`: Flags a need for human intervention based on performance trends.

## 📦 Key Query Parameters
- `include_progress`: (bool) Enrichment for course listings.
- `semester_id`: Filter for academic history.

---
[[Student/Overview]] | [[Student/Backend]] | [[Student/Frontend]] | [[Student/Flow]]
