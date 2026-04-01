#!/bin/bash
# ============================================================================
# Lumina Cloud-Init Deployment Script
# Description: This script runs on the EC2 instance upon first boot.
# ============================================================================

set -e
exec > /var/log/cloud-init-output.log 2>&1

echo "🏗️ Starting Lumina Cloud Deployment..."

# 1. Update and Install Docker
apt-get update
apt-get install -y ca-certificates curl gnupg lsb-release
mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin git

# 2. Clone Lumina Repository
echo "📂 Cloning Lumina repository..."
git clone https://github.com/harikiran138/lumina-ai-learning.git /home/ubuntu/lumina
cd /home/ubuntu/lumina

# 3. Provision Environment (In production, these would be in AWS Secrets Manager)
# NOTE: This script assumes you will manually add your .env after boot, 
# or we can bake them in here if using a secure method.
# For now, we create a placeholder .env
cp .env.example .env

# 4. Launch Lumina
echo "🚀 Launching Lumina with Docker Compose..."
docker compose -f docker-compose.prod.yml up -d

echo "✅ Lumina Cloud Deployment Complete!"
