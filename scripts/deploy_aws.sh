#!/bin/bash
# ============================================================================
# Lumina AWS Deployment Script
# Description: Automates the setup and launch of Lumina on an EC2 instance.
# ============================================================================

set -e

echo "🚀 Starting Lumina AWS Deployment..."

# 1. Detect Public IP (Try multiple sources)
PUBLIC_IP=$(curl -s https://checkip.amazonaws.com || curl -s ifconfig.me || echo "localhost")
echo "📍 Detected Public IP: $PUBLIC_IP"

# 2. Check for required Environment Variables
if [ -f .env ]; then
    echo "📄 Found existing .env file. Loading..."
    source .env
else
    echo "⚠️ .env file not found! Generating required fields..."
fi

# Mandatory variables if not in .env
: "${DATABASE_URL:?'Please set DATABASE_URL in .env'}"
: "${GEMINI_API_KEY:?'Please set GEMINI_API_KEY in .env'}"

# 3. Configure Production Environment
# Note: Next.js needs the API URL at BUILD time
export NEXT_PUBLIC_API_URL="http://$PUBLIC_IP:8000"
echo "🛠️ Backend API set to: $NEXT_PUBLIC_API_URL"

# 4. Generate Production Compose Environment
cat <<EOF > .env.production
DATABASE_URL=$DATABASE_URL
NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
GEMINI_API_KEY=$GEMINI_API_KEY
AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY
AWS_BUCKET_NAME=$AWS_BUCKET_NAME
EOF

echo "✓ .env.production generated."

# 5. Build and Launch
echo "🏗️ Building and Launching Docker containers..."
docker compose -f docker-compose.prod.yml build --build-arg NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL
docker compose -f docker-compose.prod.yml up -d

echo "✅ Lumina is now deploying!"
echo "🌐 Frontend: http://$PUBLIC_IP:3000"
echo "🔌 Backend API: http://$PUBLIC_IP:8000"
echo "📊 Worker Stats: http://$PUBLIC_IP:5555"

echo ""
echo "📝 Reminder: Ensure ports 3000, 8000, and 5555 are open in your AWS Security Group."
