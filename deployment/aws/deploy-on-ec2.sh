#!/usr/bin/env bash

set -euo pipefail

APP_DIR="${APP_DIR:-/opt/lumina}"
COMPOSE_FILE="${COMPOSE_FILE:-$APP_DIR/docker-compose.yml}"
ENV_FILE="${ENV_FILE:-$APP_DIR/.env}"

: "${BACKEND_IMAGE:?BACKEND_IMAGE is required}"
: "${FRONTEND_IMAGE:?FRONTEND_IMAGE is required}"

cd "$APP_DIR"

if [[ -n "${GHCR_USER:-}" && -n "${GHCR_TOKEN:-}" ]]; then
  printf '%s' "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin
fi

docker pull "$BACKEND_IMAGE"
docker pull "$FRONTEND_IMAGE"
docker pull redis:7-alpine

BACKEND_IMAGE="$BACKEND_IMAGE" FRONTEND_IMAGE="$FRONTEND_IMAGE" \
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" up -d --remove-orphans

BACKEND_IMAGE="$BACKEND_IMAGE" FRONTEND_IMAGE="$FRONTEND_IMAGE" \
  docker compose --env-file "$ENV_FILE" -f "$COMPOSE_FILE" ps

curl -fsS http://127.0.0.1:8000/health >/dev/null
curl -fsS http://127.0.0.1 >/dev/null

docker image prune -f >/dev/null 2>&1 || true
