# Course Endpoints

> **File:** `09-api/02-course-endpoints.md`
> **Related:** [[09-api/00-api-overview]], [[08-features/01-course-management]]
> **Last Updated:** 2026-04-15

All CRUD endpoints for courses, modules, lessons, knowledge components, and flashcards.

---

## GET /api/courses

List courses visible to the current user.

**Allowed roles:** All authenticated

**Query params:** `?branch=CSE&year=3&semester=1&status=published&page=1&per_page=20`

**Response (200):**
```json
{
  "data": [
    {
      "id": "uuid", "name": "string", "description": "string",
      "branch": "string", "year": 3, "semester": 1,
      "teacher_id": "uuid", "teacher_name": "string",
      "status": "published", "module_count": 5,
      "enrolled_student_count": 42,
      "created_at": "datetime"
    }
  ],
  "pagination": { "total": 8, "page": 1, "per_page": 20, "pages": 1 }
}
```

**Scoping:** Student sees only courses matching their `branch + year + semester` that are published. Teacher sees only their own courses. IA sees all courses in institution.

---

## POST /api/courses

Create a new course (draft).

**Allowed roles:** teacher

**Request body:**
```json
{
  "name": "string",
  "description": "string",
  "branch": "string",
  "year": "integer (1-4)",
  "semester": "integer (1-2)",
  "department_id": "uuid"
}
```

**Response (201):**
```json
{ "data": { "id": "uuid", "status": "draft", ... } }
```

**Side effects:** Creates course row with `teacher_id = current_user_id`, `institution_id` from JWT.

---

## PATCH /api/courses/{course_id}

Update course metadata or change status (draft → published → archived).

**Allowed roles:** teacher (own courses only)

**Request body (partial update):**
```json
{
  "name": "string",
  "description": "string",
  "status": "published|archived"
}
```

**Response (200):** Updated course object.

**Side effects:** On `status = published`, triggers background task to index all lesson content into FAISS.

---

## POST /api/courses/{course_id}/modules

Create a module within a course.

**Allowed roles:** teacher (own courses only)

**Request body:**
```json
{ "name": "string", "order_index": "integer" }
```

**Response (201):** Module object.

---

## POST /api/courses/{course_id}/modules/{module_id}/lessons

Create a lesson within a module.

**Allowed roles:** teacher (own courses only)

**Request body:**
```json
{
  "name": "string",
  "content_type": "pdf|video|text",
  "duration_minutes": "integer",
  "order_index": "integer"
}
```

**Response (201):** Lesson object.

---

## GET /api/courses/{course_id}/lessons/{lesson_id}/upload-url

Get a pre-signed MinIO URL to upload lesson content directly.

**Allowed roles:** teacher (own courses only)

**Response (200):**
```json
{
  "data": {
    "upload_url": "string (pre-signed MinIO PUT URL, 15min TTL)",
    "object_key": "string (use this in confirm-upload)"
  }
}
```

---

## POST /api/courses/{course_id}/lessons/{lesson_id}/confirm-upload

Confirm that content was uploaded to MinIO.

**Allowed roles:** teacher (own courses only)

**Request body:**
```json
{
  "minio_object_key": "string",
  "file_size_bytes": "integer",
  "file_type": "application/pdf|video/mp4"
}
```

**Response (200):** Updated lesson object with `content_key` set.

---

## POST /api/courses/{course_id}/kcs

Create a Knowledge Component and link it to the course in Neo4j.

**Allowed roles:** teacher (own courses only)

**Request body:**
```json
{
  "name": "string",
  "description": "string",
  "prerequisite_kc_ids": ["uuid"]
}
```

**Response (201):** KC object with `id`.

**Side effects:** Creates KC node and PREREQUISITE_OF edges in Neo4j.

---

## POST /api/courses/{course_id}/enroll

Enroll current user (student) in the course.

**Allowed roles:** student

**Request body:** None

**Response (201):**
```json
{
  "data": {
    "enrollment_id": "uuid",
    "course_id": "uuid",
    "initial_recommended_kc": { "kc_id": "uuid", "kc_name": "string" },
    "flashcards_initialised": 24,
    "kcs_tracked": 12
  }
}
```

**Side effects:** Creates `enrollments`, `knowledge_trace` (one per KC), and `fsrs_card_state` (one per flashcard) rows. Dispatches Pathway Agent for initial recommendation.
