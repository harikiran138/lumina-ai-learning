#!/bin/bash
# ============================================================================
# EC2 Server Setup Script for Lumina
# OS: Ubuntu (22.04 recommended)
# ============================================================================

set -e

echo "🛠️ Updating system and installing dependencies..."
sudo apt-get update
sudo apt-get install -y ca-certificates curl gnupg lsb-release

# 1. Add Docker’s official GPG key
sudo mkdir -p /etc/apt/keyrings
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

# 2. Set up the repository
echo \
  "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
  $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

# 3. Install Docker Engine
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

# 4. Give current user docker permissions (re-login required after)
sudo usermod -aG docker $USER

echo "✅ Docker and Docker Compose installed successfully."
echo "⚠️ IMPORTANT: Please log out and log back in to apply Docker group permissions."
echo "🔄 Run: 'exit' and then reconnect via SSH."
