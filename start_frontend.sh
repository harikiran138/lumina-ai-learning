#!/bin/bash
# Frontend Startup Script

set -e

echo "⚛️  Starting Lumina Frontend..."

# Navigate to frontend directory
cd "$(dirname "$0")/frontend/web"

# Load environment variables
if [ -f "../../.env" ]; then
    export $(grep -v '^#' ../../.env | xargs)
fi

# Set Next.js environment variables
export NEXT_PUBLIC_API_URL=http://10.49.71.79:8000/api
export NEXT_PUBLIC_AUTH_URL=http://10.49.71.79:8000/api

# Ensure port 3000 is clean
lsof -ti :3000 | xargs kill -9 2>/dev/null || true

# Start Next.js development server
echo "Starting Next.js on port 3000..."
npm run dev
