# API Overview

> **File:** `09-api/00-api-overview.md`
> **Related:** [[09-api/01-auth-endpoints]], [[06-auth/01-auth-overview]]
> **Last Updated:** 2026-04-15

API design conventions, base URL, authentication, versioning, and common patterns.

---

## Base URL

```
Development:  http://localhost:9000
Production:   https://<institution-domain>/api
```

All API routes are prefixed with `/api`. No `/v1` versioning prefix is used — breaking changes are handled via migration rather than versioned endpoints.

## Authentication

All endpoints except `POST /api/auth/login` and `GET /health` require a valid JWT access token delivered via HttpOnly cookie named `access_token`.

No Bearer token in Authorization header — Lumina uses cookies exclusively to prevent token leakage via JavaScript.

## Request Format

- Content-Type: `application/json` for all POST/PATCH/PUT bodies
- File uploads: `multipart/form-data`
- All UUIDs as hyphenated lowercase strings: `"550e8400-e29b-41d4-a716-446655440000"`
- All datetimes as ISO 8601 with UTC timezone: `"2026-04-15T10:30:00.000Z"`

## Response Format

**Success:**
```json
{ "data": { ... } }
```

**List response:**
```json
{
  "data": [ ... ],
  "pagination": {
    "total": 150,
    "page": 1,
    "per_page": 20,
    "pages": 8
  }
}
```

**Error:**
```json
{
  "error": {
    "code": "ERROR_CODE",
    "message": "Human-readable description",
    "request_id": "uuid"
  }
}
```

## Pagination

List endpoints accept:
- `?page=1` (1-indexed)
- `?per_page=20` (max 100)
- `?sort_by=created_at` (field name)
- `?sort_order=desc` (`asc` or `desc`)

## institution_id Scoping

`institution_id` is **never a query parameter or path parameter** on any endpoint. It is always extracted from the validated JWT. This is not configurable. A request can only ever access data from its own institution.

## Idempotency

POST endpoints that create resources are NOT idempotent by default. For bulk operations (e.g., student import), the endpoint is idempotent on the unique key (username within institution) — duplicates are skipped and reported in the response.

## API Router Modules

| File | Router prefix | Purpose |
|---|---|---|
| [[09-api/01-auth-endpoints]] | `/api/auth` | Authentication |
| [[09-api/02-course-endpoints]] | `/api/courses` | Course CRUD |
| [[09-api/03-learner-endpoints]] | `/api/enrollments`, `/api/flashcards`, `/api/pathway` | Student learning |
| [[09-api/04-agent-endpoints]] | `/api/queue`, `/api/assessments`, `/api/dropout` | AI agent triggers |
