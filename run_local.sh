#!/bin/bash
# Local Development Startup Script for Lumina AI Learning Platform

set -e  # Exit on error

echo "🚀 Starting Lumina AI Learning Platform (Local Mode)"
echo "=================================================="

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

PYTHON_BIN="${PYTHON_BIN:-}"
if [ -z "$PYTHON_BIN" ]; then
    if command -v python3.11 >/dev/null 2>&1; then
        PYTHON_BIN="python3.11"
    elif command -v python3 >/dev/null 2>&1; then
        PYTHON_BIN="python3"
    fi
fi

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${RED}❌ .env file not found!${NC}"
    echo "Creating .env from .env.example..."
    cp .env.example .env 2>/dev/null || echo "Please create .env file manually"
    exit 1
fi

# Load environment variables
export $(grep -v '^#' .env | xargs)

# Check dependencies
echo -e "\n${YELLOW}📋 Checking dependencies...${NC}"

# Check Python
if [ -z "$PYTHON_BIN" ]; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Python found: $($PYTHON_BIN --version 2>&1)${NC}"

PYTHON_VERSION="$($PYTHON_BIN -c 'import sys; print(f"{sys.version_info.major}.{sys.version_info.minor}")')"
if ! $PYTHON_BIN -c 'import sys; raise SystemExit(0 if sys.version_info >= (3, 10) else 1)'; then
    echo -e "${YELLOW}⚠️  Python ${PYTHON_VERSION} detected. Python 3.10+ is recommended, and Python 3.11+ matches the project setup guides.${NC}"
fi

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Node.js found${NC}"


# Check Redis (optional - will warn but not fail)
if ! command -v redis-cli &> /dev/null; then
    echo -e "${YELLOW}⚠️  Redis CLI not found. Make sure Redis is running on localhost:6379${NC}"
else
    if redis-cli ping > /dev/null 2>&1; then
        echo -e "${GREEN}✓ Redis is running${NC}"
    else
        echo -e "${YELLOW}⚠️  Redis is not responding. Some features may not work.${NC}"
    fi
fi

# Create necessary directories
echo -e "\n${YELLOW}📁 Creating necessary directories...${NC}"
mkdir -p data/uploads
mkdir -p static/presentations
mkdir -p backend/db/chroma
echo -e "${GREEN}✓ Directories created${NC}"

# Install backend dependencies if needed
if [ ! -d "backend/.venv" ] && [ ! -d ".venv" ]; then
    echo -e "\n${YELLOW}📦 Installing backend dependencies...${NC}"
    cd backend
    $PYTHON_BIN -m venv .venv
    source .venv/bin/activate
    pip install --upgrade pip
    pip install -r requirements.txt
    cd ..
    echo -e "${GREEN}✓ Backend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Backend virtual environment exists${NC}"
fi

# Install frontend dependencies if needed
if [ ! -d "frontend/web/node_modules" ]; then
    echo -e "\n${YELLOW}📦 Installing frontend dependencies...${NC}"
    cd frontend/web
    npm install --legacy-peer-deps
    cd ../..
    echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
else
    echo -e "${GREEN}✓ Frontend dependencies already installed${NC}"
fi

# Start services
echo -e "\n${YELLOW}🎬 Starting services...${NC}"

# Start backend in background
echo -e "${YELLOW}Starting backend on port 8000...${NC}"
./start_backend.sh &
BACKEND_PID=$!
echo -e "${GREEN}✓ Backend started (PID: $BACKEND_PID)${NC}"

# Wait a bit for backend to start
sleep 3

# Start frontend in background
echo -e "${YELLOW}Starting frontend on port 3000...${NC}"
./start_frontend.sh &
FRONTEND_PID=$!
echo -e "${GREEN}✓ Frontend started (PID: $FRONTEND_PID)${NC}"

# Wait for services to be ready
echo -e "\n${YELLOW}⏳ Waiting for services to be ready...${NC}"
sleep 5

# Check if backend is responding
if curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Backend is ready at http://localhost:8000${NC}"
    echo -e "${GREEN}  API Docs: http://localhost:8000/docs${NC}"
else
    echo -e "${YELLOW}⚠️  Backend health check failed. Check logs.${NC}"
fi

# Check if frontend is responding
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Frontend is ready at http://localhost:3000${NC}"
else
    echo -e "${YELLOW}⚠️  Frontend not responding yet. It may still be starting...${NC}"
fi

echo -e "\n${GREEN}=================================================="
echo -e "✨ Lumina Platform is running!"
echo -e "=================================================="
echo -e "Frontend: ${GREEN}http://localhost:3000${NC}"
echo -e "Backend:  ${GREEN}http://localhost:8000${NC}"
echo -e "API Docs: ${GREEN}http://localhost:8000/docs${NC}"
echo -e "=================================================="
echo -e "\nPress Ctrl+C to stop all services\n${NC}"

# Trap Ctrl+C to kill both processes
trap "echo -e '\n${YELLOW}Stopping services...${NC}'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" INT TERM

# Wait for both processes
wait
