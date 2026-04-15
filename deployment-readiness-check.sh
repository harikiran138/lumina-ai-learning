#!/bin/bash
# DEPLOYMENT READINESS VERIFICATION SCRIPT
# This script is the final verification step before production deployment

set -e

echo "================================================================================"
echo "LUMINA ONBOARDING SYSTEM - DEPLOYMENT READINESS VERIFICATION"
echo "================================================================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_count=0
pass_count=0

# Function to check file existence
check_file() {
    local file=$1
    local description=$2
    check_count=$((check_count + 1))
    
    if [ -f "$file" ]; then
        echo -e "${GREEN}✅${NC} $description"
        pass_count=$((pass_count + 1))
    else
        echo -e "${RED}❌${NC} $description - File not found: $file"
    fi
}

# Function to check directory existence
check_dir() {
    local dir=$1
    local description=$2
    check_count=$((check_count + 1))
    
    if [ -d "$dir" ]; then
        echo -e "${GREEN}✅${NC} $description"
        pass_count=$((pass_count + 1))
    else
        echo -e "${RED}❌${NC} $description - Directory not found: $dir"
    fi
}

# Function to check command executable
check_command() {
    local cmd=$1
    local description=$2
    check_count=$((check_count + 1))
    
    if command -v "$cmd" &> /dev/null; then
        echo -e "${GREEN}✅${NC} $description"
        pass_count=$((pass_count + 1))
    else
        echo -e "${RED}❌${NC} $description - Command not found: $cmd"
    fi
}

echo "[SECTION 1] Backend Services"
echo "---"
check_dir "backend/app/services/onboarding" "Onboarding services directory exists"
check_file "backend/app/services/onboarding/student_service.py" "Student service"
check_file "backend/app/services/onboarding/peer_tutor_service.py" "Peer tutor service"
check_file "backend/app/services/onboarding/validators.py" "Validators module"
check_file "backend/app/routers/onboarding_unified.py" "Unified router"
echo ""

echo "[SECTION 2] Database Migrations"
echo "---"
check_file "backend/migrations/011_onboarding_core_schema.sql" "Migration 011"
check_file "backend/migrations/012_onboarding_profiles_schema.sql" "Migration 012"
check_file "backend/migrations/013_onboarding_analytics_views.sql" "Migration 013"
echo ""

echo "[SECTION 3] Testing Infrastructure"
echo "---"
check_file "backend/tests/test_onboarding_integration.py" "Integration test suite"
check_file "backend/tests/__init__.py" "Tests package init"
check_file "backend/tests/README.md" "Test documentation"
echo ""

echo "[SECTION 4] Deployment Tools"
echo "---"
check_file "backend/scripts/verify_onboarding_deployment.py" "Verification script"
check_file "backend/scripts/run_onboarding_migrations.py" "Migration runner"
check_file "backend/scripts/__init__.py" "Scripts package init"
check_file "backend/scripts/README.md" "Tools documentation"
echo ""

echo "[SECTION 5] Documentation"
echo "---"
check_file "DEPLOYMENT_CHECKLIST_ONBOARDING.md" "Deployment checklist"
check_file "LUMINA_ONBOARDING_DELIVERABLES.md" "Deliverables document"
check_file "FINAL_VERIFICATION_REPORT.md" "Verification report"
check_file "PROJECT_COMPLETION_SUMMARY.md" "Completion summary"
check_file "DOCUMENTATION_INDEX_ONBOARDING.md" "Documentation index"
echo ""

echo "[SECTION 6] System Requirements"
echo "---"
check_command "python" "Python executable"
check_command "psql" "PostgreSQL client"
echo ""

echo "[SECTION 7] Python Environment"
echo "---"
if python -c "import pytest" 2>/dev/null; then
    echo -e "${GREEN}✅${NC} pytest installed"
    pass_count=$((pass_count + 1))
else
    echo -e "${YELLOW}⚠️${NC} pytest not installed (run: pip install pytest pytest-asyncio)"
fi
check_count=$((check_count + 1))

if python -c "import psycopg2" 2>/dev/null; then
    echo -e "${GREEN}✅${NC} psycopg2 installed"
    pass_count=$((pass_count + 1))
else
    echo -e "${YELLOW}⚠️${NC} psycopg2 not installed (run: pip install psycopg2-binary)"
fi
check_count=$((check_count + 1))
echo ""

# Summary
echo "================================================================================"
echo "SUMMARY"
echo "================================================================================"
echo "Checks Passed: $pass_count / $check_count"
echo ""

if [ $pass_count -eq $check_count ]; then
    echo -e "${GREEN}✅ ALL CHECKS PASSED - SYSTEM READY FOR DEPLOYMENT${NC}"
    exit 0
else
    missing=$((check_count - pass_count))
    echo -e "${RED}❌ $missing checks failed - Please address issues before deployment${NC}"
    exit 1
fi
