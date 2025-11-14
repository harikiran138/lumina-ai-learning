#!/bin/bash

# ========================================
# Setup Verification Script
# Verifies all requirements are met for local development
# ========================================

set -e

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

FAILED=0
WARNINGS=0

# ========================================
# Helper Functions
# ========================================

print_header() {
    echo ""
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}═══════════════════════════════════════${NC}"
}

check_success() {
    echo -e "${GREEN}✓${NC} $1"
}

check_error() {
    echo -e "${RED}✗${NC} $1"
    FAILED=$((FAILED + 1))
}

check_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
    WARNINGS=$((WARNINGS + 1))
}

check_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# ========================================
# System Requirements
# ========================================

check_system_requirements() {
    print_header "System Requirements"
    
    # Check OS
    if [[ "$OSTYPE" == "linux-gnu"* ]]; then
        check_success "Linux detected"
    elif [[ "$OSTYPE" == "darwin"* ]]; then
        check_success "macOS detected"
    elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
        check_warning "Windows detected (some tools may behave differently)"
    else
        check_warning "Unknown OS: $OSTYPE"
    fi
    
    # Check CPU cores
    if [[ "$OSTYPE" == "darwin"* ]]; then
        CORES=$(sysctl -n hw.logicalcpu_max 2>/dev/null || echo "unknown")
    else
        CORES=$(nproc 2>/dev/null || echo "unknown")
    fi
    
    if [[ "$CORES" != "unknown" && $CORES -ge 2 ]]; then
        check_success "CPU cores: $CORES (minimum 2 recommended)"
    else
        check_warning "Cannot determine CPU cores or less than 2 cores"
    fi
    
    # Check RAM
    if [[ "$OSTYPE" == "darwin"* ]]; then
        RAM_GB=$(sysctl hw.memsize | awk '{printf "%.0f", $2 / 1024 / 1024 / 1024}')
    else
        RAM_GB=$(free -g | awk '/^Mem:/ {print $2}')
    fi
    
    if [[ -n "$RAM_GB" && $RAM_GB -ge 4 ]]; then
        check_success "RAM: ${RAM_GB}GB (minimum 4GB recommended)"
    else
        check_warning "RAM: ${RAM_GB}GB (minimum 4GB recommended)"
    fi
    
    # Check disk space (at least 10GB free)
    DISK_GB=$(df -BG . | awk 'NR==2 {print $4}' | sed 's/G//')
    if [[ $DISK_GB -ge 10 ]]; then
        check_success "Disk space: ${DISK_GB}GB free (minimum 10GB recommended)"
    else
        check_warning "Disk space: ${DISK_GB}GB free (minimum 10GB recommended)"
    fi
}

# ========================================
# Required Tools
# ========================================

check_required_tools() {
    print_header "Required Tools"
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node -v)
        check_success "Node.js: $NODE_VERSION"
        
        # Check if version >= 18
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d. -f1 | sed 's/v//')
        if [[ $NODE_MAJOR -ge 18 ]]; then
            check_success "Node.js version is >= 18.0.0"
        else
            check_warning "Node.js version is < 18.0.0 (recommended >= 18)"
        fi
    else
        check_error "Node.js not found (required)"
    fi
    
    # Check npm
    if command -v npm &> /dev/null; then
        NPM_VERSION=$(npm -v)
        check_success "npm: $NPM_VERSION"
    else
        check_error "npm not found (required)"
    fi
    
    # Check Python
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version)
        check_success "Python: $PYTHON_VERSION"
        
        # Check if version >= 3.10
        PYTHON_MAJOR=$(echo $PYTHON_VERSION | cut -d. -f1 | sed 's/[^0-9]*//g')
        PYTHON_MINOR=$(echo $PYTHON_VERSION | cut -d. -f2)
        if [[ $PYTHON_MAJOR -ge 3 && $PYTHON_MINOR -ge 10 ]]; then
            check_success "Python version is >= 3.10"
        else
            check_warning "Python version is < 3.10 (recommended >= 3.10)"
        fi
    else
        check_error "Python3 not found (required)"
    fi
    
    # Check pip
    if command -v pip3 &> /dev/null; then
        PIP_VERSION=$(pip3 --version)
        check_success "pip: $PIP_VERSION"
    else
        check_error "pip3 not found (required)"
    fi
    
    # Check Git
    if command -v git &> /dev/null; then
        GIT_VERSION=$(git --version)
        check_success "$GIT_VERSION"
    else
        check_error "Git not found (required)"
    fi
}

# ========================================
# Optional Tools
# ========================================

check_optional_tools() {
    print_header "Optional Tools"
    
    # Docker
    if command -v docker &> /dev/null; then
        DOCKER_VERSION=$(docker --version)
        check_success "$DOCKER_VERSION"
    else
        check_warning "Docker not found (optional, but recommended for full stack testing)"
    fi
    
    # Docker Compose
    if command -v docker-compose &> /dev/null; then
        DC_VERSION=$(docker-compose --version)
        check_success "$DC_VERSION"
    else
        check_info "docker-compose not found (optional)"
    fi
    
    # PostgreSQL client
    if command -v psql &> /dev/null; then
        PSQL_VERSION=$(psql --version)
        check_success "$PSQL_VERSION"
    else
        check_info "PostgreSQL client (psql) not found (optional)"
    fi
    
    # Redis CLI
    if command -v redis-cli &> /dev/null; then
        REDIS_VERSION=$(redis-cli --version)
        check_success "$REDIS_VERSION"
    else
        check_info "Redis CLI not found (optional)"
    fi
    
    # Vercel CLI
    if command -v vercel &> /dev/null; then
        check_success "Vercel CLI installed"
    else
        check_info "Vercel CLI not found (optional, needed for Vercel deployment)"
    fi
}

# ========================================
# Project Structure
# ========================================

check_project_structure() {
    print_header "Project Structure"
    
    BASEDIR="/Users/chepuriharikiran/Desktop/github/lumina-ai-learning"
    
    # Check key directories
    local required_dirs=("backend" "frontend" "api" "streak-service" "database")
    for dir in "${required_dirs[@]}"; do
        if [ -d "$BASEDIR/$dir" ]; then
            check_success "Directory: $dir"
        else
            check_error "Directory: $dir (missing)"
        fi
    done
    
    # Check key files
    local required_files=("docker-compose.yml" "README.md" ".gitignore")
    for file in "${required_files[@]}"; do
        if [ -f "$BASEDIR/$file" ]; then
            check_success "File: $file"
        else
            check_warning "File: $file (missing)"
        fi
    done
}

# ========================================
# Python Dependencies
# ========================================

check_python_dependencies() {
    print_header "Python Dependencies"
    
    BASEDIR="/Users/chepuriharikiran/Desktop/github/lumina-ai-learning"
    
    if [ ! -f "$BASEDIR/backend/requirements.txt" ]; then
        check_error "requirements.txt not found"
        return
    fi
    
    check_info "Checking if core packages are installable..."
    
    local core_packages=("fastapi" "uvicorn" "sqlalchemy" "pydantic")
    for package in "${core_packages[@]}"; do
        if pip3 show $package &> /dev/null; then
            check_success "Python package: $package (installed)"
        else
            check_warning "Python package: $package (not installed, will install on first run)"
        fi
    done
}

# ========================================
# Node Dependencies
# ========================================

check_node_dependencies() {
    print_header "Node Dependencies"
    
    BASEDIR="/Users/chepuriharikiran/Desktop/github/lumina-ai-learning"
    
    # Check frontend
    if [ -f "$BASEDIR/frontend/package.json" ]; then
        check_success "Frontend: package.json found"
        
        if [ -d "$BASEDIR/frontend/node_modules" ]; then
            check_success "Frontend: node_modules installed"
        else
            check_warning "Frontend: node_modules not installed (will install on first run)"
        fi
    else
        check_error "Frontend: package.json not found"
    fi
    
    # Check API server
    if [ -f "$BASEDIR/api/package.json" ]; then
        check_success "API: package.json found"
        
        if [ -d "$BASEDIR/api/node_modules" ]; then
            check_success "API: node_modules installed"
        else
            check_warning "API: node_modules not installed (will install on first run)"
        fi
    else
        check_error "API: package.json not found"
    fi
}

# ========================================
# Port Availability
# ========================================

check_ports() {
    print_header "Port Availability"
    
    local ports=("3000:Frontend" "3001:API" "8000:Backend" "8001:Streak Service" "5432:PostgreSQL" "6379:Redis")
    
    for port_info in "${ports[@]}"; do
        PORT=$(echo $port_info | cut -d: -f1)
        NAME=$(echo $port_info | cut -d: -f2)
        
        if [[ "$OSTYPE" == "darwin"* ]]; then
            if ! lsof -i :$PORT &> /dev/null; then
                check_success "Port $PORT ($NAME): available"
            else
                check_warning "Port $PORT ($NAME): already in use"
            fi
        else
            if ! netstat -tuln 2>/dev/null | grep -q ":$PORT "; then
                check_success "Port $PORT ($NAME): available"
            else
                check_warning "Port $PORT ($NAME): already in use"
            fi
        fi
    done
}

# ========================================
# Environment Files
# ========================================

check_environment_files() {
    print_header "Environment Files"
    
    BASEDIR="/Users/chepuriharikiran/Desktop/github/lumina-ai-learning"
    
    # Backend
    if [ -f "$BASEDIR/backend/.env" ]; then
        check_success "Backend: .env configured"
    else
        if [ -f "$BASEDIR/backend/.env.example" ]; then
            check_warning "Backend: .env not found (copy from .env.example)"
        else
            check_error "Backend: .env and .env.example not found"
        fi
    fi
    
    # API
    if [ -f "$BASEDIR/api/.env" ]; then
        check_success "API: .env configured"
    else
        if [ -f "$BASEDIR/api/.env.example" ]; then
            check_warning "API: .env not found (copy from .env.example)"
        else
            check_error "API: .env and .env.example not found"
        fi
    fi
    
    # Frontend
    if [ -f "$BASEDIR/frontend/.env.local" ]; then
        check_success "Frontend: .env.local configured"
    else
        if [ -f "$BASEDIR/frontend/.env.local.example" ]; then
            check_warning "Frontend: .env.local not found (copy from .env.local.example)"
        else
            check_error "Frontend: .env.local and .env.local.example not found"
        fi
    fi
}

# ========================================
# Git Configuration
# ========================================

check_git_config() {
    print_header "Git Configuration"
    
    BASEDIR="/Users/chepuriharikiran/Desktop/github/lumina-ai-learning"
    
    if [ -d "$BASEDIR/.git" ]; then
        check_success "Git repository: initialized"
        
        # Check git config
        if git -C "$BASEDIR" config user.name &> /dev/null; then
            check_success "Git: user name configured"
        else
            check_warning "Git: user name not configured"
        fi
        
        if git -C "$BASEDIR" config user.email &> /dev/null; then
            check_success "Git: user email configured"
        else
            check_warning "Git: user email not configured"
        fi
    else
        check_warning "Git repository not initialized"
    fi
}

# ========================================
# Summary
# ========================================

print_summary() {
    print_header "Verification Summary"
    
    if [[ $FAILED -eq 0 ]]; then
        echo -e "${GREEN}All checks passed! ✨${NC}"
        echo ""
        echo "You're ready to start development!"
        echo ""
        echo "Next steps:"
        echo "1. Run: source setup.sh"
        echo "2. Run: npm run dev (in separate terminals for each service)"
        echo "3. Visit: http://localhost:3000"
        return 0
    else
        echo -e "${YELLOW}Verification complete with issues${NC}"
        echo ""
        echo "Failures: $FAILED"
        echo "Warnings: $WARNINGS"
        echo ""
        echo "Please fix the errors before continuing."
        return 1
    fi
}

# ========================================
# Main Execution
# ========================================

main() {
    echo -e "${BLUE}"
    echo "╔═══════════════════════════════════════╗"
    echo "║  Lumina Setup Verification Script     ║"
    echo "║  Checking system requirements...      ║"
    echo "╚═══════════════════════════════════════╝"
    echo -e "${NC}"
    
    check_system_requirements
    check_required_tools
    check_optional_tools
    check_project_structure
    check_python_dependencies
    check_node_dependencies
    check_ports
    check_environment_files
    check_git_config
    
    echo ""
    print_summary
}

# Run main function
main "$@"
