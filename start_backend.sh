#!/bin/bash
# Backend Startup Script

set -e

echo "🐍 Starting Lumina Backend..."
# Ensure port 9000 is clean
lsof -ti :9000 | xargs kill -9 2>/dev/null || true

# Navigate to backend directory
cd "$(dirname "$0")/backend"

# Ensure we use the correct Python version (3.11+)
PYTHON_311="/opt/homebrew/bin/python3.11"
if [ -f "$PYTHON_311" ]; then
    PYTHON_CMD="$PYTHON_311"
else
    PYTHON_CMD="python3"
fi

# Activate virtual environment if it exists, or create if Python version mismatch
if [ -d ".venv" ]; then
    VENV_PYTHON_VERSION=$($PYTHON_CMD -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')
    ACTUAL_VENV_VERSION=$(.venv/bin/python -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")' 2>/dev/null || echo "0.0")
    
    if [ "$VENV_PYTHON_VERSION" != "$ACTUAL_VENV_VERSION" ]; then
        echo "⚠️  Virtual environment Python mismatch. Recreating..."
        rm -rf .venv
        $PYTHON_CMD -m venv .venv
        source .venv/bin/activate
        pip install --upgrade pip
        pip install -r requirements.txt
    else
        source .venv/bin/activate
    fi
else
    echo "⚠️  No virtual environment found. Creating one with $PYTHON_CMD..."
    $PYTHON_CMD -m venv .venv
    source .venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
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
# Start FastAPI with uvicorn on port 9000 (Avoiding AirPlay port 8000 conflict)
echo "Starting uvicorn on port 9000..."
python -m uvicorn app.main:app --host 127.0.0.1 --port 9000 --reload --reload-exclude '.venv/*'
