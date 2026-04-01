#!/bin/bash

# Docker Installation Script for Lumina EC2
# This script installs Docker and Docker Compose on an Amazon Linux 2023 instance

set -e  # Exit on error

echo "🐳 Installing Docker on EC2 Instance for Lumina"
echo "==============================================="

# Configuration
DEPLOY_DIR="/opt/lumina"

# Update system packages
echo "📦 Updating system packages..."
sudo yum update -y

# Install Docker
echo "🐳 Installing Docker..."
sudo yum install -y docker
sudo systemctl start docker
sudo systemctl enable docker

# Add ec2-user to docker group
echo "👥 Adding ec2-user to docker group..."
sudo usermod -aG docker ec2-user

# Install Docker Compose
echo "🔧 Installing Docker Compose..."
DOCKER_COMPOSE_VERSION="2.24.5"
sudo curl -L "https://github.com/docker/compose/releases/download/v${DOCKER_COMPOSE_VERSION}/docker-compose-$(uname -s)-$(uname -m)" \
    -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
sudo ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

# Install git
echo "📚 Installing Git..."
sudo yum install -y git htop wget vim jq

# Configure Docker daemon (log limits)
echo "⚙️  Configuring Docker daemon..."
sudo mkdir -p /etc/docker
sudo tee /etc/docker/daemon.json > /dev/null <<EOF
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  },
  "storage-driver": "overlay2"
}
EOF

sudo systemctl restart docker

# Create deployment directory
echo "📁 Creating deployment directory at $DEPLOY_DIR..."
sudo mkdir -p "$DEPLOY_DIR"
sudo chown ec2-user:ec2-user "$DEPLOY_DIR"

echo ""
echo "✅ Docker Installation Complete!"
echo "NOTE: Log out and log back in (re-ssh) for docker group changes to take effect."
