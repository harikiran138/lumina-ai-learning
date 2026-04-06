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

# ─── GHCR login (if IMAGE mode) ─────────────────────────────
if [[ -n "${GHCR_USER:-}" && -n "${GHCR_TOKEN:-}" ]]; then
  echo "--- Logging in to GHCR ---"
  printf '%s' "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
fi

# ─── Clone or update repository ─────────────────────────────
echo "--- Syncing repository ---"
if [[ ! -d "$REPO_DIR/.git" ]]; then
  echo "Cloning repo into $REPO_DIR ..."
  git clone --branch "$GIT_BRANCH" --depth 1 "$GITHUB_REPO" "$REPO_DIR"
else
  echo "Pulling latest from origin/$GIT_BRANCH ..."
  cd "$REPO_DIR"
  git fetch --prune origin
  git checkout "$GIT_BRANCH"
  git reset --hard "origin/$GIT_BRANCH"
fi

cd "$REPO_DIR"

# ─── Determine compose file ──────────────────────────────────
COMPOSE_FILE="${COMPOSE_FILE:-$REPO_DIR/deployment/aws/docker-compose.full.yml}"
echo "Compose file: $COMPOSE_FILE"

# ─── Copy .env to repo deployment dir (compose needs it) ────
if [[ -f "$ENV_FILE" ]]; then
  cp "$ENV_FILE" "$REPO_DIR/deployment/aws/.env"
  echo "Env file copied to deployment/aws/.env"
else
  echo "WARNING: $ENV_FILE not found. Services may fail to start."
fi

# ─── IMAGE mode: pull from GHCR ─────────────────────────────
if [[ -n "${BACKEND_IMAGE:-}" ]]; then
  echo "--- IMAGE mode: pulling pre-built images ---"
  docker pull "$BACKEND_IMAGE"
  docker pull "${FRONTEND_IMAGE:?FRONTEND_IMAGE required in IMAGE mode}"
  docker pull "${ML_IMAGE:-ghcr.io/harikiran138/lumina-ai-learning-ml:latest}" || true

  export BACKEND_IMAGE FRONTEND_IMAGE ML_IMAGE

  docker compose \
    --project-name lumina \
    --env-file "$REPO_DIR/deployment/aws/.env" \
    -f "$COMPOSE_FILE" \
    up -d --remove-orphans --no-build

# ─── BUILD mode: build from source on EC2 ───────────────────
else
  echo "--- BUILD mode: building images from source ---"
  docker compose \
    --project-name lumina \
    --env-file "$REPO_DIR/deployment/aws/.env" \
    -f "$COMPOSE_FILE" \
    build --pull --parallel

  echo "--- Starting services ---"
  docker compose \
    --project-name lumina \
    --env-file "$REPO_DIR/deployment/aws/.env" \
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
