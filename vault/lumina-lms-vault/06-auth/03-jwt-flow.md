# JWT Flow

> **File:** `06-auth/03-jwt-flow.md`
> **Related:** [[06-auth/01-auth-overview]], [[06-auth/04-session-management]]
> **Last Updated:** 2026-04-15

Token issuance, validation, refresh, and revocation for Lumina's JWT-based auth.

---

## Login Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant BE as FastAPI
    participant DB as PostgreSQL
    participant RD as Redis

    C->>BE: POST /api/auth/login { identifier, password }
    BE->>DB: SELECT user WHERE username=identifier AND institution_id=...
    DB->>BE: user row (password_hash, role, status)
    BE->>BE: bcrypt.verify(password, password_hash)
    
    alt Invalid credentials
        BE->>DB: INSERT login_attempts (failed)
        BE->>C: 401 Unauthorized
    else Account locked
        BE->>C: 423 Locked { unlock_at }
    else Success
        BE->>BE: Generate access_token (JWT, 60min)
        BE->>BE: Generate refresh_token (JWT, 30d)
        BE->>RD: SET refresh:{user_id} = refresh_token_hash TTL=30d
        BE->>DB: INSERT login_history (user_id, ip, user_agent, timestamp)
        BE->>C: 200 OK
               Set-Cookie: access_token=...; HttpOnly; SameSite=Strict; Secure
               Set-Cookie: refresh_token=...; HttpOnly; SameSite=Strict; Secure
               Body: { user_id, role, name, institution_id }
    end
```

## JWT Payload Structure

```json
{
  "user_id": "uuid",
  "institution_id": "uuid",
  "role": "teacher",
  "department_id": "uuid|null",
  "course_ids": ["uuid", "uuid"],
  "name": "string",
  "iat": 1713200000,
  "exp": 1713203600,
  "jti": "uuid (JWT ID — for revocation)"
}
```

## Token Validation (Every Protected Request)

```python
async def verify_jwt(
    access_token: str = Cookie(None),
    db: AsyncSession = Depends(get_db),
    redis: Redis = Depends(get_redis)
) -> TokenPayload:
    if not access_token:
        raise HTTPException(401, "Not authenticated")
    
    try:
        payload = jwt.decode(access_token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
    except jwt.ExpiredSignatureError:
        raise HTTPException(401, "Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")
    
    # Check if token has been revoked (logout)
    revoked = await redis.get(f"revoked_jti:{payload['jti']}")
    if revoked:
        raise HTTPException(401, "Token has been revoked")
    
    return TokenPayload(**payload)
```

## Token Refresh Flow

```
POST /api/auth/refresh
Cookie: refresh_token=<token>

1. Decode refresh token (verify signature and expiry)
2. Check Redis: GET refresh:{user_id} == hash(refresh_token) → must match
3. Issue new access token (new jti, new iat, new exp)
4. Return new access token in Set-Cookie header
5. Refresh token itself is NOT rotated (30d fixed window)
```

## Logout / Revocation

```
POST /api/auth/logout
Cookie: access_token=<token>

1. Decode access token to get jti and remaining TTL
2. SET Redis revoked_jti:{jti} = "1" EX <remaining_TTL_seconds>
3. DEL Redis refresh:{user_id}
4. Clear both cookies (Set-Cookie with Max-Age=0)
5. Return 200 OK
```

Revocation uses the `jti` (JWT ID) stored in Redis with the token's remaining TTL as expiry. The revoked key auto-expires when the token would have expired anyway, so Redis doesn't grow unboundedly.

## Super Admin Special Rules

Super Admin tokens have a 15-minute TTL and cannot be refreshed automatically. Re-authentication is required every 15 minutes. SA tokens also require the originating IP to match the IP allowlist stored in `super_admin_ip_allowlist`. If the IP does not match, the request is rejected even with a valid token.
