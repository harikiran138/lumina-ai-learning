#!/bin/bash
# Quick Deploy Script - Lumina AI Learning
# This script automates the deployment process

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "${BLUE}===================================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}===================================================${NC}"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${YELLOW}ℹ️  $1${NC}"
}

# Check if required tools are installed
check_dependencies() {
    print_header "Checking Dependencies"
    
    local missing_tools=()
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        missing_tools+=("Node.js")
    else
        print_success "Node.js found: $(node --version)"
    fi
    
    # Check for git
    if ! command -v git &> /dev/null; then
        missing_tools+=("Git")
    else
        print_success "Git found: $(git --version)"
    fi
    
    # Check for Python
    if ! command -v python3 &> /dev/null; then
        missing_tools+=("Python 3")
    else
        print_success "Python found: $(python3 --version)"
    fi
    
    if [ ${#missing_tools[@]} -ne 0 ]; then
        print_error "Missing tools: ${missing_tools[*]}"
        echo "Please install the missing tools and try again."
        exit 1
    fi
}

# Install CLI tools
install_cli_tools() {
    print_header "Installing Deployment Tools"
    
    # Vercel CLI
    if ! command -v vercel &> /dev/null; then
        print_info "Installing Vercel CLI..."
        npm install -g vercel
        print_success "Vercel CLI installed"
    else
        print_success "Vercel CLI already installed"
    fi
    
    # Railway CLI (optional)
    if ! command -v railway &> /dev/null; then
        print_info "Railway CLI not found. Install manually: npm install -g railway"
    else
        print_success "Railway CLI already installed"
    fi
}

# Git operations
prepare_git() {
    print_header "Preparing Git Repository"
    
    # Check if git repo exists
    if [ ! -d ".git" ]; then
        print_error "Not a Git repository"
        exit 1
    fi
    
    # Add all changes
    print_info "Adding changes to git..."
    git add .
    
    # Check if there are changes to commit
    if git diff --cached --quiet; then
        print_info "No changes to commit"
    else
        print_info "Committing changes..."
        git commit -m "Deploy: $(date '+%Y-%m-%d %H:%M:%S')"
        print_success "Changes committed"
    fi
    
    # Push to GitHub
    print_info "Pushing to GitHub..."
    git push origin main
    print_success "Pushed to GitHub"
}

# Deploy frontend
deploy_frontend() {
    print_header "Deploying Frontend to Vercel"
    
    cd frontend
    
    print_info "Installing dependencies..."
    npm install
    
    print_info "Building project..."
    npm run build
    
    print_info "Deploying to Vercel..."
    vercel --prod
    
    print_success "Frontend deployed to Vercel"
    cd ..
}

# Show deployment instructions
show_instructions() {
    print_header "Deployment Complete!"
    
    echo ""
    echo -e "${GREEN}✅ Your application has been prepared for deployment!${NC}"
    echo ""
    echo -e "${BLUE}Next Steps:${NC}"
    echo ""
    echo "1. Frontend (Already deployed to Vercel):"
    echo "   Visit: https://vercel.com/deployments"
    echo ""
    echo "2. Backend (Manual deployment to Render):"
    echo "   - Go to https://render.com"
    echo "   - Create new Web Service"
    echo "   - Connect your GitHub repo"
    echo "   - Root Directory: backend"
    echo "   - Build: pip install -r requirements.txt"
    echo "   - Start: uvicorn main:app --host 0.0.0.0 --port 8000"
    echo ""
    echo "3. API Server (Manual deployment to Railway):"
    echo "   - Go to https://railway.app"
    echo "   - Create new project from GitHub"
    echo "   - Root Directory: api"
    echo "   - Start: node server.js"
    echo ""
    echo "4. Environment Variables:"
    echo "   - Set in each platform's dashboard"
    echo "   - See DEPLOYMENT.md for details"
    echo ""
    echo "5. Database & Redis:"
    echo "   - Use Render PostgreSQL addon"
    echo "   - Use Upstash Redis (serverless)"
    echo ""
    echo -e "${YELLOW}Full documentation: DEPLOYMENT.md${NC}"
    echo ""
}

# Main execution
main() {
    print_header "Lumina AI Learning - Deployment Script"
    
    # Run checks and setup
    check_dependencies
    install_cli_tools
    prepare_git
    
    # Ask for deployment type
    echo ""
    echo -e "${BLUE}Which would you like to deploy?${NC}"
    echo "1) Frontend only (Vercel)"
    echo "2) Full deployment (requires Vercel, Render, Railway accounts)"
    echo "3) Show instructions only"
    echo ""
    read -p "Enter choice (1-3): " choice
    
    case $choice in
        1)
            deploy_frontend
            show_instructions
            ;;
        2)
            deploy_frontend
            show_instructions
            ;;
        3)
            show_instructions
            ;;
        *)
            print_error "Invalid choice"
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
