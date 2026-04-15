# Auth Overview

> **File:** `06-auth/01-auth-overview.md`
> **Related:** [[06-auth/02-rbac]], [[06-auth/03-jwt-flow]], [[06-auth/04-session-management]]
> **Last Updated:** 2026-04-15

End-to-end authentication system for Lumina — JWT-based, Redis-backed, with role-based access control enforced at the FastAPI SQL layer.

---

## Auth Strategy

Lumina uses **JWT (JSON Web Token)** authentication. There is no OAuth or SSO integration in the base system — authentication is handled entirely by Lumina's own FastAPI backend using email/password (for staff) or hall_ticket/password (for students).

Every JWT contains:
- `user_id` (UUID)
- `institution_id` (UUID)
- `role` (string — one of the 11 roles)
- `department_id` (UUID or null — for role-scoped roles)
- `course_ids` (list of UUIDs — for Teacher role only)
- `iat` (issued at)
- `exp` (expiry)

## Token Lifetimes

| Token | TTL | Storage |
|---|---|---|
| Access token | 60 minutes | HttpOnly cookie (SameSite=Strict) |
| Refresh token | 30 days | HttpOnly cookie + Redis |
| Super Admin access token | 15 minutes | HttpOnly cookie (non-renewable without re-auth) |

## Login Identifiers by Role

| Role | Login identifier | Password field |
|---|---|---|
| Student | Hall ticket number (e.g., `22NU1A0519`) | Password |
| Teacher / Faculty / HOD | Email address | Password |
| Institution Admin | Email address | Password |
| Super Admin | Email address | Password |
| All others | Email address | Password |

## Password Rules

- Minimum 8 characters
- Must contain at least one uppercase letter, one number, and one special character
- Stored as bcrypt hash, cost factor 12
- Brute-force protection: 5 failed attempts within 15 minutes → account temporarily locked for 30 minutes; event logged to `login_attempts`

## Demo Login Shortcuts (Development Only)

In the development environment only, demo accounts exist with pre-set credentials:

| Role | Identifier | Password |
|---|---|---|
| Student (CSE, Year 3) | `22NU1A0519` | `student@123` |
| Faculty (HOD, CSE) | `FAC001` | `faculty@123` |
| Institution Admin | `admin@nsrit.edu.in` | `admin@123` |
| Super Admin | `root@lumina.ai` | `super@123` |

These accounts do NOT exist in production. `DEMO_MODE=true` environment variable is required to enable them.

## Security Headers

All API responses include:
- `X-Content-Type-Options: nosniff`
- `X-Frame-Options: DENY`
- `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- `Content-Security-Policy: default-src 'self'`
