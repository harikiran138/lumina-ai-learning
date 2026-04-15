#!/usr/bin/env bash

set -euo pipefail

CONFIG_FILE="$(dirname "$0")/aws-config.env"
PROJECT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
REMOTE_USER="ec2-user"
REMOTE_DIR="/opt/lumina"
BACKEND_IMAGE="${BACKEND_IMAGE:-ghcr.io/harikiran138/lumina-ai-learning-backend:latest}"
FRONTEND_IMAGE="${FRONTEND_IMAGE:-ghcr.io/harikiran138/lumina-ai-learning-frontend:latest}"

if [ ! -f "$CONFIG_FILE" ]; then
  echo "aws-config.env not found. Run deployment/aws/aws-infrastructure.sh first." >&2
  exit 1
fi

source "$CONFIG_FILE"

SSH_KEY="${KEY_FILE:-deploy/lumina-v4-key.pem}"
ENV_FILE="${PROJECT_DIR}/deployment/aws/.env.production"

if [ ! -f "$SSH_KEY" ]; then
  echo "SSH key not found: $SSH_KEY" >&2
  exit 1
fi

if [ ! -f "$ENV_FILE" ]; then
  echo "Local env file missing: $ENV_FILE" >&2
  echo "Create it from deployment/aws/.env.production.example before manual deploys." >&2
  exit 1
fi

ssh -i "$SSH_KEY" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$REMOTE_USER@$PUBLIC_IP" "echo connected" >/dev/null

scp -i "$SSH_KEY" -o StrictHostKeyChecking=no \
  "${PROJECT_DIR}/deployment/aws/bootstrap-ec2.sh" \
  "${PROJECT_DIR}/deployment/aws/deploy-on-ec2.sh" \
  "${PROJECT_DIR}/deployment/aws/docker-compose.ec2.yml" \
  "$ENV_FILE" \
  "$REMOTE_USER@$PUBLIC_IP:/tmp/"

ssh -i "$SSH_KEY" -o StrictHostKeyChecking=no "$REMOTE_USER@$PUBLIC_IP" <<EOF
set -euo pipefail
mkdir -p "$REMOTE_DIR"
cp /tmp/bootstrap-ec2.sh /tmp/deploy-on-ec2.sh "$REMOTE_DIR"/
cp /tmp/docker-compose.ec2.yml "$REMOTE_DIR/docker-compose.yml"
cp /tmp/.env.production "$REMOTE_DIR/.env"
APP_DIR="$REMOTE_DIR" bash "$REMOTE_DIR/bootstrap-ec2.sh"
APP_DIR="$REMOTE_DIR" BACKEND_IMAGE="$BACKEND_IMAGE" FRONTEND_IMAGE="$FRONTEND_IMAGE" bash "$REMOTE_DIR/deploy-on-ec2.sh"
EOF

echo "Manual AWS deploy complete."
