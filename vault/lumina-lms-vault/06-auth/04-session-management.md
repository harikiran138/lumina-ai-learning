# Session Management

> **File:** `06-auth/04-session-management.md`
> **Related:** [[06-auth/03-jwt-flow]], [[06-auth/01-auth-overview]]
> **Last Updated:** 2026-04-15

How Redis manages sessions, TTLs, concurrency limits, and logout state.

---

## Redis Key Schema

| Key pattern | Type | TTL | Purpose |
|---|---|---|---|
| `refresh:{user_id}` | string (hash of refresh token) | 30 days | Active refresh token tracking |
| `revoked_jti:{jti}` | string | Remaining access token TTL | Logout revocation list |
| `login_attempts:{identifier}` | integer | 15 minutes | Brute-force counter |
| `account_locked:{user_id}` | string | 30 minutes | Locked account flag |
| `queue_count:{user_id}` | integer | No expiry (managed by app) | AI queue badge count for Teacher/Faculty |
| `rate_limit:{user_id}:{endpoint}` | integer | 60 seconds | Per-user per-endpoint rate limit |

## Concurrent Session Policy

Lumina allows a user to have multiple concurrent sessions (e.g., logged in on phone and laptop simultaneously). Each session has its own access token with its own `jti`. When the user logs out on one device, only that `jti` is revoked — other sessions remain active.

If an Institution Admin requires single-session-only for a user (security policy), IA can enable `single_session_mode` on that user's account. In this mode, issuing a new refresh token automatically deletes the old one from Redis, which invalidates the previous session.

## Idle Session Handling

There is no server-side idle timeout. The access token expires after 60 minutes regardless of activity. The client is responsible for refreshing before expiry. The Next.js frontend checks token expiry 5 minutes before the access token expires and silently calls `POST /api/auth/refresh` to get a new one.

## Brute-Force Protection

```
On each failed login attempt:
  INCR login_attempts:{identifier}
  EXPIRE login_attempts:{identifier} 900  (15 minutes)

After 5 failures within 15 minutes:
  SET account_locked:{user_id} "1" EX 1800  (30 minutes)
  INSERT login_attempts (user_id, ip, failed=true, locked=true, timestamp)
  
On each login attempt, before password check:
  GET account_locked:{user_id}
  If exists → 423 Locked { unlock_at: now + remaining_TTL }
```

## Rate Limiting

Per-user per-endpoint rate limits are enforced via Redis:

| Endpoint category | Limit |
|---|---|
| Auth endpoints (login, refresh) | 10 req/minute |
| Queue submission (`/api/queue/submit`) | 5 req/minute per student |
| File upload initiation | 3 req/minute |
| All other endpoints | 60 req/minute |

Rate limit violations return `HTTP 429 Too Many Requests` with `Retry-After` header.
