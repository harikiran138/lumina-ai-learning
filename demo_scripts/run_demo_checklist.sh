#!/usr/bin/env zsh
# Lumina AI Learning Platform - Demo Readiness Checklist Runner
# Runs all verification tests and generates final report

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "============================================================"
echo "  LUMINA AI LEARNING PLATFORM - DEMO READINESS CHECKLIST"
echo "============================================================"
echo -e "${NC}"
echo ""
echo "Starting comprehensive demo verification..."
echo ""

# Track results
typeset -A RESULTS
TOTAL_COUNT=0
PASS_COUNT=0

# Function to run test
run_test() {
    local name="$1"
    local script="$2"
    
    echo -ne "${BLUE}Running: $name... ${NC}"
    if python3 "$script" > /dev/null 2>&1; then
        RESULTS["$name"]="✓ PASS"
        echo -e "${GREEN}✓ PASS${NC}"
        PASS_COUNT=$((PASS_COUNT + 1))
    else
        RESULTS["$name"]="✗ FAIL"
        echo -e "${RED}✗ FAIL${NC}"
    fi
    TOTAL_COUNT=$((TOTAL_COUNT + 1))
}

# Check Python dependencies
echo -e "${BLUE}Checking Python dependencies...${NC}"
if python3 -c "import httpx, asyncpg, redis" 2>/dev/null; then
    echo -e "${GREEN}✓ Python dependencies OK${NC}"
else
    echo -e "${YELLOW}⚠ Installing missing Python dependencies...${NC}"
    pip3 install httpx asyncpg redis supabase --quiet 2>/dev/null || true
fi
echo ""

# Run all tests
run_test "Infrastructure Test" "$SCRIPT_DIR/test_infrastructure.py"
run_test "Database Integrity Test" "$SCRIPT_DIR/test_database_integrity.py"
run_test "API Endpoints Test" "$SCRIPT_DIR/test_api_endpoints.py"
run_test "AI Verification Flow Test" "$SCRIPT_DIR/test_ai_verification_flow.py"
run_test "Content Pipeline Test" "$SCRIPT_DIR/test_content_pipeline.py"
run_test "Assignment Workflow Test" "$SCRIPT_DIR/test_assignment_workflow.py"

# Generate demo data (optional)
echo -e "${BLUE}Generate demo data? (y/n)${NC}"
read -t 5 -n 1 -r GENERATE_DATA <&1 || GENERATE_DATA='n'
echo ""
if [[ $GENERATE_DATA =~ ^[Yy]$ ]]; then
    run_test "Demo Data Generator" "$SCRIPT_DIR/generate_demo_data.py"
else
    echo -e "${YELLOW}Skipping demo data generation${NC}"
fi

echo ""
echo -e "${BLUE}============================================================"
echo "  FINAL DEMO READINESS REPORT"
echo "============================================================${NC}"
echo ""

# Print results table
echo "Test Results:"
echo ""
for test_name in ${(k)RESULTS}; do
    result="${RESULTS[$test_name]}"
    if [[ $result == *"PASS"* ]]; then
        echo -e "  ${GREEN}${result}${NC} - ${test_name}"
    else
        echo -e "  ${RED}${result}${NC} - ${test_name}"
    fi
done

echo ""
echo -e "${BLUE}============================================================${NC}"
echo ""

echo "Summary: $PASS_COUNT/$TOTAL_COUNT tests passed"
echo ""

if [ $PASS_COUNT -eq $TOTAL_COUNT ]; then
    echo -e "${GREEN}🎉 ALL SYSTEMS READY FOR DEMO!${NC}"
    echo ""
    exit 0
else
    echo -e "${YELLOW}⚠ Some tests failed. Review output above.${NC}"
    echo ""
    exit 1
fi
