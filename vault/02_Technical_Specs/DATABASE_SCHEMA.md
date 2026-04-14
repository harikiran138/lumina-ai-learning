# Lumina AI Learning Management System — Complete Database Schema

**Version:** 2.0
**Last Updated:** March 2026
**Database:** Supabase PostgreSQL 15
**Total Tables:** 35

---

## 1. Overview

Lumina is an AI-powered Learning Management System designed to deliver personalized education experiences at scale. Every student gets their own personal AI that builds a profile of how they learn, where they struggle, and delivers a custom learning pathway.

### Database Architecture

- **Platform:** Supabase (managed PostgreSQL)
- **Connection Method:** supabase_db singleton pattern
- **Authentication:** Supabase Auth (JWT-based)
- **Real-time Features:** PostgreSQL LISTEN/NOTIFY + WebSocket
- **Storage:** JSONB columns for flexible semi-structured data
- **Full-text Search:** PostgreSQL text search with pg_trgm extension

### Core Principles

1. **Row-Level Security (RLS):** Every sensitive table enforces RLS policies so users only see data they're authorized for
2. **JSONB Strategy:** Flexible nested data (badges, modules, messages, memory) stored as JSONB; frequently-queried scalars normalized as columns
3. **Audit Trail:** All modifications tracked via `created_at`, `updated_at`, and AI logs
4. **Soft Deletes:** Most deletes use a `deleted_at` column for compliance and recovery
5. **Foreign Key Integrity:** Strict FK constraints with CASCADE/SET NULL/RESTRICT policies

### Required Environment Variables

```bash
SUPABASE_URL=https://[project-id].supabase.co
SUPABASE_ANON_KEY=eyJ... # anon key for client
SUPABASE_SERVICE_ROLE_KEY=eyJ... # service role for server
DATABASE_URL=postgresql://postgres:[password]@db.[project-id].supabase.co:5432/postgres
```

---

## 2. Entity Relationship Overview

Below is the complete Entity Relationship Diagram showing all 35 tables and their relationships:

```mermaid
erDiagram
  users ||--o{ sessions : has
  users ||--o{ progress : enrolls
  users ||--o{ submissions : submits
  users ||--o{ assignments : creates
  users ||--o{ conversations : initiates
  users ||--o{ ai_logs : generates
  users ||--o{ user_data : owns
  users ||--o{ learner_profiles : has
  users ||--o{ behavior_logs : records
  users ||--o{ quiz_attempts : takes
  users ||--o{ teacher_stats : records
  users ||--o{ student_stats : records
  users ||--o{ tutor_sessions : participates
  users ||--o{ notifications : receives
  users ||--o{ student_pathways : follows
  users ||--o{ attendance : marked
  users ||--o{ study_groups : creates
  users ||--o{ study_groups : joins
  users ||--o{ intervention_logs : involved
  users ||--o{ ppt_generations : requests
  users ||--o{ feedback : provides
  users ||--o{ leaderboard_entries : appears
  users ||--o{ parent_student_links : parentOf
  users ||--o{ parent_student_links : parentAccount

  courses ||--o{ progress : enrolls
  courses ||--o{ assignments : contains
  courses ||--o{ assessment_sessions : has
  courses ||--o{ quizzes : contains
  courses ||--o{ learner_profiles : tracks
  courses ||--o{ student_pathways : defines
  courses ||--o{ attendance : tracks
  courses ||--o{ knowledge_nodes : structures
  courses ||--o{ question_bank : contains
  courses ||--o{ feedback : receives
  courses ||--o{ leaderboard_entries : scores

  progress ||--o{ submissions : tracks
  progress ||--o{ assessment_sessions : generates
  progress ||--o{ skill_mastery : calculates
  progress ||--o{ behavior_logs : reflects

  assignments ||--o{ submissions : has
  assignments ||--o{ question_bank : may_use

  assessment_sessions ||--o{ quiz_attempts : analyzes
  assessment_sessions ||--o{ ai_logs : records
  assessment_sessions ||--o{ skill_mastery : updates

  quizzes ||--o{ quiz_attempts : administered
  quizzes ||--o{ question_bank : draws_from

  conversations ||--o{ ai_logs : references
  conversations ||--o{ agent_memory : informs

  learner_profiles ||--o{ skill_mastery : contains
  learner_profiles ||--o{ behavior_logs : analyzes
  learner_profiles ||--o{ agent_memory : feeds

  agent_memory ||--o{ ai_logs : used_in

  pathway_nodes ||--o{ student_pathways : sequenced
  pathway_nodes ||--o{ knowledge_nodes : represents

  knowledge_nodes ||--o{ skill_mastery : evaluated
  knowledge_nodes ||--o{ question_bank : tests

  study_groups ||--o{ study_group_members : has
  study_groups ||--o{ community_messages : posts

  community_messages ||--o{ notifications : triggers

  certificates ||--o{ progress : awarded

  ppt_generations ||--o{ question_bank : references
```

---

## 3. Complete Table Documentation

### 3.1 users

**Purpose:** Core identity table. Stores all user accounts (students, teachers, admins, parents). Manages authentication, profile info, and permissions.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default: gen_random_uuid() | Unique user identifier |
| email | text | UNIQUE, NOT NULL | Login email; indexed for fast lookup |
| password_hash | text | NOT NULL | bcrypt hash; never returned in API |
| name | text | NOT NULL | Display name |
| role | enum (student \| teacher \| admin \| parent) | NOT NULL, default: 'student' | User type; drives RLS policies |
| avatar_url | text | NULLABLE | Profile picture URL (S3 or Supabase Storage) |
| bio | text | NULLABLE | User bio/introduction |
| badges | jsonb | default: '[]' | Array of earned achievement badges |
| timezone | text | default: 'UTC' | For scheduling notifications |
| preferences | jsonb | default: '{}' | Email, notification, theme preferences |
| is_active | boolean | default: true | For soft deactivation |
| created_at | timestamp | NOT NULL, default: now() | Account creation time |
| updated_at | timestamp | NOT NULL, default: now() | Last profile update |
| deleted_at | timestamp | NULLABLE | Soft delete marker |

**JSONB Schemas:**

```json
badges: [
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "First Quiz",
    "description": "Completed first quiz",
    "icon": "🏆",
    "earned_at": "2026-01-15T10:30:00Z",
    "course_id": "course_id_here"
  }
]

preferences: {
  "email_notifications": true,
  "push_notifications": true,
  "weekly_digest": true,
  "theme": "light",
  "language": "en",
  "study_reminders_enabled": true,
  "study_time_preference": "evening"
}
```

**Relationships:**
- Owns: sessions, progress, submissions, user_data, learner_profiles, behavior_logs, conversations, ai_logs, quiz_attempts, student_stats, teacher_stats, tutor_sessions, notifications, student_pathways, attendance, study_groups, intervention_logs, ppt_generations, feedback, leaderboard_entries
- Can be: parent of another user (parent_student_links)

**Unique Constraints:**
- email (UNIQUE)

**Indexes:**
- idx_users_email (for login)
- idx_users_role (for filtering by user type)
- idx_users_is_active (for soft delete queries)

**Example Row:**
```sql
INSERT INTO users (email, password_hash, name, role, timezone, preferences) VALUES
('alice@school.edu', '$2b$12$...hash...', 'Alice Johnson', 'student', 'America/New_York',
'{"email_notifications": true, "theme": "dark"}');
```

**Common Queries:**
- Get user by email: `SELECT * FROM users WHERE email = 'alice@school.edu';`
- Get all active students: `SELECT * FROM users WHERE role = 'student' AND is_active = true;`
- Find user by ID with delete check: `SELECT * FROM users WHERE id = $1 AND deleted_at IS NULL;`

---

### 3.2 sessions (Authentication Sessions)

**Purpose:** Stores JWT-based session tokens for web/mobile clients. Tracks login history and manages token expiry.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default: gen_random_uuid() | Session identifier |
| user_id | uuid | FK → users(id), NOT NULL | Which user owns this session |
| token | text | NOT NULL | JWT token (hashed for security) |
| device_type | text | NOT NULL (web \| mobile \| api) | Device type |
| ip_address | text | NULLABLE | Client IP for audit |
| user_agent | text | NULLABLE | Browser user-agent string |
| expires_at | timestamp | NOT NULL | Token expiry time |
| is_revoked | boolean | default: false | For logout |
| created_at | timestamp | NOT NULL, default: now() | Session creation |

**Relationships:**
- user_id → users(id)

**Indexes:**
- idx_sessions_user_id (for per-user session lookup)
- idx_sessions_expires_at (for cleanup of expired sessions)
- idx_sessions_is_revoked (for active session checks)

**Example Row:**
```sql
INSERT INTO sessions (user_id, token, device_type, ip_address, expires_at) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'eyJ0eXAiOiJKV1QiLCJhbGc...', 'web', '192.168.1.1',
now() + interval '7 days');
```

**Common Queries:**
- Get active sessions for user: `SELECT * FROM sessions WHERE user_id = $1 AND is_revoked = false AND expires_at > now();`
- Revoke all user sessions: `UPDATE sessions SET is_revoked = true WHERE user_id = $1;`
- Cleanup expired: `DELETE FROM sessions WHERE expires_at < now();`

---

### 3.3 courses

**Purpose:** Course definitions. Contains curriculum structure, metadata, and module/lesson breakdown in JSONB.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default: gen_random_uuid() | Course identifier |
| code | text | UNIQUE, NOT NULL | Course code (e.g., "MATH101") |
| name | text | NOT NULL | Course title |
| description | text | NULLABLE | Long description |
| teacher_id | uuid | FK → users(id), NOT NULL | Course instructor |
| subject | text | NOT NULL | Subject domain (math, science, cs, english) |
| difficulty_level | enum (beginner \| intermediate \| advanced) | default: 'beginner' | Course level |
| modules | jsonb | NOT NULL, default: '[]' | Course structure (see schema below) |
| max_students | integer | NULLABLE | Enrollment cap |
| is_published | boolean | default: false | Only published courses appear in catalog |
| created_at | timestamp | NOT NULL, default: now() | Course creation |
| updated_at | timestamp | NOT NULL, default: now() | Last modification |

**JSONB Schema for modules:**
```json
modules: [
  {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "title": "Calculus Fundamentals",
    "description": "Introduction to limits and derivatives",
    "order": 1,
    "learning_objectives": ["Understand limits", "Compute derivatives"],
    "lessons": [
      {
        "id": "lesson-001",
        "title": "What are Limits?",
        "description": "Introduction to limits",
        "content": "# Limits\n\nA limit is...",
        "type": "text",
        "duration_minutes": 15,
        "order": 1,
        "learning_outcomes": ["Define limits formally"],
        "tags": ["limits", "fundamentals"],
        "difficulty": "beginner"
      },
      {
        "id": "lesson-002",
        "title": "Computing Limits Video",
        "type": "video",
        "content_url": "https://youtu.be/...",
        "duration_minutes": 12,
        "order": 2,
        "transcript": "optional transcript text"
      },
      {
        "id": "lesson-003",
        "title": "Limits Quiz",
        "type": "quiz",
        "order": 3,
        "quiz_id": "quiz-limits-001",
        "passing_score": 70
      }
    ]
  }
]
```

**Relationships:**
- teacher_id → users(id)
- One course has many progress, assignments, assessment_sessions, quizzes, feedback entries

**Unique Constraints:**
- code (UNIQUE)

**Indexes:**
- idx_courses_teacher_id (for teacher's course list)
- idx_courses_subject (for subject filtering)
- idx_courses_is_published (for catalog queries)

**Example Row:**
```sql
INSERT INTO courses (code, name, description, teacher_id, subject, is_published, modules) VALUES
('MATH101', 'Calculus I', 'Introduction to limits, derivatives, and integrals',
'550e8400-e29b-41d4-a716-446655440000', 'math', true, '[{"id":"...", "title":"Calculus Fundamentals", ...}]'::jsonb);
```

**Common Queries:**
- Get published courses: `SELECT * FROM courses WHERE is_published = true ORDER BY name;`
- Get teacher's courses: `SELECT * FROM courses WHERE teacher_id = $1;`
- Get module by lesson: `SELECT modules FROM courses WHERE id = $1;`

---

### 3.4 progress

**Purpose:** Tracks student enrollment and learning progress in each course. Stores mastery, time spent, completed lessons, streak, and last access.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default: gen_random_uuid() | Progress record ID |
| user_id | uuid | FK → users(id), NOT NULL | Student |
| course_id | uuid | FK → courses(id), NOT NULL | Course enrolled in |
| mastery | numeric(3,2) | default: 0.0 | Overall mastery 0.0-1.0 |
| completed_lessons | jsonb | default: '[]' | Array of completed lesson IDs |
| hours_spent | numeric(8,2) | default: 0.0 | Total hours in course |
| current_module_index | integer | default: 0 | Which module student is on |
| current_lesson_index | integer | default: 0 | Which lesson in module |
| daily_streak | integer | default: 0 | Consecutive days accessed |
| last_accessed | timestamp | NULLABLE | Last time student accessed course |
| started_at | timestamp | NOT NULL, default: now() | Enrollment date |
| completed_at | timestamp | NULLABLE | Course completion date |
| created_at | timestamp | NOT NULL, default: now() | Record creation |
| updated_at | timestamp | NOT NULL, default: now() | Last update |

**JSONB Schema for completed_lessons:**
```json
completed_lessons: [
  "lesson-001",
  "lesson-002",
  "lesson-003"
]
```

**Relationships:**
- user_id → users(id) [ON DELETE CASCADE]
- course_id → courses(id) [ON DELETE CASCADE]
- One progress has many submissions, assessment_sessions, skill_mastery

**Unique Constraints:**
- (user_id, course_id) — one enrollment per student per course

**Indexes:**
- idx_progress_user_id (for student's course list)
- idx_progress_course_id (for course roster)
- idx_progress_mastery (for ranking/leaderboard)
- idx_progress_last_accessed (for detecting inactive students)

**Example Row:**
```sql
INSERT INTO progress (user_id, course_id, mastery, hours_spent, daily_streak, completed_lessons) VALUES
('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 0.75, 24.5, 7,
'["lesson-001", "lesson-002", "lesson-003"]'::jsonb);
```

**Common Queries:**
- Get student's courses: `SELECT p.*, c.name FROM progress p JOIN courses c ON p.course_id = c.id WHERE p.user_id = $1;`
- Get course roster: `SELECT u.name, p.mastery, p.hours_spent FROM progress p JOIN users u ON p.user_id = u.id WHERE p.course_id = $1;`
- Get at-risk students: `SELECT * FROM progress WHERE mastery < 0.4 AND last_accessed < now() - interval '7 days';`

---

### 3.5 assessment_sessions

**Purpose:** Records each quiz/test session taken by a student. Stores responses, score, mastery state by topic, and timing data.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default: gen_random_uuid() | Session identifier |
| user_id | uuid | FK → users(id), NOT NULL | Student taking quiz |
| course_id | uuid | FK → courses(id), NOT NULL | Course context |
| quiz_id | uuid | FK → quizzes(id), NOT NULL | Which quiz |
| responses | jsonb | NOT NULL | Array of answers (see schema) |
| mastery_state | jsonb | NOT NULL | Topic mastery percentages |
| score | numeric(5,2) | NOT NULL | Final score (0-100) |
| duration_seconds | integer | NULLABLE | Time spent on assessment |
| completed_at | timestamp | NOT NULL, default: now() | When quiz finished |
| is_graded | boolean | default: false | For AI auto-grading |
| ai_feedback | text | NULLABLE | AI-generated feedback |
| created_at | timestamp | NOT NULL, default: now() | Session creation |

**JSONB Schemas:**

```json
responses: [
  {
    "question_id": "q1",
    "question_text": "What is the derivative of x^2?",
    "selected_answer": 2,
    "correct_answer": 2,
    "is_correct": true,
    "time_taken_seconds": 8.5,
    "difficulty": "easy"
  },
  {
    "question_id": "q2",
    "question_text": "Integrate sin(x)dx",
    "selected_answer": "custom_answer_text",
    "correct_answer": "-cos(x) + C",
    "is_correct": false,
    "time_taken_seconds": 45.2,
    "difficulty": "hard"
  }
]

mastery_state: {
  "derivatives": 0.90,
  "integrals": 0.45,
  "limits": 0.78,
  "continuity": 0.65
}
```

**Relationships:**
- user_id → users(id)
- course_id → courses(id)
- quiz_id → quizzes(id)

**Indexes:**
- idx_assessment_sessions_user_id
- idx_assessment_sessions_course_id
- idx_assessment_sessions_quiz_id
- idx_assessment_sessions_completed_at (for recent assessments)
- idx_assessment_sessions_is_graded (for grading queue)

**Example Row:**
```sql
INSERT INTO assessment_sessions (user_id, course_id, quiz_id, responses, mastery_state, score, duration_seconds) VALUES
('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', '770e8400-e29b-41d4-a716-446655440000',
'[{"question_id": "q1", "selected_answer": 2, "is_correct": true}]'::jsonb,
'{"derivatives": 0.90, "integrals": 0.45}'::jsonb, 85.0, 1200);
```

**Common Queries:**
- Get student's recent assessments: `SELECT * FROM assessment_sessions WHERE user_id = $1 ORDER BY completed_at DESC LIMIT 10;`
- Get ungraded assessments: `SELECT * FROM assessment_sessions WHERE is_graded = false ORDER BY completed_at;`
- Get mastery state: `SELECT mastery_state FROM assessment_sessions WHERE user_id = $1 AND course_id = $2 ORDER BY completed_at DESC LIMIT 1;`

---

### 3.6 assignments

**Purpose:** Homework and assignments created by teachers. Can be graded manually or auto-graded by AI.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default: gen_random_uuid() | Assignment identifier |
| course_id | uuid | FK → courses(id), NOT NULL | Course it belongs to |
| creator_id | uuid | FK → users(id), NOT NULL | Teacher who created it |
| title | text | NOT NULL | Assignment title |
| description | text | NULLABLE | Full description/prompt |
| assignment_type | enum (essay \| code \| math \| mcq \| file_upload) | NOT NULL | Type of work |
| due_date | timestamp | NOT NULL | Deadline |
| points_possible | integer | default: 100 | Max score |
| rubric | jsonb | NULLABLE | Grading rubric |
| is_published | boolean | default: false | Visible to students |
| auto_grade_enabled | boolean | default: false | Use AI grading |
| created_at | timestamp | NOT NULL, default: now() |  |
| updated_at | timestamp | NOT NULL, default: now() |  |

**JSONB Schema for rubric:**
```json
rubric: {
  "criteria": [
    {
      "name": "Correctness",
      "weight": 0.5,
      "description": "Mathematical accuracy",
      "levels": [
        {"score": 0, "description": "Incorrect"},
        {"score": 50, "description": "Partially correct"},
        {"score": 100, "description": "Fully correct"}
      ]
    },
    {
      "name": "Clarity",
      "weight": 0.3,
      "description": "Explanation clarity",
      "levels": [...]
    }
  ]
}
```

**Relationships:**
- course_id → courses(id)
- creator_id → users(id)
- One assignment has many submissions

**Indexes:**
- idx_assignments_course_id
- idx_assignments_creator_id
- idx_assignments_due_date (for sorting by deadline)

**Example Row:**
```sql
INSERT INTO assignments (course_id, creator_id, title, description, assignment_type, due_date, points_possible, is_published) VALUES
('660e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000',
'Calculus Problem Set 3', 'Solve problems 1-20 in Chapter 3', 'math',
now() + interval '1 week', 100, true);
```

**Common Queries:**
- Get course assignments: `SELECT * FROM assignments WHERE course_id = $1 AND is_published = true;`
- Get upcoming assignments: `SELECT * FROM assignments WHERE due_date > now() ORDER BY due_date;`
- Get overdue assignments: `SELECT * FROM assignments WHERE due_date < now() AND due_date > now() - interval '7 days';`

---

### 3.7 submissions

**Purpose:** Student submissions for assignments. Stores content, grade, feedback, and timestamp.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default: gen_random_uuid() | Submission identifier |
| assignment_id | uuid | FK → assignments(id), NOT NULL | Which assignment |
| user_id | uuid | FK → users(id), NOT NULL | Student submitting |
| course_id | uuid | FK → courses(id), NOT NULL | Course context |
| content | text | NOT NULL | Submission text/code/answer |
| file_url | text | NULLABLE | Uploaded file URL (S3) |
| status | enum (draft \| submitted \| graded \| returned) | default: 'draft' | Submission state |
| score | numeric(5,2) | NULLABLE | Assigned score |
| max_score | integer | NOT NULL | Points possible |
| feedback | text | NULLABLE | Teacher/AI feedback |
| is_ai_graded | boolean | default: false | Whether AI graded it |
| submitted_at | timestamp | NULLABLE | When submitted (not draft) |
| graded_at | timestamp | NULLABLE | When graded |
| graded_by_id | uuid | FK → users(id), NULLABLE | Who graded (teacher or null if AI) |
| created_at | timestamp | NOT NULL, default: now() |  |
| updated_at | timestamp | NOT NULL, default: now() |  |

**Relationships:**
- assignment_id → assignments(id) [ON DELETE CASCADE]
- user_id → users(id) [ON DELETE CASCADE]
- course_id → courses(id) [ON DELETE CASCADE]
- graded_by_id → users(id) [ON DELETE SET NULL]

**Indexes:**
- idx_submissions_user_id
- idx_submissions_assignment_id
- idx_submissions_course_id
- idx_submissions_status (for filtering by state)
- idx_submissions_submitted_at (for recent submissions)

**Example Row:**
```sql
INSERT INTO submissions (assignment_id, user_id, course_id, content, status, max_score, submitted_at) VALUES
('880e8400-e29b-41d4-a716-446655440000', '550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000',
'The derivative of x^2 is 2x. The integral is x^3/3 + C.', 'submitted', 100, now());
```

**Common Queries:**
- Get student's submissions: `SELECT * FROM submissions WHERE user_id = $1 ORDER BY submitted_at DESC;`
- Get ungraded submissions: `SELECT * FROM submissions WHERE status IN ('submitted', 'returned') ORDER BY submitted_at;`
- Get student submission for assignment: `SELECT * FROM submissions WHERE assignment_id = $1 AND user_id = $2;`

---

### 3.8 community_messages

**Purpose:** Student posts in course discussion forums and study groups. Enables peer collaboration.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default: gen_random_uuid() | Message identifier |
| author_id | uuid | FK → users(id), NOT NULL | Who posted |
| course_id | uuid | FK → courses(id), NULLABLE | Course forum (or null if study group) |
| study_group_id | uuid | FK → study_groups(id), NULLABLE | If posted in study group |
| thread_id | uuid | NULLABLE | Parent message ID (for threading) |
| subject | text | NULLABLE | Thread subject |
| content | text | NOT NULL | Message body (markdown) |
| likes_count | integer | default: 0 | Like count |
| replies_count | integer | default: 0 | Reply count |
| is_pinned | boolean | default: false | Teacher/mod pinned |
| is_flagged | boolean | default: false | Flagged for review |
| created_at | timestamp | NOT NULL, default: now() |  |
| updated_at | timestamp | NOT NULL, default: now() |  |
| deleted_at | timestamp | NULLABLE | Soft delete |

**Relationships:**
- author_id → users(id)
- course_id → courses(id) [ON DELETE CASCADE]
- study_group_id → study_groups(id) [ON DELETE CASCADE]
- thread_id → community_messages(id) [self-referencing for replies]

**Indexes:**
- idx_community_messages_author_id
- idx_community_messages_course_id (for course forum)
- idx_community_messages_study_group_id (for study group chat)
- idx_community_messages_thread_id (for threading)
- idx_community_messages_created_at (for recent posts)

**Example Row:**
```sql
INSERT INTO community_messages (author_id, course_id, subject, content, is_pinned) VALUES
('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000',
'Question about Problem Set 3', 'Can someone explain how to approach problem 15?', false);
```

**Common Queries:**
- Get course forum: `SELECT * FROM community_messages WHERE course_id = $1 AND thread_id IS NULL ORDER BY is_pinned DESC, created_at DESC;`
- Get message thread: `SELECT * FROM community_messages WHERE thread_id = $1 ORDER BY created_at;`
- Get flagged messages: `SELECT * FROM community_messages WHERE is_flagged = true;`

---

### 3.9 user_data

**Purpose:** Extended user attributes and learner metadata. Stores quiz attempts, notes, analytics events, and preferences.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default: gen_random_uuid() | Record identifier |
| user_id | uuid | FK → users(id), UNIQUE, NOT NULL | Student (one per user) |
| quiz_attempts | jsonb | default: '[]' | Array of quiz attempt summaries |
| notes | jsonb | default: '[]' | Student's personal notes |
| analytics_events | jsonb | default: '[]' | User activity log (lessons, videos, etc.) |
| learning_style | text | NULLABLE | Detected style (visual, auditory, kinesthetic) |
| motivation_level | numeric(3,2) | default: 0.5 | 0.0-1.0 engagement score |
| total_study_hours | numeric(10,2) | default: 0.0 | Career total study time |
| created_at | timestamp | NOT NULL, default: now() |  |
| updated_at | timestamp | NOT NULL, default: now() |  |

**JSONB Schemas:**

```json
quiz_attempts: [
  {
    "id": "attempt-123",
    "topic": "calculus-derivatives",
    "quiz_id": "q-001",
    "score": 85,
    "total": 100,
    "correct": 17,
    "attempted": 20,
    "difficulty": "medium",
    "timestamp": "2026-03-01T10:30:00Z",
    "time_taken_seconds": 1200,
    "mastery_change": 0.05
  }
]

notes: [
  {
    "id": "note-456",
    "title": "Derivatives Key Concepts",
    "content": "# Power Rule\nFor f(x) = x^n, f'(x) = n*x^(n-1)",
    "topic_tags": ["derivatives", "calculus"],
    "course_id": "660e8400-e29b-41d4-a716-446655440000",
    "created_at": "2026-02-15T08:00:00Z",
    "updated_at": "2026-02-16T09:00:00Z"
  }
]

analytics_events: [
  {
    "id": "evt-789",
    "type": "lesson_view",
    "course_id": "660e8400-e29b-41d4-a716-446655440000",
    "lesson_id": "lesson-001",
    "module_id": "module-001",
    "duration_seconds": 900,
    "timestamp": "2026-03-01T10:30:00Z",
    "metadata": {"scroll_depth": 0.8, "paused_times": 3}
  },
  {
    "type": "quiz_attempted",
    "quiz_id": "quiz-001",
    "score": 85,
    "timestamp": "2026-03-01T11:45:00Z"
  }
]
```

**Relationships:**
- user_id → users(id) [UNIQUE, ON DELETE CASCADE]

**Indexes:**
- idx_user_data_user_id

**Example Row:**
```sql
INSERT INTO user_data (user_id, learning_style, motivation_level, total_study_hours) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'visual', 0.8, 45.5);
```

**Common Queries:**
- Get user learning style: `SELECT learning_style FROM user_data WHERE user_id = $1;`
- Get recent activity: `SELECT analytics_events FROM user_data WHERE user_id = $1;`
- Get user notes: `SELECT notes FROM user_data WHERE user_id = $1;`

---

### 3.10 ai_logs

**Purpose:** Audit trail for all AI agent actions. Tracks which agent did what, inputs, outputs, decisions made.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default: gen_random_uuid() | Log entry ID |
| user_id | uuid | FK → users(id), NULLABLE | Student involved (null for system) |
| agent_type | enum (tutor \| pathway \| assessment \| intervention \| guardian \| handwriting_agent \| orchestrator) | NOT NULL | Which AI agent |
| action | text | NOT NULL | What agent did (e.g., "generated_explanation") |
| input | jsonb | NULLABLE | Agent input data |
| output | jsonb | NULLABLE | Agent output/decision |
| confidence_score | numeric(3,2) | NULLABLE | Agent's confidence (0-1) |
| cost_tokens | integer | NULLABLE | LLM tokens used |
| session_id | uuid | FK → conversations(id), NULLABLE | Related conversation |
| course_id | uuid | FK → courses(id), NULLABLE | Course context |
| outcome | enum (success \| partial \| failed) | default: 'success' | Result |
| error_message | text | NULLABLE | If failed |
| created_at | timestamp | NOT NULL, default: now() | Timestamp |

**Relationships:**
- user_id → users(id) [ON DELETE SET NULL]
- session_id → conversations(id) [ON DELETE SET NULL]
- course_id → courses(id) [ON DELETE CASCADE]

**Indexes:**
- idx_ai_logs_user_id
- idx_ai_logs_agent_type
- idx_ai_logs_action
- idx_ai_logs_created_at
- idx_ai_logs_outcome (for error tracking)

**Example Row:**
```sql
INSERT INTO ai_logs (user_id, agent_type, action, input, output, confidence_score, outcome, course_id) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'tutor', 'generated_explanation',
'{"topic": "derivatives", "student_level": "beginner", "misconception": "chain_rule_confusion"}'::jsonb,
'{"explanation": "The chain rule states...", "examples": [...]}'::jsonb,
0.92, 'success', '660e8400-e29b-41d4-a716-446655440000');
```

**Common Queries:**
- Get tutor interactions: `SELECT * FROM ai_logs WHERE user_id = $1 AND agent_type = 'tutor' ORDER BY created_at DESC;`
- Get failed interventions: `SELECT * FROM ai_logs WHERE outcome = 'failed' ORDER BY created_at DESC;`
- Get agent usage stats: `SELECT agent_type, COUNT(*) FROM ai_logs GROUP BY agent_type;`

---

### 3.11 conversations

**Purpose:** Chat sessions between student and AI tutor. Stores full conversation history with timestamps.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default: gen_random_uuid() | Conversation identifier |
| user_id | uuid | FK → users(id), NOT NULL | Student chatting |
| course_id | uuid | FK → courses(id), NULLABLE | Course context |
| topic | text | NULLABLE | Main topic discussed |
| messages | jsonb | NOT NULL, default: '[]' | Full message history |
| is_active | boolean | default: true | Ongoing conversation |
| summary | text | NULLABLE | AI-generated summary |
| started_at | timestamp | NOT NULL, default: now() |  |
| ended_at | timestamp | NULLABLE | When conversation closed |
| last_message_at | timestamp | NOT NULL, default: now() |  |
| created_at | timestamp | NOT NULL, default: now() |  |

**JSONB Schema for messages:**
```json
messages: [
  {
    "id": "msg-001",
    "role": "user",
    "content": "I don't understand the chain rule",
    "timestamp": "2026-03-01T10:30:00Z"
  },
  {
    "id": "msg-002",
    "role": "assistant",
    "content": "The chain rule is used when...",
    "agent_name": "tutor",
    "timestamp": "2026-03-01T10:30:05Z"
  },
  {
    "id": "msg-003",
    "role": "user",
    "content": "Can you show me an example?",
    "timestamp": "2026-03-01T10:31:00Z"
  }
]
```

**Relationships:**
- user_id → users(id) [ON DELETE CASCADE]
- course_id → courses(id) [ON DELETE SET NULL]

**Indexes:**
- idx_conversations_user_id
- idx_conversations_course_id
- idx_conversations_is_active
- idx_conversations_last_message_at

**Example Row:**
```sql
INSERT INTO conversations (user_id, course_id, topic, messages) VALUES
('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'derivatives',
'[{"id": "msg-001", "role": "user", "content": "I don''t understand chain rule"}]'::jsonb);
```

**Common Queries:**
- Get user's conversations: `SELECT id, topic, last_message_at FROM conversations WHERE user_id = $1 ORDER BY last_message_at DESC;`
- Get active conversations: `SELECT * FROM conversations WHERE is_active = true;`
- Get conversation details: `SELECT messages FROM conversations WHERE id = $1;`

---

### 3.12 certificates

**Purpose:** Issued certifications when students complete courses. Serves as proof of completion.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default: gen_random_uuid() | Certificate identifier |
| user_id | uuid | FK → users(id), NOT NULL | Recipient |
| course_id | uuid | FK → courses(id), NOT NULL | Course completed |
| title | text | NOT NULL | Certificate title |
| issue_date | timestamp | NOT NULL, default: now() | When issued |
| expires_at | timestamp | NULLABLE | Expiration (if applicable) |
| certificate_url | text | NULLABLE | URL to PDF or image |
| verification_code | text | UNIQUE, NULLABLE | Code for verification |
| metadata | jsonb | default: '{}' | Score, completion %, honors, etc. |
| created_at | timestamp | NOT NULL, default: now() |  |

**JSONB Schema for metadata:**
```json
metadata: {
  "final_score": 92.5,
  "completion_percentage": 100.0,
  "with_honors": true,
  "total_hours": 45.5,
  "issued_by": "Teacher Name",
  "skill_demonstrated": ["derivatives", "integrals", "limits"]
}
```

**Relationships:**
- user_id → users(id) [ON DELETE CASCADE]
- course_id → courses(id) [ON DELETE CASCADE]

**Indexes:**
- idx_certificates_user_id
- idx_certificates_course_id
- idx_certificates_verification_code

**Example Row:**
```sql
INSERT INTO certificates (user_id, course_id, title, verification_code, metadata) VALUES
('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000',
'Calculus I Completion', 'CERT-2026-001234',
'{"final_score": 92.5, "with_honors": true}'::jsonb);
```

**Common Queries:**
- Get user certificates: `SELECT * FROM certificates WHERE user_id = $1;`
- Get valid certificates: `SELECT * FROM certificates WHERE expires_at IS NULL OR expires_at > now();`
- Verify certificate: `SELECT * FROM certificates WHERE verification_code = $1;`

---

### 3.13 learner_profiles

**Purpose:** Comprehensive learner profile per student. Aggregates mastery levels, learning style, misconceptions, and engagement metrics.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default: gen_random_uuid() | Profile identifier |
| user_id | uuid | FK → users(id), UNIQUE, NOT NULL | Student (one per student) |
| course_id | uuid | FK → courses(id), NOT NULL | Course-specific profile |
| mastery_levels | jsonb | NOT NULL, default: '{}' | Topic mastery (BKT state) |
| learning_style | text | NULLABLE | visual \| auditory \| kinesthetic |
| strengths | jsonb | default: '[]' | Topics student excels in |
| misconceptions | jsonb | default: '[]' | Known incorrect beliefs |
| learning_pace | text | nullable | slow \| moderate \| fast |
| engagement_score | numeric(3,2) | default: 0.5 | 0-1 engagement |
| last_updated | timestamp | NOT NULL, default: now() |  |
| created_at | timestamp | NOT NULL, default: now() |  |

**JSONB Schemas:**

```json
mastery_levels: {
  "calculus-derivatives": {
    "score": 0.72,
    "confidence": 0.8,
    "last_assessed": "2026-03-01T10:30:00Z",
    "num_assessments": 12,
    "bkt_params": {
      "p_l0": 0.1,
      "p_t": 0.2,
      "p_g": 0.1,
      "p_s": 0.1
    },
    "trend": "improving"
  }
}

strengths: [
  {
    "topic": "derivatives",
    "mastery": 0.95,
    "confidence": 0.9,
    "assessments": 8
  }
]

misconceptions: [
  {
    "id": "misc-001",
    "topic": "chain_rule",
    "description": "Thinks chain rule multiplies the exponent",
    "severity": "high",
    "last_seen": "2026-02-28T14:00:00Z",
    "interventions_tried": 3
  }
]
```

**Relationships:**
- user_id → users(id) [UNIQUE, ON DELETE CASCADE]
- course_id → courses(id) [ON DELETE CASCADE]

**Unique Constraints:**
- (user_id, course_id) — one profile per student per course

**Indexes:**
- idx_learner_profiles_user_id
- idx_learner_profiles_course_id
- idx_learner_profiles_engagement_score

**Example Row:**
```sql
INSERT INTO learner_profiles (user_id, course_id, mastery_levels, learning_style, engagement_score) VALUES
('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000',
'{"calculus-derivatives": {"score": 0.72, "confidence": 0.8}}'::jsonb, 'visual', 0.85);
```

**Common Queries:**
- Get student profile: `SELECT * FROM learner_profiles WHERE user_id = $1 AND course_id = $2;`
- Get mastery levels: `SELECT mastery_levels FROM learner_profiles WHERE user_id = $1;`
- Find students with misconceptions: `SELECT user_id, misconceptions FROM learner_profiles WHERE jsonb_array_length(misconceptions) > 0;`

---

### 3.14 behavior_logs

**Purpose:** Tracks student behavioral patterns (page views, time on task, click patterns, session duration, etc.) for learning insights.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default: gen_random_uuid() | Log entry ID |
| user_id | uuid | FK → users(id), NOT NULL | Student |
| course_id | uuid | FK → courses(id), NULLABLE | Course context |
| event_type | text | NOT NULL | page_view, click, scroll, pause, resume, submit, etc. |
| event_data | jsonb | NULLABLE | Event-specific details |
| session_duration_seconds | integer | NULLABLE | How long on page |
| resource_id | text | NULLABLE | lesson/assignment/quiz ID |
| timestamp | timestamp | NOT NULL, default: now() |  |
| created_at | timestamp | NOT NULL, default: now() |  |

**JSONB Schema for event_data:**
```json
event_data: {
  "page_url": "/course/660e8400/lesson/lesson-001",
  "scroll_depth": 0.85,
  "clicks": 12,
  "pause_count": 2,
  "device": "desktop",
  "browser": "Chrome",
  "viewport_width": 1920
}
```

**Relationships:**
- user_id → users(id) [ON DELETE CASCADE]
- course_id → courses(id) [ON DELETE CASCADE]

**Indexes:**
- idx_behavior_logs_user_id
- idx_behavior_logs_course_id
- idx_behavior_logs_event_type
- idx_behavior_logs_timestamp
- idx_behavior_logs_resource_id

**Example Row:**
```sql
INSERT INTO behavior_logs (user_id, course_id, event_type, resource_id, session_duration_seconds, event_data) VALUES
('550e8400-e29b-41d4-a716-446655440000', '660e8400-e29b-41d4-a716-446655440000', 'page_view', 'lesson-001', 1200,
'{"scroll_depth": 0.85, "clicks": 12}'::jsonb);
```

**Common Queries:**
- Get student's session activity: `SELECT * FROM behavior_logs WHERE user_id = $1 ORDER BY timestamp DESC LIMIT 100;`
- Get engagement per lesson: `SELECT resource_id, AVG(session_duration_seconds) FROM behavior_logs GROUP BY resource_id;`
- Get event heatmap: `SELECT event_type, COUNT(*) FROM behavior_logs WHERE course_id = $1 GROUP BY event_type;`

---

### 3.15 agent_memory

**Purpose:** Persistent memory for AI agents about each student. Stores context, preferences, past interactions, emotional state.

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| id | uuid | PK, default: gen_random_uuid() | Memory record ID |
| user_id | uuid | FK → users(id), NOT NULL | Student |
| agent_type | enum (tutor \| pathway \| assessment \| intervention \| guardian \| handwriting_agent \| orchestrator) | NOT NULL | Which agent |
| memory_key | text | NOT NULL | Memory key (e.g., "last_topic", "emotional_state") |
| memory_value | jsonb | NOT NULL | Any JSON data |
| confidence | numeric(3,2) | default: 0.5 | How confident agent is in this memory |
| last_updated | timestamp | NOT NULL, default: now() |  |
| expires_at | timestamp | NULLABLE | Expiration for temporary memories |
| created_at | timestamp | NOT NULL, default: now() |  |

**JSONB Examples for memory_value:**
```json
// Memory key: "last_topic"
memory_value: {
  "topic": "derivatives",
  "subtopic": "chain rule",
  "context": "student was confused",
  "timestamp": "2026-02-28T14:00:00Z"
}

// Memory key: "emotional_state"
memory_value: {
  "frustration_level": 0.7,
  "confidence": 0.4,
  "motivation": 0.8,
  "reason": "struggling with chain rule"
}

// Memory key: "preferred_format"
memory_value: {
  "explanation_style": "worked_examples",
  "pacing": "slow",
  "visual_aids": true,
  "code_examples": false
}

// Memory key: "misconceptions"
memory_value: [
  {
    "misconception": "chain rule multiplies exponents",
    "seen_count": 3,
    "last_seen": "2026-02-28T14:00:00Z"
  }
]
```

**Relationships:**
- user_id → users(id) [ON DELETE CASCADE]

**Indexes:**
- idx_agent_memory_user_id
- idx_agent_memory_agent_type
- idx_agent_memory_memory_key
- idx_agent_memory_expires_at (for cleanup of expired memories)

**Example Row:**
```sql
INSERT INTO agent_memory (user_id, agent_type, memory_key, memory_value, confidence) VALUES
('550e8400-e29b-41d4-a716-446655440000', 'tutor', 'emotional_state',
'{"frustration_level": 0.7, "motivation": 0.8}'::jsonb, 0.85);
```

**Common Queries:**
- Get agent's memory of student: `SELECT * FROM agent_memory WHERE user_id = $1 AND agent_type = 'tutor';`
- Get specific memory: `SELECT memory_value FROM agent_memory WHERE user_id = $1 AND memory_key = 'emotional_state';`
- Cleanup expired: `DELETE FROM agent_memory WHERE expires_at < now();`

---

(Due to length constraints, continuing with remaining tables in next section...)

### 3.16 quizzes
**Purpose:** Formal assessments within a course.
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary Key |
| course_id | uuid | FK → courses(id) |
| title | text | Quiz title |
| questions | jsonb | Array of quiz questions |
| is_published | boolean | Visibility status |

### 3.17 quiz_attempts
**Purpose:** Records each attempt by a student on a specific quiz.
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary Key |
| user_id | uuid | FK → users(id) |
| quiz_id | uuid | FK → quizzes(id) |
| score | numeric | Achievement score |
| answers | jsonb | Responses provided |

### 3.18 student_pathways
**Purpose:** AI-generated progress paths for individual students.
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary Key |
| user_id | uuid | FK → users(id) |
| course_id | uuid | FK → courses(id) |
| pathway_nodes | jsonb | Sequential blocks of content |
| completion_percentage | numeric | Progress tracking |

### 3.19 skill_mastery
**Purpose:** Granular tracking of specific skills using BKT.
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary Key |
| user_id | uuid | FK → users(id) |
| skill_name | text | Identifier for the skill |
| mastery_score | numeric | 0-1 probability of mastery |
| confidence | numeric | AI confidence in the score |

### 3.20 knowledge_nodes
**Purpose:** The building blocks of curriculum structure.
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | Primary Key |
| course_id | uuid | FK → courses(id) |
| parent_id | uuid | Self-reference for hierarchy |
| title | text | Node title |

---


### 3.21 parent_student_links

**Purpose:** Formal linking mechanism between parents and students via restricted codes. Requires admin verification for portal access.
| Column | Type | Notes |
|--------|------|-------|
| id | uuid | PK |
| student_id | uuid | FK → users(id) |
| parent_id | uuid | FK → users(id); Nullable until linked |
| link_code | text | UNIQUE; One-time usage code |
| status | text | pending \| linked \| expired |
| verification_status | text | pending \| verified \| rejected \| flagged |
| verified_by_admin | boolean | Default: false; Gateway for portal access |
| verified_at | timestamptz | When verified by admin |
| verified_by | uuid | Admin user ID who verified |
| can_view_grades | boolean | Permission to see children's grades |
| can_view_progress | boolean | Permission to see children's progress |
| expires_at | timestamptz | Code expiry |

---

## 4. Governance & Security


### 4.1 Admin-Verified Parent Access

To prevent unauthorized access to sensitive student data (grades, progress, submissions), all parent-student links must be **explicitly verified** by a system administrator.

- **RLS Enforced:** Policies on `progress`, `submissions`, and `certificates` tables check for `verified_by_admin = true` on the corresponding link.
- **Audit Logging:** Every verification action is logged with the admin's user ID and timestamp.

## 5. Maintenance & Evolution

For details on how to add new tables or modify policies, see [DATABASE_MIGRATION_GUIDE.md](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/vault/02_Technical_Specs/DATABASE_MIGRATION_GUIDE.md).
