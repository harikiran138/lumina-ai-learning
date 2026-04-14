# LUMINA_INDUSTRY_READINESS_VERIFICATION

Audit date: 2026-03-30

Audit basis: repository inspection plus direct command execution from the project root. All commands below are copy-pasteable from the root of this repository.

## SECTION 1 — TypeScript compilation

1. Requirement and why it matters
   `tsc --noEmit` must exit with code `0` and produce zero output across the entire frontend codebase, including tests and mocks. This matters because a production LMS cannot ship with type drift in test harnesses, mocks, or app code; stale test-only types often hide real contract breakages in auth, routing, and onboarding flows.

2. Exact verification command
   ```bash
   cd frontend/web && npx tsc --noEmit 2>&1
   ```

3. Pass/fail criteria
   Pass: exit code `0` and no output.
   Fail: any non-zero exit code or any TypeScript error output.

4. Current Lumina status
   FAIL. Executed during this audit and exited with code `1`. Current errors are concentrated in test and mock files, including `src/__tests__/mocks/handlers.ts`, `src/__tests__/roles/admin-dashboard.test.tsx`, `src/__tests__/roles/student-dashboard.test.tsx`, `src/__tests__/roles/teacher-dashboard.test.tsx`, and `src/__tests__/roles/shared-behavior.test.tsx`. This matches the existing warning that pre-existing test/mock errors still block production readiness.

## SECTION 2 — Backend pytest suite

1. Requirement and why it matters
   All backend tests must pass with no failures or errors. For a multi-role LMS, backend regressions in auth, onboarding, course access, and dashboard permissions immediately become data integrity or access-control issues in production.

2. Exact verification commands
   ```bash
   python -m pytest backend/tests/ -v --tb=short 2>&1
   ```
   ```bash
   python -m pytest backend/tests/test_auth_token_flow.py backend/tests/test_onboarding_flow.py -v --tb=short 2>&1
   ```

3. Pass/fail criteria
   Pass: `0` failures and `0` errors.
   Fail: any failure or any error.

4. Current Lumina status
   FAIL. The targeted run finished at `1 failed, 6 passed`; `backend/tests/test_auth_token_flow.py::test_refresh_reissues_access_cookie` fails with `401` instead of `200`. The full suite finished at `5 failed, 60 passed`. Additional failures are `backend/tests/test_auth_routes.py::test_register`, `backend/tests/test_auth_routes.py::test_duplicate_email`, `backend/tests/test_course_routes.py::test_create_course`, and `backend/tests/test_course_routes.py::test_delete_course`. `backend/tests/test_student_onboarding.py` does not exist in this repo.

## SECTION 3 — Frontend unit + integration tests

1. Requirement and why it matters
   All Vitest tests must pass. Frontend unit and integration coverage is the fastest way to catch broken auth flows, middleware redirects, onboarding form validation, and session persistence before they become visible to users.

2. Exact verification command
   ```bash
   cd frontend/web && npm test -- --run 2>&1
   ```

3. Pass/fail criteria
   Pass: all test files green and `0` failed tests.
   Fail: any failed test file or any failed test.

4. Current Lumina status
   FAIL. Executed during this audit and finished at `3 failed | 10 passed` test files and `5 failed | 304 passed` tests. Required coverage status:
   `src/__tests__/lib/student-onboarding.test.ts`: present and passing.
   `src/__tests__/integration/auth-flow.test.tsx`: present but failing; the login/session persistence test times out.
   `src/__tests__/integration/middleware.test.ts`: present and passing.
   Additional failures remain in `src/__tests__/auth.test.ts` and `src/__tests__/lib/api.test.ts`, both still expecting the old cookie/session behavior.

## SECTION 4 — E2E role routing tests (Playwright)

1. Requirement and why it matters
   Every role must land on the correct dashboard after login with no redirect loops or `404`s. In a 12-role institution-aware LMS, role routing is a primary access-control boundary; wrong landing pages create both security and operational failures.

2. Exact verification command
   ```bash
   cd frontend/web && npm run test:e2e -- e2e/role-route-aliases.spec.ts 2>&1
   ```

3. Pass/fail criteria
   Pass: all 12 roles below land on the exact destination with HTTP `200` and no redirect loop.
   Fail: any `404`, any infinite redirect, any wrong destination, or any test infrastructure failure.

   Required role map:
   `super_admin` -> `/admin/dashboard`
   `college_admin` -> `/college`
   `hod` -> `/hod/dashboard`
   `faculty` -> `/faculty/dashboard`
   `teacher` alias -> `/faculty/dashboard`
   `student` -> `/student/dashboard`
   `parent` -> `/parent/dashboard`
   `mentor` -> `/mentor/dashboard`
   `peer_tutor` -> `/peer_tutor/dashboard`
   `peer-tutor` alias -> `/peer_tutor/dashboard`
   `counselor` -> `/counselor/dashboard`
   `content_creator` -> `/content_creator/dashboard`
   `researcher` -> `/researcher/dashboard`
   `alumni` -> `/alumni/dashboard`

4. Current Lumina status
   FAIL. The repo does contain `frontend/web/e2e/role-route-aliases.spec.ts`, but it only covers four alias redirects: `teacher`, `peer-tutor`, legacy `content_creator/studio`, and legacy `researcher/portal`. The command executed during this audit failed before the spec could run: Playwright timed out waiting for the web server (`Timed out waiting 120000ms from config.webServer`). The current E2E asset does not yet prove all 12 role destinations.

## SECTION 5 — Auth security tests

Overall section status: FAIL. Some protections are implemented in code, but the full security suite requested here is not present and was not demonstrated green end-to-end.

### 5a. Brute-force lockout

1. Requirement and why it matters
   After five bad login attempts for the same identifier, the next attempt must lock the identifier and force a cool-down window. This matters because production LMS login endpoints are a credential-stuffing target.

2. Exact verification command
   ```bash
   python -m pytest backend/tests/test_auth_security.py -v --tb=short -k brute_force_lockout 2>&1
   ```

3. Pass/fail criteria
   Pass: wrong password attempts `1-5` return `401`, attempt `6+` returns `423`, and login succeeds again after the timeout or mocked time jump.
   Fail: no lockout, wrong status code, or no unlock after timeout.

4. Current Lumina status
   FAIL. Backend code for lockout exists in `backend/app/routers/auth.py` using `login_attempts`, `_LOCK_THRESHOLD = 5`, `_LOCK_MINUTES = 15`, and HTTP `423`, but there is no dedicated passing test in `backend/tests/` proving the end-to-end behavior.

### 5b. `SECURE_COOKIES` enforcement

1. Requirement and why it matters
   Production must never start with insecure cookies disabled. This matters because auth cookies carrying LMS session state must be marked `Secure` in production.

2. Exact verification command
   ```bash
   ENVIRONMENT=production SECURE_COOKIES=false PYTHONPATH=backend python -c "import app.main" 2>&1
   ```

3. Pass/fail criteria
   Pass: process exits non-zero with a `RuntimeError` saying `SECURE_COOKIES must be True in production`.
   Fail: app imports or starts successfully.

4. Current Lumina status
   PASS by code inspection. `backend/app/main.py` contains:
   `if os.getenv("ENVIRONMENT") == "production" and not settings.SECURE_COOKIES: raise RuntimeError("SECURE_COOKIES must be True in production")`.

### 5c. `sessionStorage` token absence

1. Requirement and why it matters
   Auth tokens must not be stored in browser-accessible `sessionStorage`. This matters because XSS turns browser storage into credential exfiltration.

2. Exact verification command
   ```bash
   cd frontend/web && npm run test:e2e -- e2e/auth-security.spec.ts --grep "sessionStorage token absence" 2>&1
   ```

3. Pass/fail criteria
   Pass: `sessionStorage.getItem('lumina_token') === null`.
   Fail: any token value is present.

4. Current Lumina status
   PASS by implementation, FAIL by audit section gate. The current frontend auth client no longer writes `lumina_token` during login, and the failing Vitest auth tests explicitly assert `sessionStorage.getItem('lumina_token')` is `null`. However, there is no dedicated passing Playwright proof in this audit run.

### 5d. HttpOnly cookie verification

1. Requirement and why it matters
   The `access_token` cookie must be `HttpOnly` and `SameSite=Strict`. This matters because LMS sessions should not be readable from JavaScript and should resist cross-site request leakage.

2. Exact verification command
   ```bash
   python -m pytest backend/tests/test_auth_security.py -v --tb=short -k httponly_cookie 2>&1
   ```

3. Pass/fail criteria
   Pass: `Set-Cookie` includes `HttpOnly` and `SameSite=Strict`.
   Fail: either flag is missing.

4. Current Lumina status
   PASS by code inspection. `backend/app/routers/auth.py` sets `httponly=True` and `samesite="strict"` for both `access_token` and `refresh_token`.

### 5e. Unauthorized access blocked

1. Requirement and why it matters
   Unauthenticated requests to `/api/auth/me` must be rejected. This matters because identity and role data cannot leak to anonymous callers.

2. Exact verification command
   ```bash
   python -m pytest backend/tests/test_api_contracts.py -v --tb=short -k auth_me_unauthenticated 2>&1
   ```

3. Pass/fail criteria
   Pass: HTTP `401`.
   Fail: `200` or any user data returned.

4. Current Lumina status
   PASS by code inspection, FAIL by audit section gate. `backend/app/routers/auth.py` raises `401` when no token is present. Existing tests cover authenticated `/api/auth/me`, but there is no dedicated passing unauthenticated contract test in the current suite.

### 5f. Wrong-role path blocked

1. Requirement and why it matters
   A logged-in student must not be able to render admin content. This matters because role-based route isolation is part of the LMS security model.

2. Exact verification command
   ```bash
   cd frontend/web && npm run test:e2e -- e2e/auth-security.spec.ts --grep "wrong role path blocked" 2>&1
   ```

3. Pass/fail criteria
   Pass: student navigation to `/admin/dashboard` redirects to `/student/dashboard`.
   Fail: admin content renders for the student.

4. Current Lumina status
   FAIL. Middleware logic exists in `frontend/web/src/middleware.ts` and should redirect based on role/path ownership, but no passing browser test proves it today, and the current Playwright harness is already red.

## SECTION 6 — Student onboarding data integrity tests

1. Requirement and why it matters
   Each onboarding step must write the correct data to the correct tables and reject invalid step order. In a production LMS, onboarding is not cosmetic; it establishes identity, institution linkage, subject enrollment, and learner profile state.

2. Exact verification command
   ```bash
   python -m pytest backend/tests/test_student_onboarding_integrity.py -v --tb=short 2>&1
   ```

3. Pass/fail criteria
   Pass: every step below proves both API success and exact DB writes, and step skipping returns HTTP `409`.
   Fail: any missing DB write, wrong table, wrong row count, or invalid sequence accepted.

4. Current Lumina status
   FAIL. Existing coverage in `backend/tests/test_onboarding_flow.py` proves a good portion of the happy path:
   step order gating returns `409`,
   enrollment code validation resolves department/batch mapping,
   subject selection writes `student_subjects`,
   completion creates `learner_profiles`, `skill_mastery`, and moves `users.onboarding_step` to `5`.
   However, the repo does not contain the exact integrity suite requested here, there is no `backend/tests/test_student_onboarding.py`, and the current tests do not assert every DB field listed in 6a-6e with the exact table-level checks required for sign-off.

## SECTION 7 — API contract tests

1. Requirement and why it matters
   Core API endpoints must return the correct status codes and response shapes for valid requests and must reject bad input, unauthenticated access, and wrong-role access. This matters because frontend/backend drift causes production breakage faster than almost any other category in a role-heavy LMS.

2. Exact verification command
   ```bash
   python -m pytest backend/tests/test_api_contracts.py -v --tb=short 2>&1
   ```

3. Pass/fail criteria
   Pass: every listed endpoint has explicit tests for `(a)` valid request, `(b)` malformed input, `(c)` unauthenticated request, and `(d)` wrong role.
   Fail: any endpoint missing from the matrix, any missing branch, or any unexpected status/shape.

4. Current Lumina status
   FAIL. The current repo has partial endpoint coverage, not the full contract matrix requested here. There are also contract mismatches:
   `/api/faculty/dashboard` is not present as an exact backend route; the repo exposes `/api/faculty/dashboard/summary`.
   Existing backend tests do not provide one centralized contract suite for all listed endpoints and branches.
   Current suite failures already show drift in auth registration expectations (`422` vs expected `201`/`400`) and course-route authorization (`403` vs expected `200`).

## SECTION 8 — Zod and Pydantic validation alignment

1. Requirement and why it matters
   Frontend Zod schemas and backend Pydantic models must enforce identical rules for shared fields. This matters because mismatched validation causes confusing UX, inconsistent API behavior, and hidden data-quality defects.

2. Exact verification command
   ```bash
   rg -n "studentPersonalSchema|studentEnrollmentSchema|studentPreferencesSchema|registerSchema" frontend/web/src/lib/student-onboarding.ts frontend/web/src/lib/schemas/auth.ts -S && rg -n "class StudentPersonalDetailsRequest|class StudentEnrollmentRequest|class StudentPreferencesRequest|class UserCreate" backend/app/routers/onboarding.py backend/app/routers/auth.py -S
   ```

3. Pass/fail criteria
   Pass: the frontend and backend declare equivalent rules for every shared field.
   Fail: any mismatch in requiredness, enum membership, length, format, or semantic constraint.

4. Current Lumina status
   FAIL. Current alignment audit:

   | Field | Frontend Zod rule | Backend rule in repo | Match? | Fix |
   |---|---|---|---|---|
   | `first_name` | `min(2)` | `StudentPersonalDetailsRequest.first_name: str`; min length enforced only later in `_validate_required_text` | NO | Add `Field(min_length=2)` or `field_validator` to the Pydantic model |
   | `last_name` | `min(2)` | same as above | NO | Add `Field(min_length=2)` or `field_validator` |
   | `date_of_birth` | non-empty string only | `str`; ISO/past enforced only later in `_validate_date_of_birth` | NO | Frontend: add ISO-date and past-date Zod refinement. Backend: move rule into Pydantic validator |
   | `phone_number` | strip non-digits, require 8-15 digits | `str`; 8-15 digit rule enforced only later in `_validate_phone` | NO | Add a Pydantic validator mirroring the frontend normalization rule |
   | `email` | `.email()` | onboarding model uses plain `str`; auth register uses `EmailStr` | NO | Change onboarding request email field to `EmailStr` |
   | `password` | min 8, uppercase, number | `Field(min_length=8)` plus password complexity validator in `UserCreate` | YES | No change required |
   | `enrollment_code` | required, `min(4)` | `StudentEnrollmentRequest.enrollment_code: str` required only | NO | Add `Field(min_length=1)` at minimum; ideally align exact minimum rule |
   | `learning_styles` | array min 1 | `List[str]`; min item count enforced later in route | NO | Add `Field(min_length=1)` or Pydantic list validator |
   | `self_assessment` | enum `beginner/intermediate/advanced` | `str`; enum enforced later in route | NO | Replace with `Literal["beginner","intermediate","advanced"]` or Enum |

## SECTION 9 — Load and performance baseline

1. Requirement and why it matters
   Core endpoints must remain responsive under realistic concurrent load. A production LMS cannot degrade into login failure, dashboard stalls, or onboarding timeouts under cohort spikes.

2. Exact verification commands
   Login baseline:
   ```bash
   k6 run performance/k6/login-baseline.js
   ```
   Student dashboard baseline:
   ```bash
   k6 run performance/k6/student-dashboard-baseline.js
   ```
   Onboarding step 1 baseline:
   ```bash
   k6 run performance/k6/onboarding-step1-baseline.js
   ```

3. Pass/fail criteria
   `9a`: `p95 < 500ms`, `0%` error rate at `50` concurrent users for `60s`.
   `9b`: `p95 < 800ms`, `0%` error rate at `100` authenticated students.
   `9c`: `p95 < 600ms`, `0%` error rate at `30` concurrent submissions.

4. Current Lumina status
   FAIL as a warning-only section. The repo contains a Locust reference in `Makefile`, but no committed k6 baseline scripts, no recorded run artifact, and no documented infrastructure profile for the measured environment.

### Starter k6 template for 9a

```javascript
import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  vus: 50,
  duration: "60s",
  thresholds: {
    http_req_failed: ["rate==0"],
    http_req_duration: ["p(95)<500"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://127.0.0.1:8000";
const LOGIN_BODY = JSON.stringify({
  identifier: __ENV.LOGIN_IDENTIFIER || "student@example.com",
  password: __ENV.LOGIN_PASSWORD || "Password123!",
});

export default function () {
  const res = http.post(`${BASE_URL}/api/auth/login`, LOGIN_BODY, {
    headers: { "Content-Type": "application/json" },
  });

  check(res, {
    "login returned 200": (r) => r.status === 200,
    "set-cookie present": (r) => !!r.headers["Set-Cookie"],
  });

  sleep(1);
}
```

Infrastructure that must be documented with the run:
Supabase project tier
backend host CPU/RAM
frontend host CPU/RAM
whether Redis and PgBouncer were enabled
geographic region of the test runner

## SECTION 10 — Database connectivity and migration verification

1. Requirement and why it matters
   Both Supabase REST access and direct PostgreSQL access must be reliable, and migrations must apply in a deterministic order. This matters because onboarding, auth lockouts, and academic hierarchy writes are database-dependent.

2. Exact verification commands
   Supabase REST:
   ```bash
   python scripts/verify_supabase.py 2>&1
   ```
   Direct PostgreSQL:
   ```bash
   python scripts/test_db_connection.py 2>&1
   ```
   Migration state:
   ```bash
   PYTHONPATH=backend python backend/app/database/migrate.py 2>&1
   ```

3. Pass/fail criteria
   `10a`: pass only if all 9 named tables are reachable and each returns row count `> 0`.
   `10b`: pass only if PostgreSQL connection succeeds and prints `server_version`; if `5432` fails, `6543` must succeed and the reason must be documented.
   `10c`: pass only if migrations execute cleanly in order and all expected tables exist afterward.

4. Current Lumina status
   FAIL.
   `10a`: `python scripts/verify_supabase.py` did run successfully, but it only verified storage bucket access and did not query the required tables. The current script is not sufficient for the stated requirement.
   `10b`: the repo does not contain `scripts/test_db_connection.py`. The existing `scripts/verify_db_connection.py` is a MongoDB connectivity script, not a PostgreSQL verifier, and `scripts/test-db.ts` is also Mongo-oriented.
   `10c`: migration state is not production-safe. `backend/app/database/migrate.py` looks only for `.py` migrations, but the actual migration directory contains `.sql` files. The directory also contains duplicate sequence numbers (`004_*`, `008_*`), so deterministic ordering is not yet proven.

## SECTION 11 — Feature flag and route isolation verification

1. Requirement and why it matters
   Placeholder or partial pages must be isolated behind `IS_PROTOTYPE` so that real users never see fake, empty, or speculative UI. This matters because exposing unfinished role experiences undermines trust and can leak incorrect institutional data.

2. Exact verification command
   ```bash
   cd frontend/web && npm run test:e2e -- e2e/prototype-isolation.spec.ts 2>&1
   ```

3. Pass/fail criteria
   Pass: prototype pages are hidden from nav, direct URL access is redirected, and production mode never exposes them.
   Fail: no prototype flag exists, nav exposes unfinished routes, or pages render fake/empty data to production users.

4. Current Lumina status
   FAIL.
   There is no `IS_PROTOTYPE`, `NEXT_PUBLIC_IS_PROTOTYPE`, or equivalent production-isolation flag in `frontend/web/src`.
   The sidebar exposes role dashboards for `parent`, `mentor`, `peer_tutor`, `counselor`, `content_creator`, `researcher`, `alumni`, and `college` without any prototype guard.
   Several role APIs return hard-coded empty/fallback data today in `frontend/web/src/lib/api.ts`, including `getAlumniMentorshipMentees`, `getPeerTutorSessions`, `getPeerTutorTraining`, `getCounselorCases`, `getRiskAlerts`, `getCreatorVerificationQueue`, and `getAnonymizedSnapshots`.
   This means placeholder or partial role pages are currently routable in production mode with no isolation barrier.

## SECTION 12 — Production environment checklist

Evidence-based sign-off checklist:

- `[FAIL] ENVIRONMENT=production is set in deployment config`
  Evidence: `vercel.json` contains build/install commands only; no production env declaration is present in repo. `.env.example` is set to `ENVIRONMENT=development`.

- `[FAIL] SECURE_COOKIES=true is set in deployment config`
  Evidence: `.env.example` currently sets `SECURE_COOKIES=false`; deployment config in repo does not prove an overriding production value.

- `[FAIL] JWT_SECRET is a randomly generated 256-bit secret, not a placeholder`
  Evidence: `backend/app/core/config.py` falls back to `supersecretjwtkeythatshouldbechanged123!`.

- `[FAIL] JWT_REFRESH_SECRET is different from JWT_SECRET`
  Evidence: defaults are different placeholder strings, but deployment values are not verified. This cannot be signed off as production-safe.

- `[FAIL] Supabase anon key is restricted to required tables only (Row Level Security enabled)`
  Evidence: no audit artifact or policy verification command in this repo proves the deployed anon key scope or RLS posture.

- `[FAIL] CORS origins list contains only the production domain, not wildcard *`
  Evidence: `backend/app/main.py` allows localhost origins plus `allow_origin_regex=r"https://.*\.vercel\.app"`.

- `[FAIL] .env file is in .gitignore and not committed to the repository`
  Evidence: `.gitignore` ignores `.env`, but `git ls-files .env .env.local .env.production .env.development` shows `.env.local` is tracked.

- `[PASS] Error responses do not expose stack traces to the client (ENVIRONMENT=production)`
  Evidence: `backend/app/main.py` returns a generic `500` JSON body and logs server-side details with `exc_info=True`; no stack trace is returned to the client.

- `[FAIL] File upload directory is outside the web root (not publicly accessible)`
  Evidence: `backend/app/main.py` mounts `data/uploads` at `/uploads`, making uploaded content directly web-accessible in non-serverless mode.

- `[FAIL] Logs do not contain plaintext passwords or raw JWT tokens`
  Evidence: `backend/app/routers/auth.py` prints the raw reset token in `[EMAIL STUB] Reset link: /reset-password?token=...`. Seed scripts also print default password guidance.

- `[FAIL] tsc --noEmit passes with 0 errors`
  Evidence: Section 1 command failed with TypeScript errors.

- `[FAIL] npm run build completes successfully`
  Evidence: `cd frontend/web && npm run build 2>&1` failed during prerendering for `/404`, `/faculty/analytics/heatmap`, `/parent/dashboard`, and `/student/lesson_page`.

- `[FAIL] All pytest tests pass`
  Evidence: full backend run finished `5 failed, 60 passed`.

- `[FAIL] All Vitest tests pass`
  Evidence: frontend run finished `5 failed, 304 passed`.

- `[FAIL] All Playwright E2E tests pass`
  Evidence: the role-routing Playwright command failed waiting for the web server.

## FINAL SECTION — Industry readiness verdict

| Section | Status | Blocker? |
|---------|--------|----------|
| 1. TypeScript compilation | FAIL | YES |
| 2. Backend pytest | FAIL | YES |
| 3. Frontend unit tests | FAIL | YES |
| 4. E2E role routing | FAIL | YES |
| 5. Auth security | FAIL | YES |
| 6. Onboarding data integrity | FAIL | YES |
| 7. API contract tests | FAIL | YES |
| 8. Validation alignment | FAIL | YES |
| 9. Load performance | FAIL | NO |
| 10. DB connectivity | FAIL | YES |
| 11. Feature flag isolation | FAIL | YES |
| 12. Production checklist | FAIL | YES |

Overall verdict: NOT READY

Priority-ordered blocker list:

1. Fix frontend compile failures so `cd frontend/web && npx tsc --noEmit 2>&1` exits cleanly.
2. Fix the failing backend tests, especially auth registration drift, refresh-cookie flow, and course-route authorization, until `python -m pytest backend/tests/ -v --tb=short 2>&1` is fully green.
3. Fix frontend auth/session tests and stale cookie expectations until `cd frontend/web && npm test -- --run 2>&1` is fully green.
4. Make Playwright role-routing executable and expand coverage from four alias checks to all 12 required role landings.
5. Add and pass the missing auth-security, onboarding-integrity, and API-contract suites.
6. Align frontend Zod and backend Pydantic validation rules instead of relying on route-local helper checks.
7. Replace the broken DB verification path: table-aware Supabase verification, real PostgreSQL connection script, and a migration runner that matches the actual SQL migration format.
8. Introduce a real prototype isolation flag and hide unfinished role pages from navigation and direct routing.
9. Remove placeholder secrets and committed env files, tighten CORS, stop logging reset tokens, and move uploads out of a public mount.
