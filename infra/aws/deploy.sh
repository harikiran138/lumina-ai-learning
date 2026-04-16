#!/usr/bin/env bash
# =============================================================================
# Lumina AWS Deploy Script
# Run AFTER provision.sh has created the EC2 instance.
#
# Usage:
#   ./infra/aws/deploy.sh <EC2_PUBLIC_IP> <PATH_TO_KEY.pem>
#
# What it does:
#   1. Syncs repo to /opt/lumina on EC2 (rsync, excludes .venv/.next/node_modules)
#   2. Copies backend/.env to EC2
#   3. SSHes in and runs docker-compose -f docker-compose.aws.yml up -d --build
# =============================================================================
set -euo pipefail

EC2_IP="${1:-}"
KEY_PATH="${2:-}"
REMOTE_USER="ec2-user"
REMOTE_DIR="/opt/lumina"
REPO_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"

if [ -z "$EC2_IP" ] || [ -z "$KEY_PATH" ]; then
  echo "Usage: $0 <EC2_PUBLIC_IP> <PATH_TO_KEY.pem>"
  exit 1
fi

SSH="ssh -i $KEY_PATH -o StrictHostKeyChecking=no ${REMOTE_USER}@${EC2_IP}"
SCP="scp -i $KEY_PATH -o StrictHostKeyChecking=no"

echo "=== Lumina Deploy → $EC2_IP ==="

# ── Step 1: Sync repo ────────────────────────────────────────────────────────
echo "[1/4] Syncing repo to $REMOTE_DIR ..."
rsync -avz \
  --exclude '.git' \
  --exclude '.venv' \
  --exclude '__pycache__' \
  --exclude '*.pyc' \
  --exclude 'node_modules' \
  --exclude '.next' \
  --exclude 'infra/aws/keys' \
  --exclude 'backend/.env' \
  -e "ssh -i $KEY_PATH -o StrictHostKeyChecking=no" \
  "$REPO_ROOT/" \
  "${REMOTE_USER}@${EC2_IP}:${REMOTE_DIR}/"

# ── Step 2: Copy .env ────────────────────────────────────────────────────────
echo "[2/4] Copying backend/.env ..."
$SCP "$REPO_ROOT/backend/.env" "${REMOTE_USER}@${EC2_IP}:${REMOTE_DIR}/backend/.env"

# ── Step 3: Wait for Docker ──────────────────────────────────────────────────
echo "[3/4] Waiting for Docker daemon on EC2 ..."
$SSH "until docker info > /dev/null 2>&1; do sleep 3; done; echo Docker ready"

# ── Step 4: Start containers ─────────────────────────────────────────────────
echo "[4/4] Starting containers ..."
$SSH "cd $REMOTE_DIR && \
  docker compose -f docker-compose.aws.yml pull --quiet || true && \
  docker compose -f docker-compose.aws.yml up -d --build 2>&1"

echo ""
echo "=== Deploy complete ==="
$SSH "docker compose -f $REMOTE_DIR/docker-compose.aws.yml ps"
echo ""
echo "  App URL  : http://${EC2_IP}"
echo "  API URL  : http://${EC2_IP}/api"
echo "  SSH      : ssh -i $KEY_PATH ${REMOTE_USER}@${EC2_IP}"
echo "  Logs     : ssh ... then: docker compose -f docker-compose.aws.yml logs -f"
