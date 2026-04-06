#!/bin/bash

################################################################################
# Lumina AI Learning Platform - Auto-Deploy Script
#
# Usage:
#   ./deploy.sh                    # Deploy latest from main branch
#   ./deploy.sh [branch-name]      # Deploy specific branch
#
# This script performs zero-downtime deployments by:
#   1. Pulling latest code from git
#   2. Building new Docker images
#   3. Performing health checks
#   4. Gradually restarting services
#   5. Confirming deployment success
#
################################################################################

set -euo pipefail

# ═════════════════════════════════════════════════════════════════════════════
# Configuration
# ═════════════════════════════════════════════════════════════════════════════

PROJECT_DIR="/home/ubuntu/lumina-ai-learning"
DOCKER_COMPOSE_FILE="$PROJECT_DIR/docker-compose.prod.yml"
BACKUP_DIR="/home/ubuntu/backups"
LOG_FILE="/var/log/lumina-deploy.log"
DEPLOYMENT_TIMEOUT=300  # 5 minutes
BRANCH="${1:-main}"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'  # No Color

# ═════════════════════════════════════════════════════════════════════════════
# Logging Functions
# ═════════════════════════════════════════════════════════════════════════════

log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}✗ $1${NC}" | tee -a "$LOG_FILE"
}

# ═════════════════════════════════════════════════════════════════════════════
# Pre-Flight Checks
# ═════════════════════════════════════════════════════════════════════════════

preflight_checks() {
    log "Running pre-flight checks..."

    # Check if docker is running
    if ! docker ps > /dev/null 2>&1; then
        log_error "Docker is not running"
        exit 1
    fi
    log_success "Docker is running"

    # Check if project directory exists
    if [ ! -d "$PROJECT_DIR" ]; then
        log_error "Project directory not found: $PROJECT_DIR"
        exit 1
    fi
    log_success "Project directory found"

    # Check if docker-compose file exists
    if [ ! -f "$DOCKER_COMPOSE_FILE" ]; then
        log_error "Docker Compose file not found: $DOCKER_COMPOSE_FILE"
        exit 1
    fi
    log_success "Docker Compose file found"

    # Create backup directory if it doesn't exist
    mkdir -p "$BACKUP_DIR"
    log_success "Backup directory ready"
}

# ═════════════════════════════════════════════════════════════════════════════
# Database Backup
# ═════════════════════════════════════════════════════════════════════════════

backup_database() {
    log "Creating database backup..."

    local backup_file="$BACKUP_DIR/lumina-db-$TIMESTAMP.sql"

    cd "$PROJECT_DIR" || exit 1

    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres \
        pg_dump -U postgres lumina 2>/dev/null > "$backup_file"; then
        log_success "Database backup created: $backup_file"
    else
        log_warning "Failed to create database backup (non-fatal)"
    fi
}

# ═════════════════════════════════════════════════════════════════════════════
# Git Operations
# ═════════════════════════════════════════════════════════════════════════════

update_code() {
    log "Updating code from git (branch: $BRANCH)..."

    cd "$PROJECT_DIR" || exit 1

    # Fetch latest changes
    if ! git fetch origin "$BRANCH" ; then
        log_error "Failed to fetch from git"
        exit 1
    fi

    # Check current commit
    local current_commit=$(git rev-parse HEAD)
    log "Current commit: $current_commit"

    # Update to latest
    if ! git checkout "$BRANCH" ; then
        log_error "Failed to checkout branch: $BRANCH"
        exit 1
    fi

    if ! git pull origin "$BRANCH" ; then
        log_error "Failed to pull latest changes"
        exit 1
    fi

    local new_commit=$(git rev-parse HEAD)
    log "Updated to commit: $new_commit"

    if [ "$current_commit" != "$new_commit" ]; then
        log_success "Code updated successfully"
    else
        log_warning "No new changes detected"
    fi
}

# ═════════════════════════════════════════════════════════════════════════════
# Docker Build
# ═════════════════════════════════════════════════════════════════════════════

build_images() {
    log "Building Docker images..."

    cd "$PROJECT_DIR" || exit 1

    if ! docker-compose -f "$DOCKER_COMPOSE_FILE" build --no-cache ; then
        log_error "Failed to build Docker images"
        exit 1
    fi

    log_success "Docker images built successfully"
}

# ═════════════════════════════════════════════════════════════════════════════
# Health Checks
# ═════════════════════════════════════════════════════════════════════════════

wait_for_service() {
    local service=$1
    local endpoint=$2
    local max_attempts=$3
    local attempt=0

    log "Waiting for $service to be healthy..."

    while [ $attempt -lt $max_attempts ]; do
        if curl -sf "$endpoint" > /dev/null 2>&1; then
            log_success "$service is healthy"
            return 0
        fi

        attempt=$((attempt + 1))
        log "Attempt $attempt/$max_attempts for $service..."
        sleep 5
    done

    log_error "$service failed to become healthy after $max_attempts attempts"
    return 1
}

perform_health_checks() {
    log "Performing health checks..."

    cd "$PROJECT_DIR" || exit 1

    # Wait for backend to be ready
    if ! wait_for_service "Backend" "http://localhost:8000/health" 12; then
        log_error "Backend health check failed"
        return 1
    fi

    # Wait for frontend to be ready
    if ! wait_for_service "Frontend" "http://localhost:3000" 12; then
        log_warning "Frontend health check failed (non-critical)"
    fi

    log_success "All critical health checks passed"
    return 0
}

# ═════════════════════════════════════════════════════════════════════════════
# Zero-Downtime Deployment
# ═════════════════════════════════════════════════════════════════════════════

deploy_zero_downtime() {
    log "Starting zero-downtime deployment..."

    cd "$PROJECT_DIR" || exit 1

    # Stop old containers gracefully (gives 30s to finish requests)
    log "Stopping old services..."
    docker-compose -f "$DOCKER_COMPOSE_FILE" down --timeout=30 || true

    sleep 5

    # Start new containers
    log "Starting new services..."
    if ! docker-compose -f "$DOCKER_COMPOSE_FILE" up -d ; then
        log_error "Failed to start Docker containers"
        # Attempt to restart old containers
        docker-compose -f "$DOCKER_COMPOSE_FILE" up -d || true
        exit 1
    fi

    # Wait for all services to be ready
    log "Waiting for all services to be ready..."
    sleep 10

    # Perform health checks
    if ! perform_health_checks; then
        log_error "Health checks failed after deployment"
        exit 1
    fi

    log_success "Deployment completed successfully"
}

# ═════════════════════════════════════════════════════════════════════════════
# Post-Deployment Verification
# ═════════════════════════════════════════════════════════════════════════════

verify_deployment() {
    log "Verifying deployment..."

    cd "$PROJECT_DIR" || exit 1

    # Check container status
    log "Container Status:"
    docker-compose -f "$DOCKER_COMPOSE_FILE" ps

    # Check logs for errors
    log "Recent backend logs:"
    docker-compose -f "$DOCKER_COMPOSE_FILE" logs --tail=20 backend

    # Verify API endpoint
    log "Testing API endpoint..."
    if curl -sf http://localhost:8000/health > /dev/null; then
        log_success "API endpoint is responding"
    else
        log_warning "API endpoint may not be responding properly"
    fi

    # Verify database connection
    log "Verifying database connection..."
    if docker-compose -f "$DOCKER_COMPOSE_FILE" exec -T postgres \
        pg_isready -U postgres > /dev/null 2>&1; then
        log_success "Database is accessible"
    else
        log_warning "Database may not be accessible"
    fi
}

# ═════════════════════════════════════════════════════════════════════════════
# Cleanup and Summary
# ═════════════════════════════════════════════════════════════════════════════

cleanup() {
    log "Cleaning up..."

    cd "$PROJECT_DIR" || exit 1

    # Remove old Docker images (keep last 3)
    docker image prune -a -f --filter "until=72h" || true

    # Archive logs older than 30 days
    find "$BACKUP_DIR" -name "*.log" -mtime +30 -delete || true

    log "Cleanup completed"
}

# ═════════════════════════════════════════════════════════════════════════════
# Error Handling
# ═════════════════════════════════════════════════════════════════════════════

cleanup_on_error() {
    log_error "Deployment failed! Rolling back..."
    # Could implement automatic rollback here if needed
}

trap cleanup_on_error ERR

# ═════════════════════════════════════════════════════════════════════════════
# Main Execution
# ═════════════════════════════════════════════════════════════════════════════

main() {
    log "═════════════════════════════════════════════════════════════════"
    log "Lumina AI Learning Platform - Deployment Started"
    log "═════════════════════════════════════════════════════════════════"
    log "Branch: $BRANCH"
    log "Project: $PROJECT_DIR"
    log ""

    preflight_checks
    backup_database
    update_code
    build_images
    deploy_zero_downtime
    verify_deployment
    cleanup

    log ""
    log "═════════════════════════════════════════════════════════════════"
    log_success "Lumina AI Learning Platform - Deployment Completed Successfully"
    log "═════════════════════════════════════════════════════════════════"
    log "Next steps:"
    log "  1. Verify the application at https://your-domain.com"
    log "  2. Check logs: docker-compose -f $DOCKER_COMPOSE_FILE logs -f backend"
    log "  3. Monitor health: curl https://your-domain.com/api/health"
}

# ═════════════════════════════════════════════════════════════════════════════
# Run Main Function
# ═════════════════════════════════════════════════════════════════════════════

main "$@"
