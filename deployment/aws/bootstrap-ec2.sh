#!/usr/bin/env bash
# ============================================================
# Lumina EC2 Bootstrap — one-time server setup
# ============================================================
# Idempotent: safe to run multiple times.
# Installs: Docker, Docker Compose, Git, Nginx, Certbot
# Also configures swap memory and kernel params.
# ============================================================

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/lumina}"
REPO_DIR="${REPO_DIR:-/opt/lumina/lumina-ai-learning}"
SWAP_SIZE_MB="${SWAP_SIZE_MB:-4096}"   # 4 GB swap — critical for large Docker builds

echo "=== Lumina EC2 Bootstrap ==="
echo "APP_DIR=$APP_DIR"

# ─── Package manager detection ──────────────────────────────
if command -v dnf >/dev/null 2>&1; then
  PKG_INSTALL="sudo dnf install -y"
  PKG_UPDATE="sudo dnf update -y"
elif command -v apt-get >/dev/null 2>&1; then
  PKG_INSTALL="sudo apt-get install -y"
  PKG_UPDATE="sudo apt-get update -y"
else
  PKG_INSTALL="sudo yum install -y"
  PKG_UPDATE="sudo yum update -y"
fi

# ─── App directories ────────────────────────────────────────
sudo mkdir -p "$APP_DIR"
sudo chown ec2-user:ec2-user "$APP_DIR"

# ─── System packages ────────────────────────────────────────
echo "--- Installing system packages ---"
$PKG_UPDATE || true
$PKG_INSTALL git curl jq unzip

# ─── Docker ─────────────────────────────────────────────────
echo "--- Setting up Docker ---"
if ! command -v docker >/dev/null 2>&1; then
  if command -v dnf >/dev/null 2>&1 || command -v yum >/dev/null 2>&1; then
    # Amazon Linux / RHEL / CentOS
    $PKG_INSTALL docker
  else
    # Ubuntu / Debian
    curl -fsSL https://get.docker.com | sudo sh
  fi
fi

sudo systemctl enable docker
sudo systemctl start docker
sudo usermod -aG docker ec2-user || true

# ─── Docker Compose v2 ──────────────────────────────────────
echo "--- Setting up Docker Compose v2 ---"
if ! docker compose version >/dev/null 2>&1; then
  COMPOSE_VERSION="v2.27.0"
  COMPOSE_URL="https://github.com/docker/compose/releases/download/${COMPOSE_VERSION}/docker-compose-linux-x86_64"
  sudo mkdir -p /usr/local/lib/docker/cli-plugins
  sudo curl -fsSL "$COMPOSE_URL" -o /usr/local/lib/docker/cli-plugins/docker-compose
  sudo chmod +x /usr/local/lib/docker/cli-plugins/docker-compose
fi
docker compose version

# ─── Git (ensure latest) ────────────────────────────────────
echo "--- Setting up Git ---"
$PKG_INSTALL git || true
git --version

# ─── Nginx ──────────────────────────────────────────────────
echo "--- Setting up Nginx ---"
if ! command -v nginx >/dev/null 2>&1; then
  if command -v dnf >/dev/null 2>&1 || command -v yum >/dev/null 2>&1; then
    $PKG_INSTALL nginx
  else
    $PKG_INSTALL nginx
  fi
fi
sudo systemctl enable nginx || true
# Note: Nginx is managed via Docker (nginx container) — host Nginx not started.
# Uncomment the next line only if running Nginx directly on the host (non-Docker setup):
# sudo systemctl start nginx

# ─── Certbot (Let's Encrypt SSL) ────────────────────────────
echo "--- Setting up Certbot ---"
if ! command -v certbot >/dev/null 2>&1; then
  if command -v dnf >/dev/null 2>&1 || command -v yum >/dev/null 2>&1; then
    $PKG_INSTALL certbot python3-certbot-nginx || \
      (sudo pip3 install certbot certbot-nginx 2>/dev/null || true)
  else
    $PKG_INSTALL certbot python3-certbot-nginx || \
      (sudo pip3 install certbot certbot-nginx 2>/dev/null || true)
  fi
fi
certbot --version 2>/dev/null || echo "Certbot not available; install manually if HTTPS is needed."

# ─── Swap memory ────────────────────────────────────────────
echo "--- Configuring swap memory (${SWAP_SIZE_MB} MB) ---"
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
  echo "Swap enabled: $(free -h | grep Swap)"
else
  echo "Swap already configured."
fi

# ─── Kernel tuning ──────────────────────────────────────────
echo "--- Kernel tuning ---"
if ! grep -q '^vm.swappiness=10' /etc/sysctl.conf 2>/dev/null; then
  echo 'vm.swappiness=10' | sudo tee -a /etc/sysctl.conf >/dev/null
fi
sudo sysctl -w vm.swappiness=10 >/dev/null

# Increase max file descriptors for high-concurrency
if ! grep -q 'fs.file-max' /etc/sysctl.conf 2>/dev/null; then
  echo 'fs.file-max=65536' | sudo tee -a /etc/sysctl.conf >/dev/null
fi
sudo sysctl -w fs.file-max=65536 >/dev/null || true

echo "=== Bootstrap complete ==="
echo "Next: run deploy-on-ec2.sh to start the application."
