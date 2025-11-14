#!/bin/bash
# Deploy to Vercel - Frontend Only (Recommended)
# This script deploys only the Next.js frontend to Vercel

set -euo pipefail

echo "🚀 Deploying Lumina AI Learning Frontend to Vercel..."

# Check if vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "📦 Installing Vercel CLI..."
    npm install -g vercel
fi

# Navigate to frontend
cd "$(dirname "$0")/frontend"

echo "📝 Building frontend..."
npm run build

echo "🌐 Deploying to Vercel..."
vercel --prod

echo "✅ Frontend deployment complete!"
echo ""
echo "Next steps:"
echo "1. Go to Vercel dashboard and add environment variables:"
echo "   NEXT_PUBLIC_API_URL=https://your-api-server.com"
echo "   NEXT_PUBLIC_BACKEND_URL=https://your-backend.com"
echo ""
echo "2. Deploy backend separately (see deploy-backend.sh)"
