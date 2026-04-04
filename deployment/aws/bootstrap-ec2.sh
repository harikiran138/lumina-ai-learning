#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/lumina}"
SWAP_SIZE_MB="${SWAP_SIZE_MB:-2048}"

if command -v dnf >/dev/null 2>&1; then
  PKG_INSTALL="sudo dnf install -y"
else
  PKG_INSTALL="sudo yum install -y"
fi

sudo mkdir -p "$APP_DIR"
sudo chown ec2-user:ec2-user "$APP_DIR"

if ! command -v docker >/dev/null 2>&1; then
  $PKG_INSTALL docker git curl jq
else
  $PKG_INSTALL git curl jq
fi

sudo systemctl enable docker
sudo systemctl restart docker
sudo usermod -aG docker ec2-user || true

if ! docker compose version >/dev/null 2>&1; then
  sudo mkdir -p /usr/local/lib/docker/cli-plugins
  sudo curl -fsSL "https://github.com/docker/compose/releases/download/v2.24.6/docker-compose-linux-x86_64" \
    -o /usr/local/lib/docker/cli-plugins/docker-compose
  sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi

if ! sudo swapon --show | grep -q "/swapfile"; then
  if command -v fallocate >/dev/null 2>&1; then
    sudo fallocate -l "${SWAP_SIZE_MB}M" /swapfile
  else
    sudo dd if=/dev/zero of=/swapfile bs=1M count="$SWAP_SIZE_MB"
  fi
  sudo chmod 600 /swapfile
  sudo mkswap /swapfile
  sudo swapon /swapfile
  if ! grep -q '^/swapfile ' /etc/fstab; then
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab >/dev/null
  fi
fi

if ! grep -q '^vm.swappiness=10' /etc/sysctl.conf 2>/dev/null; then
  echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf >/dev/null
fi
sudo sysctl -w vm.swappiness=10 >/dev/null
