# Role-Based Access Control

> **File:** `06-auth/02-rbac.md`
> **Related:** [[06-auth/01-auth-overview]], [[02-roles/06-role-permissions-matrix]], [[06-auth/03-jwt-flow]]
> **Last Updated:** 2026-04-15

How Lumina enforces role-based access at every layer — JWT claim, FastAPI dependency, and SQL WHERE clause.

---

## Three-Layer Enforcement

RBAC in Lumina is enforced at three independent layers. A failure at any one layer should be caught by the next.

**Layer 1 — JWT claim check (FastAPI dependency)**
Every protected route has a `Depends(require_role(...))` parameter that checks the `role` field in the validated JWT.

**Layer 2 — Scope check (FastAPI dependency)**
After role is verified, `institution_id` (and optionally `department_id` or `course_ids`) is extracted from the JWT. All subsequent database queries use these values as WHERE clause parameters.

**Layer 3 — SQL WHERE clause (database query)**
The actual SQL query always includes `institution_id = :institution_id`. For more specific roles (Teacher), it also includes `course_id IN (:course_ids)`.

## FastAPI Role Dependencies

```python
from fastapi import Depends, HTTPException, status
from functools import wraps

def require_role(*allowed_roles: str):
    """Dependency factory that checks JWT role against allowed roles."""
    async def check_role(token_data: TokenPayload = Depends(verify_jwt)):
        if token_data.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Role '{token_data.role}' is not permitted to access this endpoint"
            )
        return token_data
    return check_role

# Usage examples
@router.get("/queue")
async def get_queue(
    token: TokenPayload = Depends(require_role("teacher", "faculty", "hod"))
):
    ...

@router.post("/admin/users")
async def create_user(
    token: TokenPayload = Depends(require_role("institution_admin", "hod", "super_admin"))
):
    ...

@router.get("/researcher/export")
async def export_data(
    token: TokenPayload = Depends(require_role("researcher"))
):
    ...
```

## Role Strings (exact values in JWT and database)

| Role | JWT `role` value |
|---|---|
| Super Admin | `super_admin` |
| Institution Admin | `institution_admin` |
| HOD | `hod` |
| Faculty | `faculty` |
| Teacher | `teacher` |
| Student | `student` |
| Mentor | `mentor` |
| Peer Tutor | `peer_tutor` |
| Counselor | `counselor` |
| Parent / Guardian | `parent` |
| Researcher | `researcher` |

## Scope Extraction Pattern

```python
async def get_scoped_context(
    token: TokenPayload = Depends(verify_jwt)
) -> ScopedContext:
    """Extract all scoping identifiers from JWT for use in SQL queries."""
    return ScopedContext(
        user_id=token.user_id,
        institution_id=token.institution_id,
        role=token.role,
        department_id=token.department_id,       # None for student, parent, researcher
        course_ids=token.course_ids,             # Only populated for teacher role
    )
```

## Endpoint-to-Role Mapping (Key Routes)

| Endpoint | Allowed roles |
|---|---|
| `POST /api/auth/login` | Public |
| `POST /api/auth/logout` | All authenticated |
| `GET /api/courses` | All authenticated |
| `POST /api/courses` | teacher |
| `POST /api/queue/submit` | student |
| `GET /api/queue` | teacher, faculty, hod |
| `POST /api/queue/{id}/approve` | teacher, faculty, hod |
| `POST /api/queue/{id}/escalate` | teacher, faculty |
| `GET /api/analytics/dropout` | teacher, faculty, hod, institution_admin |
| `GET /api/analytics/dropout/shap` | teacher, faculty, hod |
| `GET /api/admin/users` | institution_admin, super_admin |
| `POST /api/admin/users` | institution_admin, hod, super_admin |
| `GET /api/parent/child/{id}` | parent |
| `GET /api/researcher/export` | researcher |
| `POST /api/admin/institutions` | super_admin |

## What Happens on Role Violation

1. FastAPI dependency raises `HTTP 403 Forbidden`
2. Response body: `{ "detail": "Role 'student' is not permitted to access this endpoint" }`
3. Event logged to `access_violation_log` with: `user_id`, `role`, `endpoint`, `timestamp`, `institution_id`
4. If the same user triggers 10 violations in 1 hour: flag account for IA review in `security_alerts`
