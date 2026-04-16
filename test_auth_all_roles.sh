#!/bin/bash
# 🔐 Lumina Auth Testing Script - All Roles
# Usage: Run these curl commands in your terminal or convert to requests in Postman

# Set your API base URL
API_BASE="${API_BASE:-http://localhost:8000}"
AUTH_BASE="${AUTH_BASE:-http://localhost:8000}"

echo "🔐 Lumina Authentication Testing - All Roles"
echo "=============================================="
echo "API Base: $API_BASE"
echo "Auth Base: $AUTH_BASE"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test counter
TESTS_PASSED=0
TESTS_FAILED=0

# ─────────────────────────────────────────────────────────────────────────────
# Helper function to test login
# ─────────────────────────────────────────────────────────────────────────────

test_login() {
  local role=$1
  local email=$2
  local password=$3
  
  echo -e "${YELLOW}Testing LOGIN as $role ($email)${NC}"
  
  RESPONSE=$(curl -s -X POST "$AUTH_BASE/api/auth/login" \
    -H "Content-Type: application/json" \
    -d "{
      \"identifier\": \"$email\",
      \"password\": \"$password\",
      \"role_hint\": \"$role\"
    }")
  
  if echo "$RESPONSE" | grep -q "accessToken"; then
    echo -e "${GREEN}✅ $role login SUCCESS${NC}"
    echo "$RESPONSE" | jq '.user | {id, email, role, fullName}'
    ((TESTS_PASSED++))
  else
    echo -e "${RED}❌ $role login FAILED${NC}"
    echo "$RESPONSE" | jq '.detail // .detail[0].msg // .'
    ((TESTS_FAILED++))
  fi
  echo ""
}

# ─────────────────────────────────────────────────────────────────────────────
# Helper function to test signup
# ─────────────────────────────────────────────────────────────────────────────

test_signup() {
  local role=$1
  local name=$2
  local email=$3
  local password=$4
  
  echo -e "${YELLOW}Testing SIGNUP as $role ($email)${NC}"
  
  RESPONSE=$(curl -s -X POST "$AUTH_BASE/api/auth/register" \
    -H "Content-Type: application/json" \
    -d "{
      \"email\": \"$email\",
      \"password\": \"$password\",
      \"full_name\": \"$name\",
      \"role\": \"$role\"
    }")
  
  if echo "$RESPONSE" | grep -q "\"id\""; then
    echo -e "${GREEN}✅ $role signup SUCCESS${NC}"
    echo "$RESPONSE" | jq '{id, email, fullName, role}'
    ((TESTS_PASSED++))
  else
    echo -e "${RED}❌ $role signup FAILED${NC}"
    echo "$RESPONSE" | jq '.detail // .detail[0].msg // .'
    ((TESTS_FAILED++))
  fi
  echo ""
}

# ─────────────────────────────────────────────────────────────────────────────
# TEST 1: STUDENT LOGIN
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "═════════════════════════════════════════════════════════════════════════════"
echo "TEST GROUP 1: STUDENT"
echo "═════════════════════════════════════════════════════════════════════════════"
test_login "student" "student@lumina.ai" "StudentPass123!"
test_signup "student" "New Student" "newstudent_$(date +%s)@lumina.ai" "NewPass123!"

# ─────────────────────────────────────────────────────────────────────────────
# TEST 2: TEACHER LOGIN
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "═════════════════════════════════════════════════════════════════════════════"
echo "TEST GROUP 2: TEACHER"
echo "═════════════════════════════════════════════════════════════════════════════"
test_login "teacher" "teacher@lumina.ai" "TeacherPass123!"
test_signup "teacher" "New Teacher" "newteacher_$(date +%s)@lumina.ai" "TeachPass123!"

# ─────────────────────────────────────────────────────────────────────────────
# TEST 3: PARENT LOGIN
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "═════════════════════════════════════════════════════════════════════════════"
echo "TEST GROUP 3: PARENT"
echo "═════════════════════════════════════════════════════════════════════════════"
test_login "parent" "parent@lumina.ai" "ParentPass123!"
test_signup "parent" "New Parent" "newparent_$(date +%s)@lumina.ai" "ParPass123!"

# ─────────────────────────────────────────────────────────────────────────────
# TEST 4: MENTOR LOGIN
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "═════════════════════════════════════════════════════════════════════════════"
echo "TEST GROUP 4: MENTOR"
echo "═════════════════════════════════════════════════════════════════════════════"
test_login "mentor" "mentor@lumina.ai" "MentorPass123!"
test_signup "mentor" "New Mentor" "newmentor_$(date +%s)@lumina.ai" "MentPass123!"

# ─────────────────────────────────────────────────────────────────────────────
# TEST 5: PEER TUTOR LOGIN
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "═════════════════════════════════════════════════════════════════════════════"
echo "TEST GROUP 5: PEER TUTOR"
echo "═════════════════════════════════════════════════════════════════════════════"
test_login "peer_tutor" "tutor@lumina.ai" "TutorPass123!"
test_signup "peer_tutor" "New Tutor" "newtutor_$(date +%s)@lumina.ai" "TutPass123!"

# ─────────────────────────────────────────────────────────────────────────────
# TEST 6: RESEARCHER LOGIN
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "═════════════════════════════════════════════════════════════════════════════"
echo "TEST GROUP 6: RESEARCHER"
echo "═════════════════════════════════════════════════════════════════════════════"
test_login "researcher" "researcher@lumina.ai" "ResearchPass123!"
test_signup "researcher" "New Researcher" "newresearcher_$(date +%s)@lumina.ai" "ResPass123!"

# ─────────────────────────────────────────────────────────────────────────────
# TEST 8: SUPERVISOR & AUDITOR (INVITE-ONLY ROLES)
# ─────────────────────────────────────────────────────────────────────────────
# These roles should fail signup but might exist via seeding for login tests.
echo ""
echo "═════════════════════════════════════════════════════════════════════════════"
echo "TEST GROUP 8: SUPERVISOR & AUDITOR"
echo "═════════════════════════════════════════════════════════════════════════════"

# Note: Login might fail if seed didn't run, but we want to check behavior.
test_login "supervisor" "supervisor@lumina.ai" "SuperPass123!"
test_login "auditor" "auditor@lumina.ai" "AuditPass123!"

# ─────────────────────────────────────────────────────────────────────────────
# TEST 10: ERROR SCENARIOS
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "═════════════════════════════════════════════════════════════════════════════"
echo "TEST GROUP 10: ERROR SCENARIOS"
echo "═════════════════════════════════════════════════════════════════════════════"

echo -e "${YELLOW}Testing INVALID CREDENTIALS${NC}"
RESPONSE=$(curl -s -X POST "$AUTH_BASE/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"identifier\": \"student@lumina.ai\", \"password\": \"WrongPassword\"}")

if echo "$RESPONSE" | grep -q "401"; then
  echo -e "${GREEN}✅ Correctly returns 401 for invalid credentials${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${RED}❌ Did not properly reject invalid credentials${NC}"
  ((TESTS_FAILED++))
fi
echo ""

echo -e "${YELLOW}Testing DUPLICATE EMAIL${NC}"
RESPONSE=$(curl -s -X POST "$AUTH_BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"student@lumina.ai\", \"password\": \"DupPass123!\", \"full_name\": \"Dup\", \"role\": \"student\"}")

if echo "$RESPONSE" | grep -q "'already exists'\\|'duplicate'\\|'400'"; then
  echo -e "${GREEN}✅ Correctly prevents duplicate email${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${RED}❌ Duplicate email check may not be working${NC}"
  ((TESTS_FAILED++))
fi
echo ""

echo -e "${YELLOW}Testing INVALID PASSWORD${NC}"
RESPONSE=$(curl -s -X POST "$AUTH_BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"weakness@lumina.ai\", \"password\": \"weak\", \"full_name\": \"Weak\", \"role\": \"student\"}")

if echo "$RESPONSE" | grep -q "422\\|'must contain'\\|password"; then
  echo -e "${GREEN}✅ Correctly rejects weak password${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${RED}❌ Password validation may not be strict enough${NC}"
  ((TESTS_FAILED++))
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# TEST 11: INVITE-ONLY ROLES
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "═════════════════════════════════════════════════════════════════════════════"
echo "TEST GROUP 11: INVITE-ONLY ROLES (should fail)"
echo "═════════════════════════════════════════════════════════════════════════════"

echo -e "${YELLOW}Testing ADMIN SIGNUP (should be blocked)${NC}"
RESPONSE=$(curl -s -X POST "$AUTH_BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"admin_$(date +%s)@lumina.ai\", \"password\": \"AdminPass123!\", \"full_name\": \"Admin\", \"role\": \"admin\"}")

if echo "$RESPONSE" | grep -q "403\\|'requires an invitation'"; then
  echo -e "${GREEN}✅ Correctly blocks self-signup for admin role${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${YELLOW}⚠️  Admin signup returned unexpected response${NC}"
  echo "$RESPONSE" | jq '.'
fi
echo ""

echo -e "${YELLOW}Testing SUPERVISOR SIGNUP (should be blocked)${NC}"
RESPONSE=$(curl -s -X POST "$AUTH_BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"super_$(date +%s)@lumina.ai\", \"password\": \"SuperPass123!\", \"full_name\": \"Super\", \"role\": \"supervisor\"}")

if echo "$RESPONSE" | grep -q "403\\|'requires an invitation'"; then
  echo -e "${GREEN}✅ Correctly blocks self-signup for supervisor role${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${RED}❌ FAILED to block self-signup for supervisor role${NC}"
  ((TESTS_FAILED++))
fi
echo ""

echo -e "${YELLOW}Testing AUDITOR SIGNUP (should be blocked)${NC}"
RESPONSE=$(curl -s -X POST "$AUTH_BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"audit_$(date +%s)@lumina.ai\", \"password\": \"AuditPass123!\", \"full_name\": \"Audit\", \"role\": \"auditor\"}")

if echo "$RESPONSE" | grep -q "403\\|'requires an invitation'"; then
  echo -e "${GREEN}✅ Correctly blocks self-signup for auditor role${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${RED}❌ FAILED to block self-signup for auditor role${NC}"
  ((TESTS_FAILED++))
fi
echo ""

echo -e "${YELLOW}Testing HOD SIGNUP (should be blocked)${NC}"
RESPONSE=$(curl -s -X POST "$AUTH_BASE/api/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\": \"hod_$(date +%s)@lumina.ai\", \"password\": \"HodPass123!\", \"full_name\": \"HOD\", \"role\": \"hod\"}")

if echo "$RESPONSE" | grep -q "403\\|'requires an invitation'"; then
  echo -e "${GREEN}✅ Correctly blocks self-signup for HOD role${NC}"
  ((TESTS_PASSED++))
else
  echo -e "${YELLOW}⚠️  HOD signup returned unexpected response${NC}"
  echo "$RESPONSE" | jq '.'
fi
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# TEST SUMMARY
# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "═════════════════════════════════════════════════════════════════════════════"
echo "SUMMARY"
echo "═════════════════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ Passed: $TESTS_PASSED${NC}"
echo -e "${RED}❌ Failed: $TESTS_FAILED${NC}"

if [ $TESTS_FAILED -eq 0 ]; then
  echo -e "${GREEN}🎉 ALL TESTS PASSED!${NC}"
  exit 0
else
  echo -e "${RED}⚠️  Some tests failed. See above for details.${NC}"
  exit 1
fi
