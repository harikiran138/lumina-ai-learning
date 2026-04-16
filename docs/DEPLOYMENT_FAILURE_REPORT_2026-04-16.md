# Lumina AWS Deployment Failure Report

Date: 2026-04-16
Scope: EC2 deployment of Lumina via `docker-compose.aws.yml`
Target instance: `i-01f6fde4454706863`

## 1. Executive Summary
Deployment failed due to a chain of independent issues across frontend dependency resolution, Docker runtime prerequisites, backend runtime package mismatch, and EC2 build capacity.

Primary blockers observed during deployment attempts:
1. Frontend `npm ci` lockfile mismatch in container builds.
2. Backend startup crash due to missing Python dependency (`prometheus_fastapi_instrumentator`).
3. Build cache masking dependency fixes (`up -d --build` without forced cache busting).
4. EC2 disk pressure during backend image build (large ML dependency graph).

Status at end of troubleshooting:
- Frontend React 19 compatibility issue: resolved.
- Frontend lock/dependency policy drift: resolved (`legacy-peer-deps=false`, lockfile regenerated).
- Backend missing runtime package: resolved in `requirements.prod.txt`.
- Remaining risk: EC2 storage pressure during full backend rebuild (requires infra-side capacity/cleanup verification before declaring deployment green).

## 2. What Was Attempted (Process Log)

### Phase A: Frontend dependency and build stabilization
Actions performed:
1. Replaced `react-qr-scanner` with `@yudiel/react-qr-scanner` for React 19 compatibility.
2. Updated scanner implementation and import paths.
3. Regenerated `frontend/web/package-lock.json` and enforced `npm ci` usage.
4. Hardened frontend Dockerfile with multi-stage build and healthcheck.

Evidence in repo:
- `frontend/web/package.json`
- `frontend/web/package-lock.json`
- `frontend/web/src/components/parent/ChildScanner.tsx`
- `frontend/web/Dockerfile`
- `frontend/web/.npmrc`

### Phase B: Deployment safety hardening
Actions performed:
1. Added `.nvmrc` pin (`20`).
2. Enforced `npm ci` in root build scripts.
3. Added production env fail-fast checks for frontend and backend.
4. Added/updated compose healthchecks.

Evidence in repo:
- `.nvmrc`
- `package.json`
- `frontend/web/next.config.mjs`
- `backend/app/core/config.py`
- `docker-compose.aws.yml`

### Phase C: Runtime/backend troubleshooting
Actions performed:
1. Fixed backward compatibility for metrics imports used by legacy router paths.
2. Added missing `prometheus-fastapi-instrumentator` back to production requirements.

Evidence in repo:
- `backend/app/core/metrics.py`
- `backend/requirements.prod.txt`

## 3. Detailed Failure Analysis (Root Causes)

### RC-1: Frontend container build failed at `npm ci`
Symptom:
- `npm ci` failed in Docker while local non-container workflows appeared OK.

Cause:
- Dependency policy drift between lock generation and install mode (`legacy-peer-deps` behavior), plus React 19 peer incompatibility from `react-qr-scanner`.

Why it happened:
1. `react-qr-scanner` only supports React 17/18 peer range.
2. Existing `.npmrc` had `legacy-peer-deps=true`, allowing resolution behavior inconsistent with strict CI/container installs.

Fix applied:
1. Package migrated to `@yudiel/react-qr-scanner`.
2. `.npmrc` changed to `legacy-peer-deps=false`.
3. Lockfile regenerated for strict `npm ci` compatibility.

Risk after fix:
- Low, provided lockfile is not regenerated with conflicting npm/policy settings.

### RC-2: Local docker validation environment was inconsistent
Symptom:
- `docker compose` plugin not available locally in some runs.
- Docker daemon unavailable in some runs.

Cause:
- Local host had CLI/plugin/daemon inconsistency.

Impact:
- Slowed validation and introduced false negatives unrelated to app code.

Mitigation:
- Used available compose variant (`docker-compose`) where possible and shifted validation to EC2 execution context.

### RC-3: Backend container started failing due to missing runtime package
Symptom:
- Backend import/runtime error for `prometheus_fastapi_instrumentator`.

Cause:
- Production requirements omitted package that runtime code path still imported.

Fix applied:
- Added `prometheus-fastapi-instrumentator==6.1.0` to `backend/requirements.prod.txt`.

Risk after fix:
- Low for this specific import path.

### RC-4: Dependency fix not reflected due to Docker cache reuse
Symptom:
- Rebuild appeared to ignore latest dependency changes.

Cause:
- Deploy flow used `up -d --build` path; layer cache could preserve stale dependency layers.

Fix/Recommendation:
- Use `build --no-cache` after dependency or Dockerfile changes.

### RC-5: EC2 disk pressure during backend image build
Symptom:
- Build failures when dependency graph grew large (ML stack / torch-related layers).

Cause:
- Limited EBS free space for image layers + pip caches + intermediate build artifacts.

Mitigation already present:
- Backend Dockerfile explicitly installs CPU torch wheel first:
  - `torch --index-url https://download.pytorch.org/whl/cpu`

Remaining infra action required:
1. Ensure enough free EBS for no-cache builds.
2. Run docker cleanup before rebuild.
3. Increase EBS if repeated builds still hit capacity.

## 4. Security Observation During Troubleshooting
During compose rendering, environment values were visible in command output. This means secrets can leak through logs if command output is captured/shared.

Required action:
1. Rotate exposed credentials immediately if any terminal output or logs were shared.
2. Avoid printing full compose config in shared channels.
3. Move secrets to SSM/Secrets Manager where possible.

## 5. Files Changed During This Incident
1. `.nvmrc`
2. `package.json`
3. `frontend/web/.npmrc`
4. `frontend/web/package.json`
5. `frontend/web/package-lock.json`
6. `frontend/web/Dockerfile`
7. `frontend/web/next.config.mjs`
8. `frontend/web/src/components/parent/ChildScanner.tsx`
9. `frontend/web/src/features/admin/components/admin-shell.tsx`
10. `docker-compose.aws.yml`
11. `backend/app/core/config.py`
12. `backend/app/core/metrics.py`
13. `backend/requirements.prod.txt`

## 6. Current Deployment State (Technical)
Resolved:
1. React 19 peer dependency conflict.
2. Strict lockfile install compatibility policy alignment.
3. Frontend build hardening and healthcheck.
4. Backend metrics symbol compatibility.
5. Backend missing runtime package in production requirements.

Needs final infra confirmation on EC2:
1. Successful `build --no-cache` completion for all services.
2. No disk-pressure aborts during backend image build.
3. All services healthy after `up -d`.

## 7. Required Final Verification Checklist
Run on EC2:
1. `cd /opt/lumina`
2. `sudo docker system df`
3. `sudo docker system prune -af`
4. `sudo docker builder prune -af`
5. `sudo docker compose -f docker-compose.aws.yml down`
6. `sudo docker compose -f docker-compose.aws.yml build --no-cache`
7. `sudo docker compose -f docker-compose.aws.yml up -d`
8. `sudo docker compose -f docker-compose.aws.yml ps`
9. `sudo docker compose -f docker-compose.aws.yml logs --tail=200 backend frontend`
10. `curl -f http://localhost/`
11. `curl -f http://localhost/api/health || curl -f http://localhost:8000/health`

Pass criteria:
1. All core services in `Up`/`healthy` state.
2. Frontend endpoint returns HTTP 200.
3. Backend health endpoint returns HTTP 200.
4. No crash loops in backend/frontend logs.

## 8. Process Improvement Recommendations
1. Enforce lockfile policy in CI (`npm ci` only) and block merge on lock drift.
2. Add pre-deploy CI job that runs containerized frontend/backend builds.
3. Add disk-space preflight check to deploy script.
4. Force `--no-cache` automatically when dependency files changed.
5. Add secrets-redaction policy for deployment logs.

## 9. Conclusion
Deployment did not fail from a single cause; it failed from a sequence of dependency-policy drift + runtime dependency mismatch + infra capacity constraints.

Code/config side is significantly hardened and mostly remediated.
Final success now depends on an EC2-side no-cache rebuild with adequate disk and post-start health verification.
