# Lumina AI Learning — Agent Task List
> Auto-generated from test run + full project audit on 2026-03-08.
> Each task is self-contained with file paths, exact lines, and acceptance criteria so an agent can execute it without extra context.
>
> Strategic learner-intelligence build work now lives in `docs/AGENT_BUILD_BACKLOG.md`.
> Use this file for operational bug-fix and coverage work, and use the new backlog for the student intelligence loop, KPI engine, and explanation-style system.

---

## PRIORITY 1 — CRITICAL BUGS (will crash at runtime)

### TASK-001: Fix CourseStore — legacy NoSQL syntax still used after Supabase migration
**File:** `backend/app/store/course_store.py` lines 93–111
**Problem:** `add_module()` and `update_modules()` use legacy `update_one()`, `$push`, `$set` operators. These will raise `AttributeError` at runtime since the Supabase client has no `update_one()` method.
**Fix:**
- `add_module(course_id, module)`: fetch the course, append `module` to `course["modules"]`, then call `self.courses_collection.update({"modules": updated_list}).eq("id", course_id).execute()`
- `update_modules(course_id, modules)`: call `self.courses_collection.update({"modules": modules}).eq("id", course_id).execute()`
- Remove all legacy dict filter syntax (`{"$or": [...]}`, `{"$push": {...}}`, `{"$set": {...}}`)
- Remove `await` from these calls (Supabase client is synchronous, not async)
**Acceptance:** Both methods execute without error and correctly write to the Supabase `courses` table.

---

### TASK-002: Fix handwriting router — missing `await` on async state store calls
**File:** `backend/app/routers/handwriting.py` lines ~73 and ~104
**Problem:** Calls to `state_store.get_state(user_id)` and related state store methods are not awaited, causing coroutines to be returned instead of executed.
**Fix:** Add `await` in front of every `state_store.*` call in the handwriting router.
**Acceptance:** Handwriting upload endpoint returns correct state without `RuntimeWarning: coroutine was never awaited`.

---

### TASK-003: Fix Orchestrator — NotImplementedError in routing logic
**File:** `backend/ai_engine/swarm/orchestrator.py` line ~22
**Problem:** The orchestrator raises `NotImplementedError("Orchestrator routing logic not implemented for this request.")` for unhandled request types. Any unknown request type will crash the agent swarm endpoint.
**Fix:** Implement a fallback routing strategy (e.g., route to a default general-purpose agent, or return a structured error response instead of raising). Do not raise `NotImplementedError` in a production code path.
**Acceptance:** Orchestrator never raises uncaught `NotImplementedError`; all request types either route correctly or return a graceful error dict.

---

### TASK-004: Fix async test — pytest-asyncio not configured for test_supabase.py
**File:** `backend/test_supabase.py`
**Problem:** The test function `test_all_connections` is `async def` but pytest skips it with `PytestUnhandledCoroutineWarning` because no `@pytest.mark.asyncio` decorator is present and `asyncio_mode` is not set.
**Fix:**
1. Add `import pytest` to `test_supabase.py`
2. Add `@pytest.mark.asyncio` decorator to `test_all_connections`
3. Create `backend/pytest.ini` (or `pyproject.toml` section) with:
   ```ini
   [pytest]
   asyncio_mode = auto
   ```
**Acceptance:** Running `python -m pytest backend/test_supabase.py -v` shows the test as PASSED (not skipped).

---

## PRIORITY 2 — INCOMPLETE FEATURES (silent failures / stub implementations)

### TASK-005: Implement RAG hybrid search BM25 fallback
**File:** `backend/app/rag/retrieval.py` line ~19
**Problem:** There is a `# TODO: Implement BM25 fallback for keyword search` comment. Currently only vector search is performed, so keyword-heavy queries get poor results.
**Fix:**
- Install `rank_bm25` (add to `backend/requirements.txt`)
- Implement BM25 retrieval over the document corpus stored in ChromaDB
- Merge BM25 + vector results using Reciprocal Rank Fusion (RRF) before returning
**Acceptance:** The retrieval function returns results for keyword queries that return no vector matches. Unit test with a keyword query confirms non-empty results.

---

### TASK-006: Implement course invite email sending
**File:** `backend/app/routers/courses.py` lines ~255–265
**Problem:** The `POST /api/courses/{id}/invite` endpoint returns `{"success": True}` but never actually sends an email invitation.
**Fix:**
- Add an email-sending utility using the SMTP settings already present in `backend/app/core/config.py` (or use SendGrid / Resend if configured in `.env`)
- Send an invitation email to the provided email address with the course code and a signup link
- Gracefully handle send failures (log and return 500 with error detail)
**Acceptance:** Calling the invite endpoint with a valid email actually delivers an email (or in test mode, logs the email content to stdout).

---

### TASK-007: Implement proper student profile update
**File:** `backend/app/routers/student.py` lines ~141–152
**Problem:** `PATCH /api/student/profile/update` has a "simplistic implementation" comment and does not persist changes properly.
**Fix:**
- Accept `full_name`, `phone`, and `avatar_url` fields in the request body
- Call `UserStore().update_user_fields(user_id, {fields})` (add `update_user_fields` method to `UserStore` if missing)
- Return the updated user profile
**Acceptance:** Updating profile via the endpoint and then fetching it returns the new values.

---

### TASK-008: Add `update_user_fields` method to UserStore
**File:** `backend/app/store/user_store.py`
**Problem:** No generic field-update method exists. TASK-007 requires it.
**Fix:** Add:
```python
async def update_user_fields(self, user_id: str, fields: dict) -> bool:
    fields.pop("id", None)
    fields.pop("password_hash", None)
    try:
        response = self.client.table("users").update(fields).eq("id", user_id).execute()
        return len(response.data) > 0
    except Exception as e:
        log.error("update_user_fields_failed", error=str(e))
        return False
```
**Acceptance:** Method exists and updates specified fields in Supabase `users` table.

---

## PRIORITY 3 — TEST COVERAGE (zero tests currently for most features)

### TASK-009: Write backend unit tests for CourseStore
**File:** Create `backend/tests/test_course_store.py`
**Tests to write:**
- `test_create_course` — creates a course and verifies it's retrievable by code
- `test_update_course` — updates description and verifies new value
- `test_add_module` — adds a module dict and verifies it appears in course modules list
- `test_update_modules` — replaces modules list and verifies
- `test_delete_course` — deletes and verifies not found
Each test should create and clean up its own test data.
**Acceptance:** All 5 tests pass with `pytest --asyncio-mode=auto`.

---

### TASK-010: Write backend unit tests for UserStore
**File:** Create `backend/tests/test_user_store.py`
**Tests to write:**
- `test_create_user` — creates user, verifies no password_hash in response
- `test_get_user_by_email` — fetches and verifies ID match
- `test_get_user_by_id` — fetches and verifies email match
- `test_update_user_role` — changes role to teacher and verifies
- `test_update_user_fields` — updates name and phone, verifies
- `test_delete_user` — deletes and verifies not found
**Acceptance:** All 6 tests pass with `pytest --asyncio-mode=auto`.

---

### TASK-011: Write backend integration tests for auth endpoints
**File:** Create `backend/tests/test_auth_routes.py`
**Tests to write (use `httpx.AsyncClient` with FastAPI's `app`):**
- `test_register` — `POST /api/auth/register` returns 201 with user data
- `test_login` — `POST /api/auth/login` returns JWT token
- `test_get_me` — `GET /api/auth/me` with token returns current user
- `test_login_wrong_password` — returns 401
- `test_duplicate_email` — returns 400
**Acceptance:** All 5 tests pass.

---

### TASK-012: Write backend integration tests for course endpoints
**File:** Create `backend/tests/test_course_routes.py`
**Tests to write:**
- `test_create_course` — teacher creates course, gets 201
- `test_list_courses` — returns array
- `test_get_course` — returns correct course by ID
- `test_update_course` — updates and verifies
- `test_delete_course` — deletes and verifies 404 on subsequent get
- `test_enroll_student` — student enrolls in course
**Acceptance:** All 6 tests pass.

---

### TASK-013: Write frontend component tests for auth flow
**Directory:** `frontend/web/src/`
**File to create:** `frontend/web/src/__tests__/auth.test.ts`
**Tests to write (using vitest + jsdom):**
- Login form renders correctly
- Submit with empty fields shows validation errors
- Successful login stores token in localStorage and redirects
- 401 response shows error message
**Acceptance:** `npm test` in `frontend/web/` shows 4 passing tests.

---

## PRIORITY 4 — CODE QUALITY / WARNINGS

### TASK-014: Fix Pydantic V2 deprecation warnings in backend
**Problem:** Running the backend shows `PydanticDeprecatedSince20: Support for class-based config is deprecated` warnings. These come from models using `class Config:` instead of `model_config = ConfigDict(...)`.
**Files to check:** `backend/app/database/models.py` and any Pydantic model files.
**Fix:** Replace all `class Config:` blocks with `model_config = ConfigDict(...)` pattern per Pydantic V2 migration guide.
**Acceptance:** No `PydanticDeprecatedSince20` warnings on startup.

---

### TASK-015: Fix bcrypt version warning
**Problem:** `(trapped) error reading bcrypt version` appears on every startup — caused by `passlib` looking for `bcrypt.__about__.__version__` which no longer exists in newer bcrypt versions.
**Fix:** Pin `bcrypt==4.0.1` in `backend/requirements.txt` (compatible version) or upgrade `passlib` to a version that handles this gracefully.
**Acceptance:** Warning no longer appears on startup.

---

### TASK-016: Update CourseStore docstring — says "legacy store"
**File:** `backend/app/store/course_store.py` line 12
**Problem:** Docstring says `legacy store for Courses` — leftover from before Supabase migration.
**Fix:** Change to `Supabase (PostgreSQL) store for Courses.`
**Acceptance:** Docstring is accurate.

---

### TASK-017: Set pytest asyncio_mode to avoid future deprecation warning
**File:** Create `backend/pytest.ini`
**Problem:** pytest-asyncio warns `The configuration option "asyncio_default_fixture_loop_scope" is unset` on every test run.
**Fix:**
```ini
[pytest]
asyncio_mode = auto
```
**Acceptance:** Warning no longer appears.

---

## PRIORITY 5 — INFRASTRUCTURE / OBSERVABILITY

### TASK-018: Add Redis health check fallback
**File:** `backend/app/main.py` health check endpoint (~line 262)
**Problem:** If Redis is down the entire health check returns `degraded`, but the app can still function without Redis (it's used for caching, not critical data). The error message exposes internal details.
**Fix:** Distinguish between `degraded` (non-critical services down) and `error` (critical services down). Redis should only set `degraded`, not `error`. Sanitize error messages to not expose internal stack info.
**Acceptance:** Health check returns `ok` with Redis marked `degraded` when Redis is unavailable, without crashing.

---

### TASK-019: Add database migrations documentation and seed script
**File:** Create `backend/SETUP.md`
**Problem:** There is no document explaining:
- What Supabase tables need to exist (`users`, `courses`, `user_data`, `assignments`, `community_messages`, etc.)
- How to run the seed script
- What environment variables are required
**Fix:** Document all required tables, their schemas, required `.env` keys, and steps to initialize a fresh Supabase project.
**Acceptance:** A new developer can follow the doc and get the backend running from scratch.

---

## Summary Table

| Task ID | Priority | Category | Estimated Complexity | Status |
|---------|----------|----------|----------------------|--------|
| TASK-001 | P1 | Bug | Low | Done |
| TASK-002 | P1 | Bug | Low | Done |
| TASK-003 | P1 | Bug | Medium | Done |
| TASK-004 | P1 | Bug | Low | Done |
| TASK-005 | P2 | Feature | High | Done |
| TASK-006 | P2 | Feature | Medium | Done |
| TASK-007 | P2 | Feature | Low | Done |
| TASK-008 | P2 | Feature | Low | Done |
| TASK-009 | P3 | Tests | Medium | Done |
| TASK-010 | P3 | Tests | Medium | Done |
| TASK-011 | P3 | Tests | Medium | Done |
| TASK-012 | P3 | Tests | Medium | Done |
| TASK-013 | P3 | Tests | Medium | Done |
| TASK-014 | P4 | Quality | Low | Done |
| TASK-015 | P4 | Quality | Low | Done |
| TASK-016 | P4 | Quality | Low | Done |
| TASK-017 | P4 | Quality | Low | Done |
| TASK-018 | P5 | Infra | Low | Done |
| TASK-019 | P5 | Infra | Low | Done |

---
*Generated by audit agent. Update task status to `In Progress` / `Done` as work proceeds.*
