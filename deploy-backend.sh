#!/bin/bash
# Deploy Backend to Render.com
# This script deploys the FastAPI backend to Render

set -euo pipefail

echo "🚀 Deploying Lumina AI Learning Backend to Render.com..."
echo ""
echo "Prerequisites:"
echo "1. Create an account at https://render.com"
echo "2. Connect your GitHub repository"
echo ""

BACKEND_DIR="$(dirname "$0")/backend"

echo "✅ Backend files ready at: $BACKEND_DIR"
echo ""
echo "Deploy Steps:"
echo "1. Go to https://render.com/dashboard"
echo "2. Click 'New +' → 'Web Service'"
echo "3. Connect your GitHub repository"
echo "4. Configure:"
echo "   - Name: lumina-ai-backend"
echo "   - Root Directory: backend"
echo "   - Runtime: Python 3.14"
echo "   - Build Command: pip install -r requirements.txt"
echo "   - Start Command: uvicorn main:app --host 0.0.0.0 --port 8000"
echo ""
echo "5. Add Environment Variables:"
echo "   - DATABASE_URL: (use Render's PostgreSQL addon)"
echo "   - REDIS_URL: redis://... (use Upstash or Redis Cloud)"
echo "   - JWT_SECRET: your-secret-key-here"
echo "   - OLLAMA_BASE_URL: (optional, for local LLM)"
echo ""
echo "6. Click 'Create Web Service'"
echo ""
echo "After deployment, you'll get a URL like:"
echo "https://lumina-ai-backend.onrender.com"
echo ""
echo "📚 Full Render docs: https://render.com/docs"
