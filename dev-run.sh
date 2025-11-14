#!/usr/bin/env bash
# Simple helper to create venvs and start the services locally (lightweight/dev)
# Usage: chmod +x dev-run.sh && ./dev-run.sh start

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"

case "${1-}" in
  start)
    echo "Starting local dev services (backend, streak-service, api, frontend)"

    # Backend venv
    if [ ! -d "$ROOT_DIR/backend/.venv" ]; then
      echo "Creating backend venv..."
      python3 -m venv "$ROOT_DIR/backend/.venv"
    fi
    source "$ROOT_DIR/backend/.venv/bin/activate"
    pip install --upgrade pip
    pip install fastapi uvicorn python-dotenv pydantic python-multipart || true
    (cd "$ROOT_DIR/backend" && uvicorn main:app --reload --host 127.0.0.1 --port 8000) &
    deactivate

    # Streak service venv
    if [ ! -d "$ROOT_DIR/streak-service/.venv" ]; then
      echo "Creating streak-service venv..."
      python3 -m venv "$ROOT_DIR/streak-service/.venv"
    fi
    source "$ROOT_DIR/streak-service/.venv/bin/activate"
    pip install --upgrade pip
    pip install fastapi uvicorn redis python-dotenv || true
    (cd "$ROOT_DIR/streak-service" && uvicorn main:app --reload --host 127.0.0.1 --port 8001) &
    deactivate

    # API server (node)
    if command -v npm >/dev/null 2>&1; then
      echo "Installing api dependencies (api/package.json)..."
      (cd "$ROOT_DIR/api" && npm install) || true
      (cd "$ROOT_DIR/api" && node server.js) &
    else
      echo "npm not found; please install Node.js and run: cd api && npm install && npm run start"
    fi

    # Frontend
    if command -v npm >/dev/null 2>&1; then
      echo "Installing frontend dependencies..."
      (cd "$ROOT_DIR/frontend" && npm install) || true
      echo "Run the frontend dev server separately: cd frontend && npm run dev"
    else
      echo "npm not found; please install Node.js and run: cd frontend && npm install && npm run dev"
    fi

    echo "Started background services (where possible). Check logs in terminal."
    ;;
  *)
    echo "Usage: $0 start"
    exit 1
    ;;
esac
