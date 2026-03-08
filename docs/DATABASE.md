# Database — Schema, Tables & Connections

## Overview

**Database:** Supabase (PostgreSQL)
**URL:** Configured via `SUPABASE_URL` environment variable
**Client:** `supabase-py` (Python SDK, sync REST client)
**Manager:** `backend/app/database/supabase_manager.py` — singleton pattern

```python
from app.database.supabase_manager import supabase_db
client = supabase_db.get_client()
```

All stores use `supabase_db.client.table("<table_name>")` to query.

---

## Environment Variables Required

```env
SUPABASE_URL=https://<project-id>.supabase.co
SUPABASE_ANON_KEY=<anon-jwt-key>
SUPABASE_SERVICE_KEY=<service-role-key>   # for admin ops
SECRET_KEY=<random-secret>                # for JWT signing
GEMINI_API_KEY=<your-key>                 # for AI features
CELERY_BROKER_URL=redis://redis:6379/0
CELERY_RESULT_BACKEND=redis://redis:6379/0
```

---

## Tables

### `users`
Primary user accounts table.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | auto-generated |
| `email` | text (unique) | login identifier |
| `password_hash` | text | bcrypt hashed |
| `name` | text | display name |
| `role` | text | `student`, `teacher`, `admin` |
| `phone` | text | optional, defaults to `N/A` |
| `status` | text | `active`, `suspended`, `inactive` |
| `is_active` | bool | true by default |
| `profile_image` | text | avatar URL |
| `badges` | jsonb | `[{ id, name, icon, earned_at }]` |
| `created_at` | timestamptz | auto |
| `last_login` | timestamptz | updated on each login |

**Used by:** UserStore, auth router, admin router

---

### `courses`
Course definitions created by teachers.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | auto-generated |
| `name` | text | course title |
| `code` | text (unique) | e.g. `cs101` |
| `description` | text | |
| `teacher_id` | text | references users.id |
| `modules` | jsonb | `[{ id, title, description, lessons: [{ id, title, content, type }] }]` |
| `is_published` | bool | false by default |
| `thumbnail` | text | image URL |
| `created_at` | timestamptz | auto |

**Used by:** CourseStore, courses router

**Default seeded courses** (created if table is empty):
- `math101` — Introduction to Calculus
- `phy101` — Mechanics
- `cs101` — Intro to Programming
- `ai202` — Neural Networks

---

### `progress`
Student enrollment and progress per course.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | |
| `userId` | text | references users.id |
| `courseId` | text | references courses.id |
| `progress` | int | 0–100 percent |
| `mastery` | float | 0.0–1.0 |
| `streak` | int | days in a row |
| `completedLessons` | jsonb | `[lesson_id, ...]` |
| `lastAccessed` | timestamptz | |
| `hoursSpent` | float | |
| `enrolledAt` | timestamptz | |

**Unique constraint:** `(userId, courseId)`
**Used by:** StudentStore, AnalyticsStore

---

### `assessment_sessions`
Adaptive assessment state per student per topic.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | |
| `student_id` | text | references users.id |
| `topic` | text | subject being assessed |
| `current_difficulty` | float | 0.0–1.0, adjusts per answer |
| `responses` | jsonb | `[{ question_id, selected, correct, time_taken }]` |
| `mastery_state` | jsonb | `{ concept: mastery_score }` |
| `status` | text | `active`, `completed` |
| `timestamp` | timestamptz | session start time |
| `num_questions` | int | target number of questions |

**Used by:** Assessment engine, AnalyticsStore, assessment router

---

### `assignments`
Assignment definitions per course.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | |
| `title` | text | |
| `course_id` | text | references courses.id |
| `description` | text | assignment instructions |
| `due_date` | timestamptz | |
| `created_by` | text | teacher's user id |
| `created_at` | timestamptz | |

**Used by:** AssignmentStore, assignments router

---

### `submissions`
Student file submissions for assignments.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | |
| `assignment_id` | text | references assignments.id |
| `student_id` | text | references users.id |
| `file_path` | text | storage path |
| `status` | text | `pending`, `grading`, `graded` |
| `score` | float | AI or manual grade |
| `feedback` | text | LLM-generated feedback |
| `ocr_text` | text | extracted text from file |
| `submitted_at` | timestamptz | |

**Used by:** AssignmentStore, Celery grading worker

---

### `community_messages`
Chat messages in community channels.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | |
| `channel_id` | text | e.g. `general`, `math`, `ai` |
| `student_id` | text | sender's user id |
| `student_name` | text | sender's display name |
| `avatar` | text | sender's avatar URL |
| `content` | text | message body |
| `timestamp` | timestamptz | |

**Used by:** CommunityStore, community router

---

### `user_data`
Stores per-user quiz history, notes, and analytics events.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | |
| `user_id` | text (unique) | references users.id |
| `quiz_attempts` | jsonb | `[{ topic, score, total, correct, difficulty, timestamp }]` |
| `notes` | jsonb | `[{ id, content, createdAt }]` |
| `analytics_events` | jsonb | `[{ type, metadata, timestamp }]` |
| `updated_at` | timestamptz | |

**Used by:** UserDataStore, student router

---

### `ai_logs`
AI tutor interaction logs (admin viewable).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | |
| `user_id` | text | |
| `session_id` | text | |
| `message` | text | user's input |
| `response` | text | AI response |
| `provider` | text | `gemini`, `ollama`, etc. |
| `context_used` | jsonb | RAG context chunks |
| `timestamp` | timestamptz | |

**Used by:** AI router, admin router (`/api/admin/logs/ai`)

---

### `conversations`
Full conversation history per user/agent pair.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | |
| `user_id` | text | |
| `agent_id` | text | e.g. `tutor`, `pathway`, `guardian` |
| `messages` | jsonb | `[{ role, content, timestamp }]` |
| `summary` | text | condensed conversation summary |
| `created_at` | timestamptz | |
| `last_updated` | timestamptz | |

**Used by:** AgentStore, admin chat logs

---

### `certificates`
Certificates earned by students.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid (PK) | |
| `userId` | text | references users.id |
| `courseId` | text | course completed |
| `courseName` | text | |
| `issueDate` | timestamptz | |
| `grade` | text | `A`, `B`, `C`, etc. |

**Used by:** StudentStore, student router

---

## Store → Table Mapping

| Store | Supabase Tables Used |
|-------|---------------------|
| `UserStore` | `users` |
| `CourseStore` | `courses` |
| `StudentStore` | `progress`, `users`, `certificates` |
| `AssignmentStore` | `assignments`, `submissions` |
| `UserDataStore` | `user_data` |
| `CommunityStore` | `community_messages` |
| `AnalyticsStore` | `assessment_sessions`, `user_data`, `progress` |
| `AgentStore` | `conversations` |
| Admin Router | `users`, `courses`, `ai_logs`, `conversations`, `assessment_sessions` |

---

## Connection Flow

```
FastAPI App Start
    │
    └── DatabaseManager.connect()
            │
            └── supabase_db.get_client()
                    │
                    └── Creates Supabase client using SUPABASE_URL + SUPABASE_ANON_KEY
                        Returns singleton client for all stores

Each Request:
    Store.__init__()
        │
        └── self.client = supabase_db.get_client()
                │
                └── self.client.table("table_name").select/insert/update/delete...
```

---

## Required Supabase Table Setup (SQL)

Run these in the Supabase SQL editor to create all tables:

```sql
-- Users
CREATE TABLE users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  name text NOT NULL,
  role text NOT NULL DEFAULT 'student',
  phone text DEFAULT 'N/A',
  status text DEFAULT 'active',
  is_active bool DEFAULT true,
  profile_image text,
  badges jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  last_login timestamptz
);

-- Courses
CREATE TABLE courses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text UNIQUE NOT NULL,
  description text,
  teacher_id text,
  modules jsonb DEFAULT '[]',
  is_published bool DEFAULT false,
  thumbnail text,
  created_at timestamptz DEFAULT now()
);

-- Student Progress
CREATE TABLE progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" text NOT NULL,
  "courseId" text NOT NULL,
  progress int DEFAULT 0,
  mastery float DEFAULT 0,
  streak int DEFAULT 0,
  "completedLessons" jsonb DEFAULT '[]',
  "lastAccessed" timestamptz,
  "hoursSpent" float DEFAULT 0,
  "enrolledAt" timestamptz DEFAULT now(),
  UNIQUE ("userId", "courseId")
);

-- Assessment Sessions
CREATE TABLE assessment_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id text NOT NULL,
  topic text NOT NULL,
  current_difficulty float DEFAULT 0.5,
  responses jsonb DEFAULT '[]',
  mastery_state jsonb DEFAULT '{}',
  status text DEFAULT 'active',
  num_questions int DEFAULT 10,
  timestamp timestamptz DEFAULT now()
);

-- Assignments
CREATE TABLE assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  course_id text,
  description text,
  due_date timestamptz,
  created_by text,
  created_at timestamptz DEFAULT now()
);

-- Submissions
CREATE TABLE submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id text NOT NULL,
  student_id text NOT NULL,
  file_path text,
  status text DEFAULT 'pending',
  score float,
  feedback text,
  ocr_text text,
  submitted_at timestamptz DEFAULT now()
);

-- Community Messages
CREATE TABLE community_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id text NOT NULL DEFAULT 'general',
  student_id text,
  student_name text,
  avatar text,
  content text NOT NULL,
  timestamp timestamptz DEFAULT now()
);

-- User Data (notes, quiz history)
CREATE TABLE user_data (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text UNIQUE NOT NULL,
  quiz_attempts jsonb DEFAULT '[]',
  notes jsonb DEFAULT '[]',
  analytics_events jsonb DEFAULT '[]',
  updated_at timestamptz DEFAULT now()
);

-- AI Logs
CREATE TABLE ai_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  session_id text,
  message text,
  response text,
  provider text,
  context_used jsonb DEFAULT '[]',
  timestamp timestamptz DEFAULT now()
);

-- Conversations
CREATE TABLE conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text,
  agent_id text DEFAULT 'tutor',
  messages jsonb DEFAULT '[]',
  summary text,
  created_at timestamptz DEFAULT now(),
  last_updated timestamptz DEFAULT now()
);

-- Certificates
CREATE TABLE certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  "userId" text NOT NULL,
  "courseId" text,
  "courseName" text,
  "issueDate" timestamptz DEFAULT now(),
  grade text
);
```
