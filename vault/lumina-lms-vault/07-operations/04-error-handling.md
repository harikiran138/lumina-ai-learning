# Error Handling

> **File:** `07-operations/04-error-handling.md`
> **Related:** [[07-operations/03-logging]], [[07-operations/02-monitoring]]
> **Last Updated:** 2026-04-15

Error categories, HTTP response conventions, retry logic, and escalation paths.

---

## HTTP Error Response Format

All FastAPI error responses follow this schema:

```json
{
  "error": {
    "code": "QUEUE_ITEM_NOT_FOUND",
    "message": "No queue item found with id abc123 in your institution",
    "request_id": "uuid"
  }
}
```

`request_id` is generated per request by middleware and included in both the response and the application log, enabling log correlation.

## Error Code Catalogue

| HTTP Code | Error code | Meaning |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Request body fails Pydantic schema validation |
| 400 | `INVALID_FILE_TYPE` | Uploaded file is not an accepted type |
| 401 | `NOT_AUTHENTICATED` | No valid access token |
| 401 | `TOKEN_EXPIRED` | Access token has expired — client should refresh |
| 401 | `TOKEN_REVOKED` | Token was explicitly revoked (logged out) |
| 403 | `FORBIDDEN_ROLE` | User's role does not permit this action |
| 403 | `FORBIDDEN_SCOPE` | Action is outside user's institution/dept/course scope |
| 404 | `NOT_FOUND` | Requested resource does not exist in user's scope |
| 409 | `ALREADY_EXISTS` | Duplicate resource (e.g., duplicate username) |
| 423 | `ACCOUNT_LOCKED` | Too many failed login attempts |
| 429 | `RATE_LIMITED` | Too many requests — includes `Retry-After` header |
| 500 | `AGENT_FAILED` | AI agent returned an error or timed out |
| 500 | `DATABASE_ERROR` | PostgreSQL query failed |
| 503 | `SERVICE_UNAVAILABLE` | Dependency (Redis, MinIO, AI Engine) is unreachable |

## Retry Logic for Agent Jobs

Agent jobs (background tasks) follow this retry policy:

| Failure type | Retry count | Backoff | Final action |
|---|---|---|---|
| Claude API timeout (>30s) | 1 | Immediate | Mark job FAILED |
| Gemini API timeout (>30s) | 1 | Immediate | Mark job FAILED |
| FAISS retrieval error | 0 | — | Proceed with BM25+Neo4j only |
| Neo4j unavailable | 0 | — | Proceed with FAISS+BM25 only |
| PostgreSQL connection error | 3 | 1s, 2s, 4s (exponential) | Mark job FAILED, alert admin |
| MinIO PUT failure | 2 | 5s, 10s | Return error to client |

## Global Exception Handler

```python
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    request_id = request.state.request_id
    
    logger.error(
        "Unhandled exception",
        request_id=request_id,
        endpoint=str(request.url),
        error=str(exc),
        traceback=traceback.format_exc()
    )
    
    return JSONResponse(
        status_code=500,
        content={"error": {
            "code": "INTERNAL_ERROR",
            "message": "An unexpected error occurred. Reference ID: " + request_id,
            "request_id": request_id
        }}
    )
```

## Escalation for Repeated Failures

If the same agent job type fails more than 5 times in 1 hour for the same institution:
1. `agent_failure_alert` row is inserted
2. Institution Admin receives in-platform notification
3. Super Admin receives email summary at end of day

If PostgreSQL becomes completely unreachable:
1. FastAPI returns 503 on all requests
2. Health check endpoint returns `{ "status": "error" }`
3. Super Admin is emailed immediately (if SMTP is operational)
