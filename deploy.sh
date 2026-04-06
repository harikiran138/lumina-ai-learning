#!/usr/bin/env bash
# ============================================================
# Lumina AI Learning — One-Command Deploy
# ============================================================
# Usage:
#   ./deploy.sh                  # deploy latest main branch
#   ./deploy.sh --branch feature/x  # deploy a specific branch
#   ./deploy.sh --setup          # first-time server setup only
#   ./deploy.sh --logs           # tail logs from all services
#   ./deploy.sh --status         # show container status
#   ./deploy.sh --restart        # restart all services
#   ./deploy.sh --help           # show this help
#
# Prerequisites (local machine):
#   - AWS CLI configured (aws configure)
#   - SSH key at deploy/lumina-v4-key.pem
#   - deployment/aws/aws-config.env exists
#   - deployment/aws/.env.production exists (copy from .example)
# ============================================================

set -euo pipefail

# ─── Script location ────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CONFIG_FILE="$SCRIPT_DIR/deployment/aws/aws-config.env"
ENV_FILE="$SCRIPT_DIR/deployment/aws/.env.production"

# ─── Defaults ───────────────────────────────────────────────
GIT_BRANCH="main"
ACTION="deploy"
REMOTE_USER="ec2-user"
REMOTE_DIR="/opt/lumina"
GITHUB_REPO="https://github.com/harikiran138/lumina-ai-learning.git"

# ─── Colours ────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; BOLD='\033[1m'; NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC}   $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }
header()  { echo -e "\n${BOLD}$*${NC}"; }

# ─── Parse arguments ────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --branch|-b)  GIT_BRANCH="$2"; shift 2 ;;
    --setup)      ACTION="setup"; shift ;;
    --logs)       ACTION="logs"; shift ;;
    --status)     ACTION="status"; shift ;;
    --restart)    ACTION="restart"; shift ;;
    --help|-h)    ACTION="help"; shift ;;
    *)            error "Unknown argument: $1"; ACTION="help"; shift ;;
  esac
done

# ─── Help ───────────────────────────────────────────────────
if [[ "$ACTION" == "help" ]]; then
  head -20 "$0" | grep '^#' | sed 's/^# \?//'
  exit 0
fi

# ─── Load AWS config ────────────────────────────────────────
if [[ ! -f "$CONFIG_FILE" ]]; then
  error "aws-config.env not found: $CONFIG_FILE"
  error "Run: bash deployment/aws/aws-infrastructure.sh first."
  exit 1
fi
source "$CONFIG_FILE"

SSH_KEY="${KEY_FILE:-deploy/lumina-v4-key.pem}"
# Make path absolute
[[ "$SSH_KEY" != /* ]] && SSH_KEY="$SCRIPT_DIR/$SSH_KEY"

if [[ ! -f "$SSH_KEY" ]]; then
  error "SSH key not found: $SSH_KEY"
  exit 1
fi

chmod 400 "$SSH_KEY"   # ensure correct permissions

PUBLIC_IP="${PUBLIC_IP:?PUBLIC_IP not set in aws-config.env}"

SSH_OPTS="-i $SSH_KEY -o ConnectTimeout=15 -o StrictHostKeyChecking=no -o ServerAliveInterval=30"
SSH_CMD="ssh $SSH_OPTS $REMOTE_USER@$PUBLIC_IP"
SCP_CMD="scp -i $SSH_KEY -o StrictHostKeyChecking=no"

# ─── Test SSH connectivity ───────────────────────────────────
check_ssh() {
  info "Testing SSH connection to $PUBLIC_IP ..."
  if ! $SSH_CMD "echo connected" >/dev/null 2>&1; then
    error "Cannot SSH to $REMOTE_USER@$PUBLIC_IP"
    error "Check: security group allows port 22, key is valid, instance is running."
    exit 1
  fi
  success "SSH connection OK"
}

# ════════════════════════════════════════════════════════════
# ACTIONS
# ════════════════════════════════════════════════════════════

# ─── SETUP: first-time server bootstrap ─────────────────────
if [[ "$ACTION" == "setup" ]]; then
  header "=== First-Time Server Setup ==="
  check_ssh

  info "Copying bootstrap script to EC2 ..."
  $SCP_CMD \
    "$SCRIPT_DIR/deployment/aws/bootstrap-ec2.sh" \
    "$REMOTE_USER@$PUBLIC_IP:/tmp/bootstrap-ec2.sh"

  info "Running bootstrap on EC2 ..."
  $SSH_CMD "bash /tmp/bootstrap-ec2.sh"

  info "Uploading .env.production ..."
  if [[ ! -f "$ENV_FILE" ]]; then
    error ".env.production not found: $ENV_FILE"
    error "Create it from: deployment/aws/.env.production.example"
    exit 1
  fi
  $SCP_CMD "$ENV_FILE" "$REMOTE_USER@$PUBLIC_IP:$REMOTE_DIR/.env"

  success "Server setup complete. Now run: ./deploy.sh"
  exit 0
fi

# ─── LOGS ───────────────────────────────────────────────────
if [[ "$ACTION" == "logs" ]]; then
  header "=== Tailing Logs ==="
  check_ssh
  REPO_DIR="$REMOTE_DIR/lumina-ai-learning"
  COMPOSE="$REPO_DIR/deployment/aws/docker-compose.full.yml"
  $SSH_CMD "docker compose --project-name lumina -f $COMPOSE logs -f --tail=100"
  exit 0
fi

# ─── STATUS ─────────────────────────────────────────────────
if [[ "$ACTION" == "status" ]]; then
  header "=== Container Status ==="
  check_ssh
  REPO_DIR="$REMOTE_DIR/lumina-ai-learning"
  COMPOSE="$REPO_DIR/deployment/aws/docker-compose.full.yml"
  $SSH_CMD "docker compose --project-name lumina -f $COMPOSE ps"
  echo ""
  info "EC2 resource usage:"
  $SSH_CMD "free -h && df -h / && docker stats --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}' 2>/dev/null || true"
  exit 0
fi

# ─── RESTART ────────────────────────────────────────────────
if [[ "$ACTION" == "restart" ]]; then
  header "=== Restarting Services ==="
  check_ssh
  REPO_DIR="$REMOTE_DIR/lumina-ai-learning"
  COMPOSE="$REPO_DIR/deployment/aws/docker-compose.full.yml"
  $SSH_CMD "docker compose --project-name lumina -f $COMPOSE restart"
  success "All services restarted."
  exit 0
fi

# ─── DEPLOY (default) ───────────────────────────────────────
header "=== Lumina Deployment ==="
echo "  Target : $REMOTE_USER@$PUBLIC_IP"
echo "  Branch : $GIT_BRANCH"
echo "  Time   : $(date '+%Y-%m-%d %H:%M:%S')"
echo ""

check_ssh

# ── Step 1: Upload latest scripts and .env ─────────────────
info "Uploading deployment files ..."
$SSH_CMD "mkdir -p $REMOTE_DIR"

$SCP_CMD \
  "$SCRIPT_DIR/deployment/aws/deploy-on-ec2.sh" \
  "$SCRIPT_DIR/deployment/aws/docker-compose.full.yml" \
  "$SCRIPT_DIR/deployment/aws/nginx.conf" \
  "$REMOTE_USER@$PUBLIC_IP:$REMOTE_DIR/"

# Upload .env.production if it exists locally
if [[ -f "$ENV_FILE" ]]; then
  $SCP_CMD "$ENV_FILE" "$REMOTE_USER@$PUBLIC_IP:$REMOTE_DIR/.env"
  success ".env.production uploaded."
else
  warn ".env.production not found locally. Using existing .env on server."
fi

# ── Step 2: Run deploy on EC2 ──────────────────────────────
info "Running deployment on EC2 ..."

$SSH_CMD bash << REMOTE
set -euo pipefail

APP_DIR="$REMOTE_DIR"
REPO_DIR="$REMOTE_DIR/lumina-ai-learning"
COMPOSE_FILE="\$REPO_DIR/deployment/aws/docker-compose.full.yml"
GIT_BRANCH="$GIT_BRANCH"
GITHUB_REPO="$GITHUB_REPO"

# Clone or update repo
if [[ ! -d "\$REPO_DIR/.git" ]]; then
  echo "[EC2] Cloning repository ..."
  git clone --branch "\$GIT_BRANCH" --depth 1 "\$GITHUB_REPO" "\$REPO_DIR"
else
  echo "[EC2] Pulling latest code ..."
  cd "\$REPO_DIR"
  git fetch --prune origin
  git checkout "\$GIT_BRANCH"
  git reset --hard "origin/\$GIT_BRANCH"
fi

# Copy uploaded files into repo so compose can find them
cp "\$APP_DIR/docker-compose.full.yml" "\$REPO_DIR/deployment/aws/docker-compose.full.yml"
cp "\$APP_DIR/nginx.conf"              "\$REPO_DIR/deployment/aws/nginx.conf"
cp "\$APP_DIR/.env"                    "\$REPO_DIR/deployment/aws/.env" 2>/dev/null || true

# Newgrp docker may not have taken effect in this session; use sg
cd "\$REPO_DIR"
APP_DIR="\$APP_DIR" \
REPO_DIR="\$REPO_DIR" \
GIT_BRANCH="\$GIT_BRANCH" \
COMPOSE_FILE="\$COMPOSE_FILE" \
ENV_FILE="\$APP_DIR/.env" \
  sg docker -c "bash \$APP_DIR/deploy-on-ec2.sh"
REMOTE

echo ""
success "=== Deployment complete ==="
echo -e "  Frontend  : ${GREEN}http://$PUBLIC_IP${NC}"
echo -e "  Backend   : ${GREEN}http://$PUBLIC_IP:8000/health${NC}"
echo -e "  API Docs  : ${GREEN}http://$PUBLIC_IP:8000/docs${NC}"
echo -e "  MinIO UI  : ${GREEN}http://$PUBLIC_IP:9001${NC}"
echo ""
