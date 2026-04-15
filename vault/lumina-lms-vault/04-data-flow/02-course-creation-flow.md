# Course Creation Flow

> **File:** `04-data-flow/02-course-creation-flow.md`
> **Related:** [[04-data-flow/00-data-flow-master]], [[08-features/01-course-management]], [[08-features/02-ai-course-builder]]
> **Last Updated:** 2026-04-15

How a Teacher creates a course, uploads content, maps Knowledge Components, and publishes it to students.

---

## Actors

Teacher (primary), AI Engine (background), FAISS/Neo4j (indexing)

## Preconditions

- Teacher account is active and assigned to a department
- Department and branches exist in the institution

## Step-by-Step Flow

**Step 1 — Create course shell**
```
POST /api/courses
Body: { name, description, branch, year, semester, department_id }
Response: { course_id, status: "draft" }
```
Creates a row in `courses` with `status = 'draft'` and `institution_id` from JWT.

**Step 2 — Create modules and lessons**
```
POST /api/courses/{course_id}/modules
POST /api/courses/{course_id}/modules/{module_id}/lessons
```
Module = a chapter or unit. Lesson = a single lecture or reading within a module.

**Step 3 — Upload lecture content**
```
GET /api/courses/{course_id}/lessons/{lesson_id}/upload-url
→ returns pre-signed MinIO PUT URL (15min TTL)

Frontend uploads PDF/video directly to MinIO using the pre-signed URL.

POST /api/courses/{course_id}/lessons/{lesson_id}/confirm-upload
Body: { minio_object_key, file_size, file_type }
```
Backend verifies the object exists in MinIO and updates `lessons.content_key`.

**Step 4 — Map Knowledge Components**
Teacher maps each lesson to one or more Knowledge Components (KCs). KCs are the atomic units tracked by BKT+DKT.
```
POST /api/courses/{course_id}/kcs
Body: { name, description, prerequisite_kc_ids: [uuid] }
```
Backend writes to PostgreSQL AND creates/updates the Neo4j knowledge graph:
```cypher
MERGE (:KC {id: $kc_id, name: $name, institution_id: $institution_id})
CREATE (:KC {id: $prerequisite_id})-[:PREREQUISITE_OF]->(:KC {id: $kc_id})
```

**Step 5 — Trigger content indexing (background)**
When Teacher clicks "Publish Course" or "Index Content", backend dispatches a background task:
- Read lesson PDFs from MinIO
- Chunk text (512-token chunks, 50-token overlap)
- Generate embeddings (sentence-transformers `all-MiniLM-L6-v2`)
- Insert into FAISS index partitioned by `institution_id + course_id`
- Build BM25 index over same chunks

**Step 6 — Publish**
```
PATCH /api/courses/{course_id}
Body: { status: "published" }
```
Course becomes visible to enrolled students. Students cannot enroll until status is `published`.

## Data Written

| Table | Written at step | Key fields |
|---|---|---|
| `courses` | 1 | id, institution_id, teacher_id, name, status |
| `modules` | 2 | id, course_id, institution_id, order_index |
| `lessons` | 2 | id, module_id, course_id, institution_id |
| `lesson_content` | 3 (confirm-upload) | lesson_id, minio_key, content_type |
| `knowledge_components` | 4 | id, course_id, institution_id, name |
| `kc_prerequisites` | 4 | kc_id, prerequisite_kc_id |
| `faiss_chunk_index` | 5 | chunk_id, course_id, embedding_vector |
| Neo4j | 4 | KC nodes and PREREQUISITE_OF edges |

## Error Paths

| Error | Handling |
|---|---|
| MinIO upload fails | Pre-signed URL expires; Teacher retries upload |
| FAISS indexing fails | Course stays published; indexing retried on next background run; Tutor RAG degrades to BM25+Neo4j only |
| Neo4j write fails | KC saved to PostgreSQL; graph edge missing; Pathway Agent falls back to BKT-greedy ordering |
| Course published with 0 lessons | Validation error — at least 1 lesson required |
