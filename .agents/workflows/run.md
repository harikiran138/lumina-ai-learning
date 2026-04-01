---
description: Start the Lumina project and perform comprehensive environment, security, and functional checks.
---

This workflow automates the local development lifecycle: environment validation, dependency installation, service startup, and automated testing.

## Prerequisites
-   Python 3.10+
-   Node.js 18+
-   Redis (optional, but recommended)

## Steps

### 1. Environment Validation
// turbo
1.  Check for required tools:
    ```bash
    python3 --version && node --version && npm --version
    ```
2.  Verify `.env` file exists (creates from example if missing):
    ```bash
    [ -f .env ] || cp .env.example .env
    ```

### 2. Dependency Installation & Preparation
// turbo
3.  Install backend and frontend dependencies:
    ```bash
    # Backend
    cd backend && python3 -m venv .venv && source .venv/bin/activate && pip install -r requirements.txt && cd ..
    # Frontend
    cd frontend/web && npm install && cd ../..
    ```
4.  Create necessary data directories:
    ```bash
    mkdir -p data/uploads static/presentations backend/db/chroma
    ```

### 3. Automated Security & Quality Checks
// turbo
5.  Run backend security audit:
    ```bash
    make security-py
    ```
6.  Run backend unit tests:
    ```bash
    make test
    ```

### 4. Project Startup
// turbo
7.  Run the project using local startup script:
    ```bash
    ./run_local.sh
    ```

### 5. Final Health Check
// turbo
8.  Verify both services are responding:
    ```bash
    # Check Backend
    curl -f http://localhost:8000/health || (echo "Backend health check failed" && exit 1)
    # Check Frontend 
    curl -f http://localhost:3000 || (echo "Frontend check failed" && exit 1)
    ```

---
**Note:** If `run_local.sh` stays in the foreground, you might need to use a terminal multiplexer (like `tmux` or `screen`) or run the startup step in the background.
