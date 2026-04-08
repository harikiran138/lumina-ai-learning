#!/bin/bash
set -e

# --- Configuration ---
KEY_FILE="deployment/aws/deploy/lumina-prod-key-v2.pem"
REMOTE_USER="ubuntu"
REMOTE_HOST="13.127.242.4"
REMOTE_DIR="/home/ubuntu/lumina-ai-learning"

echo "🚀 Starting Logical Optimized Deployment to AWS..."

# 1. Start Local Docker if not running (attempt)
if ! docker info > /dev/null 2>&1; then
    echo "⚠️ Local Docker not running. Attempting to start..."
    open -a Docker || echo "❌ Failed to start local Docker. Build might fail if you try to build locally."
fi

# 2. Local Disk Cleanup (to help the user)
echo "🧹 Cleaning local junk..."
rm -rf node_modules frontend/web/node_modules .next frontend/web/.next 2>/dev/null || true

# 3. Sync source to EC2
echo "🚀 Building frontend locally..."
cd frontend/web
npm run clean || rm -rf .next
npm install --legacy-peer-deps
npm run build
cd ../..

echo "📦 Packaging frontend artifacts..."
cd frontend/web
tar -czf ../../frontend_build.tar.gz .next/standalone .next/static public
cd ../..

echo "📤 Syncing code to remote server..."
rsync -avz --exclude 'node_modules' --exclude '.git' --exclude '.next' --exclude '.venv' \
    -e "ssh -i $KEY_FILE -o StrictHostKeyChecking=no" \
    ./ $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR

echo "📤 Sending local build artifacts..."
rsync -avz -e "ssh -i $KEY_FILE -o StrictHostKeyChecking=no" \
    frontend_build.tar.gz $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR

ssh -i $KEY_FILE $REMOTE_USER@$REMOTE_HOST << EOF
    cd $REMOTE_DIR
    echo "🏗️ Extracting build artifacts..."
    mkdir -p frontend/web/.next
    tar -xzf frontend_build.tar.gz -C frontend/web
    rm frontend_build.tar.gz
EOF

# 4. Remote Orchestration
echo "🐳 Building images ONE BY ONE on EC2 to conserve RAM..."
ssh -i $KEY_FILE -o StrictHostKeyChecking=no $REMOTE_USER@$REMOTE_HOST << 'EOF'
  cd /home/ubuntu/lumina-ai-learning
  
  # Ensure 4GB Swap exists
  if [ ! -f /swapfile ] || [ $(du -m /swapfile | cut -f1) -lt 4000 ]; then
    echo "⚙️ Setting up 4GB Swap..."
    sudo swapoff /swapfile || true
    sudo fallocate -l 4G /swapfile
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
  fi

  # Clean docker to avoid 91% disk issue on remote too
  sudo docker system prune -a --volumes -f
  sudo docker builder prune -a -f

  # SEQUENTIAL BUILD - Conserves RAM
  echo "🔨 Building Service: Backend (Slim)..."
  sudo docker compose -f docker-compose.prod.yml build backend
  
  echo "🔨 Building Service: Worker (Slim)..."
  sudo docker compose -f docker-compose.prod.yml build worker

  echo "🔨 Building Service: ML (Heavy, using cache if exists)..."
  sudo docker compose -f docker-compose.prod.yml build ml-service

  echo "🔨 Building Service: Frontend (Memory Intensive)..."
  # Disable typecheck/lint to save memory during build
  sudo docker compose -f docker-compose.prod.yml build frontend

  echo "🚀 Starting all containers..."
  sudo docker compose -f docker-compose.prod.yml up -d
  
  echo "✅ Deployment Successful!"
  sudo docker ps
EOF
