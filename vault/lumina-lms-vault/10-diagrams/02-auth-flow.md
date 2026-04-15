# Auth Flow Diagram

> **File:** `10-diagrams/02-auth-flow.md`
> **Related:** [[06-auth/03-jwt-flow]], [[06-auth/04-session-management]]
> **Last Updated:** 2026-04-15

Mermaid sequence diagrams for the complete authentication lifecycle.

---

## Login Flow

```mermaid
sequenceDiagram
    participant C as Client (Browser)
    participant FE as Next.js Frontend
    participant BE as FastAPI Backend
    participant DB as PostgreSQL
    participant RD as Redis

    C->>FE: Enters identifier + password
    FE->>BE: POST /api/auth/login { identifier, password }

    BE->>RD: GET account_locked:{identifier}
    alt Account locked
        BE->>C: 423 { unlock_at }
    end

    BE->>DB: SELECT users WHERE username=identifier AND institution_id=...
    alt User not found
        BE->>RD: INCR login_attempts:{identifier} EX 900
        BE->>C: 401 Invalid credentials
    end

    BE->>BE: bcrypt.verify(password, password_hash)
    alt Password wrong
        BE->>RD: INCR login_attempts:{identifier}
        alt Attempts >= 5
            BE->>RD: SET account_locked:{user_id} EX 1800
        end
        BE->>DB: INSERT login_attempts (failed=true)
        BE->>C: 401 Invalid credentials
    end

    BE->>BE: Generate access_token (JWT, jti=uuid, exp=60min)
    BE->>BE: Generate refresh_token (JWT, exp=30d)
    BE->>RD: SET refresh:{user_id} = hash(refresh_token) EX 2592000
    BE->>DB: INSERT login_history (user_id, ip, success=true)
    BE->>RD: DEL login_attempts:{identifier}

    BE->>C: 200 OK\nSet-Cookie: access_token (HttpOnly, 60min)\nSet-Cookie: refresh_token (HttpOnly, 30d)\nBody: { user_id, role, name }
```

---

## Token Refresh Flow

```mermaid
sequenceDiagram
    participant FE as Next.js Frontend
    participant BE as FastAPI Backend
    participant RD as Redis

    Note over FE: Detects access_token expires in < 5 min
    FE->>BE: POST /api/auth/refresh\n(Cookie: refresh_token)

    BE->>BE: Decode refresh_token (verify signature + expiry)
    alt Refresh token expired
        BE->>FE: 401 → redirect to login
    end

    BE->>RD: GET refresh:{user_id}
    alt Hash mismatch (token reuse attack)
        BE->>RD: DEL refresh:{user_id}
        BE->>FE: 401 → force re-login
    end

    BE->>BE: Generate new access_token (new jti, new exp)
    BE->>FE: 200 Set-Cookie: access_token (new, 60min)
```

---

## Logout Flow

```mermaid
sequenceDiagram
    participant C as Client
    participant BE as FastAPI Backend
    participant RD as Redis

    C->>BE: POST /api/auth/logout\n(Cookie: access_token)

    BE->>BE: Decode access_token → extract jti, remaining TTL
    BE->>RD: SET revoked_jti:{jti} "1" EX {remaining_TTL}
    BE->>RD: DEL refresh:{user_id}

    BE->>C: 200\nSet-Cookie: access_token (Max-Age=0)\nSet-Cookie: refresh_token (Max-Age=0)
```

---

## Role-Scoped Request Validation

```mermaid
flowchart TD
    A[Incoming Request] --> B{Cookie: access_token present?}
    B -- No --> Z1[401 Not Authenticated]
    B -- Yes --> C{JWT signature valid?}
    C -- No --> Z2[401 Invalid Token]
    C -- Yes --> D{JWT expired?}
    D -- Yes --> Z3[401 Token Expired]
    D -- No --> E{jti in Redis revoked set?}
    E -- Yes --> Z4[401 Token Revoked]
    E -- No --> F[Extract role, institution_id, dept_id, course_ids]
    F --> G{Role in allowed_roles for endpoint?}
    G -- No --> Z5[403 Forbidden Role]
    G -- Yes --> H{Resource within user scope?}
    H -- No --> Z6[403 Forbidden Scope]
    H -- Yes --> I[Execute handler with scoped context]
    I --> J[SQL query always includes WHERE institution_id=:id]
```
