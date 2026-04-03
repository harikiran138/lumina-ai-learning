#!/bin/bash

# Main Deployment Script for Lumina AI Learning on AWS
# This script deploys the Lumina project to EC2 using Docker.

set -e  # Exit on error

echo "🚀 Deploying Lumina AI Learning to AWS"
echo "======================================"

# Load AWS configuration
CONFIG_FILE="$(dirname "$0")/aws-config.env"
if [ -f "$CONFIG_FILE" ]; then
    source "$CONFIG_FILE"
    echo "✅ Loaded AWS configuration"
else
    echo "❌ aws-config.env not found. Run ./deployment/aws/aws-infrastructure.sh first."
    exit 1
fi

# Configuration
REMOTE_USER="ec2-user"
REMOTE_HOST="$PUBLIC_IP"
REMOTE_DIR="/opt/lumina"
SSH_KEY="${KEY_FILE:-deploy/lumina-deploy-key.pem}"
PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

echo ""
echo "📋 Deployment Configuration:"
echo "  Remote Host: $REMOTE_HOST"
echo "  Remote Directory: $REMOTE_DIR"
echo "  SSH Key: $SSH_KEY"
echo "  Project Directory: $PROJECT_DIR"

# Verify SSH key exists
if [ ! -f "$SSH_KEY" ]; then
    echo "❌ SSH key not found: $SSH_KEY"
    echo "   Ensure it's in the 'deploy/' directory at the project root."
    exit 1
fi

# Test SSH connection
echo ""
echo "🔐 Testing SSH connection..."
if ! ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$REMOTE_USER@$REMOTE_HOST" "echo 'SSH connection successful'" &> /dev/null; then
    echo "❌ Cannot connect to $REMOTE_HOST"
    echo "   Ensure the instance is running and your current IP is allowed in the security group."
    exit 1
fi

# Sync project files to EC2
echo ""
echo "📤 Syncing project files to EC2..."
rsync -avz --progress \
    -e "ssh -i $SSH_KEY -o StrictHostKeyChecking=no" \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.venv*' \
    --exclude '*.log' \
    --exclude 'tmp/' \
    --exclude 'output/' \
    --exclude 'test-results/' \
    --exclude '.parcel-cache/' \
    --exclude '.vercel/' \
    "$PROJECT_DIR/" \
    "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/"

# Copy production environment file
echo ""
echo "📝 Configuring environment variables..."
scp -i "$SSH_KEY" -o StrictHostKeyChecking=no "$PROJECT_DIR/deployment/aws/.env.production" "$REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR/.env"

echo "✅ Files synced and environment configured"

# Deploy using Docker Compose
echo ""
echo "🐳 Deploying Lumina with Docker Compose..."
ssh -i "$SSH_KEY" "$REMOTE_USER@$REMOTE_HOST" << ENDSSH
set -e
cd "$REMOTE_DIR"

echo "🛑 Stopping existing containers..."
docker-compose down || true

echo "🏗️  Building Docker images..."
# Explicitly use production config
docker-compose -f docker-compose.prod.yml build

echo "🚀 Starting containers..."
docker-compose -f docker-compose.prod.yml up -d

echo "⏳ Waiting for services to be healthy..."
sleep 15

echo "📊 Container status:"
docker-compose ps

echo "🔍 Verifying services..."
# We expect 8000 and 8001 to be active
echo "Backend: http://localhost:8000"
echo "Frontend: http://localhost:8001"

echo ""
echo "✅ Deployment Complete!"
ENDSSH

echo ""
echo "🎉 Lumina AI Learning is now live!"
echo "🌐 Frontend: http://$PUBLIC_IP:8001"
echo "🌐 Backend: http://$PUBLIC_IP:8000"
echo "🌐 Grafana: http://$PUBLIC_IP:3003"
echo ""
echo "Useful Commands:"
echo "  Logs: ssh -i $SSH_KEY $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && docker-compose logs -f'"
echo "  Restart: ssh -i $SSH_KEY $REMOTE_USER@$REMOTE_HOST 'cd $REMOTE_DIR && docker-compose restart'"
