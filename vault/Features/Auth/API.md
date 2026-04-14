# Auth & Security: API Reference

The authentication layer follows a strict RESTful pattern with enhanced security metadata.

## 🔑 Endpoints

### 1. `POST /auth/login`
Authenticates a user and returns a session token.
- **Support**: Multi-identifier (Email, Roll Number, Employee ID).
- **Security**: L5 Sentinel rate limiting.
- **Output**: JWT `access_token`, `token_type`, and `user` metadata.

### 2. `POST /auth/register`
Creates a user record across multiple tables.
- **Roles**: `student`, `teacher`, `admin`, `parent`.
- **Special Logic**: Generates `parent_link_code` for student roles.
- **Table Persistence**: Writes to `users`, `learner_profiles`, and role-specific tables (e.g., `student_profiles`).

### 3. `GET /auth/me`
Retrieves the current authenticated user's profile.
- **Middleware**: Requires `JWTBearer`.
- **Enrichment**: Resolves roles and onboarding status.

### 4. `POST /auth/logout`
Invalidates the current session.
- **Client Action**: Clears `useAuthStore` and local storage.

## 📦 Request Schemas (Pydantic)
- `LoginRequest`: `identifier` (str), `password` (str).
- `RegisterRequest`: `email`, `password`, `full_name`, `role`, and optional role fields (roll_number, empid).

---
[[Auth/Overview]] | [[Auth/Backend]] | [[Auth/Frontend]] | [[Auth/Flow]]
