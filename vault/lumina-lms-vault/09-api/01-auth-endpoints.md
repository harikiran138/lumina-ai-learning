# Auth Endpoints

> **File:** `09-api/01-auth-endpoints.md`
> **Related:** [[09-api/00-api-overview]], [[06-auth/03-jwt-flow]]
> **Last Updated:** 2026-04-15

All authentication and session management endpoints.

---

## POST /api/auth/login

Login and receive JWT tokens as HttpOnly cookies.

**Authentication required:** No

**Request body:**
```json
{
  "identifier": "string (hall_ticket or email)",
  "password": "string"
}
```

**Response (200):**
```json
{
  "data": {
    "user_id": "uuid",
    "name": "string",
    "role": "string",
    "institution_id": "uuid",
    "institution_name": "string"
  }
}
```
Sets cookies: `access_token` (60min), `refresh_token` (30d), both HttpOnly SameSite=Strict.

**Response (401):** Invalid credentials
**Response (423):** Account locked — `{ "error": { "code": "ACCOUNT_LOCKED", "unlock_at": "datetime" } }`

**Side effects:** Inserts row into `login_history`; increments `login_attempts:{identifier}` in Redis on failure.

**Example curl:**
```bash
curl -X POST http://localhost:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"identifier": "22NU1A0519", "password": "student@123"}' \
  -c cookies.txt
```

---

## POST /api/auth/logout

Revoke the current session.

**Authentication required:** Yes (any role)

**Request body:** None

**Response (200):**
```json
{ "data": { "message": "Logged out successfully" } }
```
Revokes current `jti` in Redis. Clears both cookies (Max-Age=0).

---

## POST /api/auth/refresh

Exchange refresh token for new access token.

**Authentication required:** Refresh token cookie

**Request body:** None

**Response (200):** New `access_token` cookie set. Body same shape as login response.

**Response (401):** Refresh token expired or revoked.

---

## POST /api/auth/set-password

Set password for a newly created account (first-time activation).

**Authentication required:** No (uses one-time activation token)

**Request body:**
```json
{
  "activation_token": "uuid (from email link)",
  "new_password": "string (min 8 chars, 1 uppercase, 1 number, 1 special)"
}
```

**Response (200):**
```json
{ "data": { "message": "Password set. You may now log in." } }
```

**Response (400):** Token expired (48h TTL) or already used.

---

## POST /api/auth/change-password

Change password for an authenticated user.

**Authentication required:** Yes (any role)

**Request body:**
```json
{
  "current_password": "string",
  "new_password": "string"
}
```

**Response (200):** Success. All existing sessions revoked (user must log in again on all devices).

**Response (401):** Current password incorrect.

---

## GET /api/auth/me

Get the authenticated user's profile.

**Authentication required:** Yes (any role)

**Response (200):**
```json
{
  "data": {
    "user_id": "uuid",
    "name": "string",
    "email": "string",
    "role": "string",
    "institution_id": "uuid",
    "institution_name": "string",
    "department_id": "uuid|null",
    "profile_photo_url": "string|null"
  }
}
```
