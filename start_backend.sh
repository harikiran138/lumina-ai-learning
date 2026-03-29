#!/bin/bash
# Backend Startup Script

set -e

echo "🐍 Starting Lumina Backend..."

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Activate virtual environment if it exists
if [ -d ".venv" ]; then
    source .venv/bin/activate
elif [ -d "../.venv" ]; then
    source ../.venv/bin/activate
else
    echo "⚠️  No virtual environment found. Using system Python."
fi

# Load environment variables
if [ -f "../.env" ]; then
    export $(grep -v '^#' ../.env | xargs)
fi

# Set development mode
export ENVIRONMENT=development
export DEBUG=true

PYTHON_VERSION="$(python -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}")')"
if ! python -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 10) else 1)'; then
    echo "⚠️  Running on Python ${PYTHON_VERSION}. Python 3.10+ is recommended, and Python 3.11+ matches the project setup guides."
fi

# Start FastAPI with uvicorn
echo "Starting uvicorn on port 8000..."
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
