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
export NEXT_PUBLIC_API_URL="http://localhost:9000"
export NEXT_PUBLIC_AUTH_URL="http://localhost:9000"

# Ensure port 3000 is clean and no build processes are competing
echo "🧹 Cleaning up port 3000 and killing competing build processes..."
lsof -ti :3000 | xargs kill -9 2>/dev/null || true
pkill -f "next build" 2>/dev/null || true

# Start Next.js development server
echo "Starting Next.js on port 3000..."
npm run dev
