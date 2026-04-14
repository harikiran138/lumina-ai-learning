# Student Role — Login, Sidebar & Feature Connections

## 1. Login

### How to Log In
Navigate to `/login`. Use the **Sign In** tab.

| Field | Value |
|-------|-------|
| Email | your registered email |
| Password | your password |

**Demo account (development only):**
```
Email:    student@lumina.com
Password: student123
```

Quick-login button on the login page selects these credentials automatically.

### Sign Up (New Student)
1. Click **Sign Up** tab on `/login`
2. Select **Student** role
3. Enter Full Name, Email, Password
4. Submit → auto-login → redirect to `/student/dashboard`

### What Happens on Login
```
POST /api/auth/token  →  JWT token (8-day expiry)
GET  /api/auth/me     →  User profile (id, email, name, role)
sessionStorage.setItem("lumina_token", token)
sessionStorage.setItem("lumina_user", JSON.stringify(user))
Redirect → /student/dashboard
```

---

## 2. Sidebar Navigation

All student pages live under `/student/` and share a collapsible sidebar.

| Menu Item | Route | Purpose |
|-----------|-------|---------|
| Dashboard | `/student/dashboard` | Stats, enrolled courses, charts |
| Assignments | `/student/assignments` | View & submit assignments |
| AI Tutor | `/student/ai_tutor` | Chat with Lumina AI |
| Assessment | `/student/assessment` | Adaptive quizzes |
| My Courses | `/student/courses` | Browse & enroll in courses |
| My Notes | `/student/my_notes` | Personal notes with autosave |
| Community | `/student/community` | Chat channels & DMs |
| Progress | `/student/progress` | Streak, XP, mastery tracking |
| Profile | `/student/profile` | Edit profile, badges, certs |
| Settings | `/student/settings` | Preferences |

The sidebar collapses to icon-only on small screens and expands on hover/toggle (desktop).

---

## 3. Page-by-Page Feature Map

### `/student/dashboard`
**Backend:** `GET /api/student/dashboard`
**Returns:**
```json
{
  "currentStreak": 5,
  "enrolledCourses": [...],
  "overallMastery": 72,
  "totalHours": 14,
  "badges": [...]
}
```
**UI:** Line chart (progress over time), Pie chart (mastery by topic), stat cards for streak/mastery/hours/courses.

---

### `/student/ai_tutor`
**Backend:** `POST /api/tutor/chat`
**Request:**
```json
{
  "message": "Explain Newton's First Law",
  "user_id": "<logged-in user id>",
  "session_id": "<session uuid>",
  "context_filters": { "context": "<user profile context>" }
}
```
**Response:**
```json
{
  "response": "Newton's First Law states...",
  "context_used": [...],
  "personalization": { "behavior": "neutral", "recommendation": "practice_current_topic" }
}
```
**3-tier routing (fastest first):**
1. Local IndexedDB cache → instant
2. Rule-based matcher (greetings, basic Q&A) → instant
3. Backend RAG + LLM → cloud API

---

### `/student/assessment`
**Backend:** Assessment API at `/api/assessment/`
**Flow:**
```
POST /api/assessment/start       → creates session
GET  /api/assessment/next-question/{session_id}  → next question
POST /api/assessment/submit      → submit answer
GET  /api/assessment/report/{session_id}         → final report
```
**Adaptive engine:** adjusts question difficulty (0.0–1.0) based on answers.

---

### `/student/courses`
**Backend:** `GET /api/courses/list`
**Enroll:** `POST /api/student/enroll` `{ course_id }`
**Complete lesson:** `POST /api/student/complete-lesson` `{ course_id, lesson_id }`

---

### `/student/assignments`
**Backend:**
```
GET  /api/assignments/list                              → list assignments
POST /api/assignments/submit  (multipart form)          → submit file
GET  /api/assignments/{id}/submissions/{sid}/report     → graded report
```

---

### `/student/my_notes`
**Backend:**
```
GET  /api/student/profile   → returns notes[]
POST /api/student/note      → { content } saves a note
```

---

### `/student/community`
**Backend:**
```
GET  /api/community/data?channel_id=general  → { channels[], messages[] }
POST /api/community/send                     → { channel_id, content }
```
Caches channel data in `localStorage` for instant display on re-visit.

---

### `/student/progress`
**Backend:** `GET /api/student/dashboard` (reuses enrolledCourses data)
**Displays:** streak, XP, mastery per course, recent activity.

---

### `/student/profile`
**Backend:**
```
GET  /api/student/profile        → stats, notes, user_info
POST /api/student/profile/update → { ...profile data }
GET  /api/student/badges         → Badge[]
GET  /api/student/certificates   → Certificate[]
```

---

### `/student/lesson_page`
**Route params:** `?courseId=<id>&lessonId=<id>`
**Backend:** `GET /api/courses/{courseId}` → finds lesson in modules
**Actions:**
- Displays lesson content
- "Mark as Complete" → `POST /api/student/complete-lesson`
- "Ask AI Tutor" → navigates to `/student/ai_tutor`

---

## 4. Data Flow Diagram

```
Browser (sessionStorage: token + user)
    │
    ├── GET /api/student/dashboard  ──► AnalyticsStore ──► Supabase (progress, assessment_sessions)
    ├── POST /api/tutor/chat        ──► RAG + Pathway + GuardianAgent + LLM
    ├── GET /api/courses/list       ──► CourseStore ──► Supabase (courses)
    ├── POST /api/student/enroll    ──► StudentStore ──► Supabase (progress)
    ├── POST /api/assessment/start  ──► AssessmentEngine ──► Supabase (assessment_sessions)
    ├── GET /api/community/data     ──► CommunityStore ──► Supabase (community_messages)
    └── GET /api/student/profile    ──► UserDataStore ──► Supabase (users, user_data)
```
