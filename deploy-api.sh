#!/bin/bash
# Deploy API Server to Railway.app
# This script deploys the Express API server to Railway

set -euo pipefail

echo "🚀 Deploying Lumina AI Learning API Server to Railway.app..."
echo ""

API_DIR="$(dirname "$0")/api"

echo "Prerequisites:"
echo "1. Install Railway CLI: npm install -g railway"
echo "2. Create an account at https://railway.app"
echo "3. Login: railway login"
echo ""

# Check if railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g railway
fi

cd "$API_DIR"

echo "Deploy Steps:"
echo "1. Link project: railway link"
echo "2. Deploy: railway up"
echo "3. Set variables: railway variables"
echo ""
echo "Environment Variables to set:"
echo "   - DB_HOST: localhost (or external DB)"
echo "   - DB_PORT: 5432"
echo "   - DB_NAME: lumina"
echo "   - DB_USER: postgres"
echo "   - DB_PASSWORD: your-password"
echo "   - JWT_SECRET: your-secret-key"
echo ""
echo "After deployment, get your URL:"
echo "railway open"
echo ""
echo "📚 Full Railway docs: https://docs.railway.app"
