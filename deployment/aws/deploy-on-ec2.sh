#!/usr/bin/env bash
# ============================================================
# Lumina EC2 Deploy — starts / updates the full stack
# ============================================================
# Supports two modes:
#   BUILD mode  (default): git pull + docker compose build + up
#   IMAGE mode : pull pre-built images from GHCR + up
#
# Environment variables:
#   APP_DIR          - deployment root  (default: /opt/lumina)
#   REPO_DIR         - git repo path    (default: $APP_DIR/lumina-ai-learning)
#   COMPOSE_FILE     - compose file     (default: deployment/aws/docker-compose.full.yml in repo)
#   ENV_FILE         - env file         (default: $APP_DIR/.env)
#   GIT_BRANCH       - branch to deploy (default: main)
#   BACKEND_IMAGE    - if set, use this GHCR image instead of building
#   FRONTEND_IMAGE   - if set, use this GHCR image instead of building
#   ML_IMAGE         - if set, use this GHCR image instead of building
#   GHCR_USER        - GitHub username  (for private GHCR auth)
#   GHCR_TOKEN       - GitHub PAT       (for private GHCR auth)
# ============================================================

set -euo pipefail

# ─── Colours ────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC} $*"; }
success() { echo -e "${GREEN}[OK]${NC}   $*"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $*"; }
error()   { echo -e "${RED}[ERROR]${NC} $*" >&2; }

APP_DIR="${APP_DIR:-/opt/lumina}"
REPO_DIR="${REPO_DIR:-$APP_DIR/lumina-ai-learning}"
GIT_BRANCH="${GIT_BRANCH:-main}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env}"
GITHUB_REPO="${GITHUB_REPO:-https://github.com/harikiran138/lumina-ai-learning.git}"

echo "=== Lumina Deploy ==="
echo "APP_DIR   = $APP_DIR"
echo "REPO_DIR  = $REPO_DIR"
echo "Branch    = $GIT_BRANCH"
echo "$(date '+%Y-%m-%d %H:%M:%S')"
echo ""

# ─── Prune old artifacts to free up disk space ─────────────
info "Cleaning up old Docker artifacts to free disk space ..."
docker system prune -a --volumes -f || true

# ─── GHCR login (if IMAGE mode) ─────────────────────────────
if [[ -n "${GHCR_USER:-}" && -n "${GHCR_TOKEN:-}" ]]; then
  echo "--- Logging in to GHCR ---"
  printf '%s' "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
fi

# ─── Clone or update repository ─────────────────────────────
echo "--- Syncing repository ---"
if [[ -d "$REPO_DIR/.git" ]]; then
  echo "Pulling latest from origin/$GIT_BRANCH ..."
  cd "$REPO_DIR"
  git fetch --prune origin
  git checkout "$GIT_BRANCH"
  git reset --hard "origin/$GIT_BRANCH"
else
  echo "Repository not a git clone (or .git missing). Skipping git sync."
  if [[ ! -d "$REPO_DIR" ]]; then
     echo "ERROR: $REPO_DIR does not exist. Deployment aborted."
     exit 1
  fi
fi

cd "$REPO_DIR"

# ─── Determine compose file ──────────────────────────────────
COMPOSE_FILE="${COMPOSE_FILE:-$REPO_DIR/deployment/aws/docker-compose.full.yml}"
echo "Compose file: $COMPOSE_FILE"

# ─── Load environment variables into the shell for interpolation ───
if [[ -f "$ENV_FILE" ]]; then
  echo "Loading host environment variables from $ENV_FILE ..."
  # Strip carriage returns if present and export
  set -o allexport
  source <(grep -v '^#' "$ENV_FILE" | sed -e 's/\r//g')
  set +o allexport
  success "Environment variables loaded."
else
  warn "WARNING: $ENV_FILE not found. Host interpolation may fail."
fi

# Synced copy for Docker Compose
cp "$ENV_FILE" "$REPO_DIR/deployment/aws/.env"

# ─── IMAGE mode: pull from GHCR ─────────────────────────────
if [[ -n "${BACKEND_IMAGE:-}" ]]; then
  echo "--- IMAGE mode: pulling pre-built images ---"
  docker pull "$BACKEND_IMAGE"
  docker pull "${FRONTEND_IMAGE:?FRONTEND_IMAGE required in IMAGE mode}"
  docker pull "${ML_IMAGE:-ghcr.io/harikiran138/lumina-ai-learning-ml:latest}" || true

  export BACKEND_IMAGE FRONTEND_IMAGE ML_IMAGE

  docker compose \
    --project-name lumina \
    -f "$COMPOSE_FILE" \
    up -d --remove-orphans --no-build

# ─── BUILD mode: build from source on EC2 ───────────────────
else
  echo "--- BUILD mode: building images from source ---"
  docker compose \
    --project-name lumina \
    -f "$COMPOSE_FILE" \
    build --pull --parallel

  echo "--- Starting services ---"
  docker compose \
    --project-name lumina \
    -f "$COMPOSE_FILE" \
    up -d --remove-orphans
fi

# ─── Show running containers ─────────────────────────────────
echo ""
echo "--- Running containers ---"
docker compose \
  --project-name lumina \
  --env-file "$REPO_DIR/deployment/aws/.env" \
  -f "$COMPOSE_FILE" \
  ps

# ─── Health checks ───────────────────────────────────────────
echo ""
echo "--- Health checks ---"

check_endpoint() {
  local name="$1"
  local url="$2"
  local retries="${3:-12}"
  local wait="${4:-10}"
  for i in $(seq 1 "$retries"); do
    if curl -fsS --max-time 5 "$url" >/dev/null 2>&1; then
      echo "  [OK] $name  ($url)"
      return 0
    fi
    echo "  [..] $name not ready yet (attempt $i/$retries) ..."
    sleep "$wait"
  done
  echo "  [FAIL] $name did not respond at $url"
  return 1
}

check_endpoint "Backend API"  "http://127.0.0.1:8000/health"   18  10
check_endpoint "Frontend"     "http://127.0.0.1:80"             18  10
check_endpoint "ML Service"   "http://127.0.0.1:9000/health"    12  10 || echo "  (ML service check skipped — port not exposed externally)"

# ─── Cleanup old images ──────────────────────────────────────
echo ""
echo "--- Pruning dangling images ---"
docker image prune -f >/dev/null 2>&1 || true

echo ""
echo "=== Deploy complete: $(date '+%Y-%m-%d %H:%M:%S') ==="
