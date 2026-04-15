#!/bin/bash

# 🚀 QUICK AUTH TESTING REFERENCE - ONE-LINER COMMANDS
# Copy & paste these commands to quickly test auth for each role

# 🎯 SETUP
export API_BASE="http://localhost:8000"
export TEST_EMAIL_BASE="test_$(date +%s)"
export TEST_PASS="SecurePass123!"

# ═══════════════════════════════════════════════════════════════════════════
# 🏃 QUICK TEST - Run this first
# ═══════════════════════════════════════════════════════════════════════════

echo "🧪 Running quick auth test suite..."
node verify_all_auth_roles.js

# ═══════════════════════════════════════════════════════════════════════════
# 👤 ROLE-BY-ROLE QUICK TESTS
# ═══════════════════════════════════════════════════════════════════════════

# 🟢 STUDENT SIGNUP
curl -X POST $API_BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL_BASE}_student@lumina.ai\",
    \"password\": \"${TEST_PASS}\",
    \"full_name\": \"Test Student Quickstart\",
    \"role\": \"student\"
  }"

# 🟢 STUDENT LOGIN
curl -X POST $API_BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"user\": {
      \"identifier\": \"${TEST_EMAIL_BASE}_student@lumina.ai\",
      \"password\": \"${TEST_PASS}\"
    },
    \"payload\": {
      \"role\": \"student\"
    }
  }"

# 🟢 TEACHER SIGNUP
curl -X POST $API_BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL_BASE}_teacher@lumina.ai\",
    \"password\": \"${TEST_PASS}\",
    \"full_name\": \"Test Teacher Quickstart\",
    \"role\": \"teacher\"
  }"

# 🟢 TEACHER LOGIN
curl -X POST $API_BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"user\": {
      \"identifier\": \"${TEST_EMAIL_BASE}_teacher@lumina.ai\",
      \"password\": \"${TEST_PASS}\"
    },
    \"payload\": {
      \"role\": \"teacher\"
    }
  }"

# 🟢 PARENT SIGNUP
curl -X POST $API_BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL_BASE}_parent@lumina.ai\",
    \"password\": \"${TEST_PASS}\",
    \"full_name\": \"Test Parent Quickstart\",
    \"role\": \"parent\"
  }"

# 🟢 MENTOR SIGNUP
curl -X POST $API_BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL_BASE}_mentor@lumina.ai\",
    \"password\": \"${TEST_PASS}\",
    \"full_name\": \"Test Mentor Quickstart\",
    \"role\": \"mentor\"
  }"

# 🟢 PEER_TUTOR SIGNUP
curl -X POST $API_BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL_BASE}_peer_tutor@lumina.ai\",
    \"password\": \"${TEST_PASS}\",
    \"full_name\": \"Test Peer Tutor Quickstart\",
    \"role\": \"peer_tutor\"
  }"

# 🟢 RESEARCHER SIGNUP
curl -X POST $API_BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL_BASE}_researcher@lumina.ai\",
    \"password\": \"${TEST_PASS}\",
    \"full_name\": \"Test Researcher Quickstart\",
    \"role\": \"researcher\"
  }"

# ═══════════════════════════════════════════════════════════════════════════
# 🔴 INVITE-ONLY ROLES (Should fail with 403)
# ═══════════════════════════════════════════════════════════════════════════

# 🔴 ADMIN SIGNUP (Should fail)
echo "Testing admin - should fail with 403:"
curl -X POST $API_BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL_BASE}_admin@lumina.ai\",
    \"password\": \"${TEST_PASS}\",
    \"full_name\": \"Test Admin Quickstart\",
    \"role\": \"admin\"
  }"

# 🔴 HOD SIGNUP (Should fail)
echo "Testing hod - should fail with 403:"
curl -X POST $API_BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL_BASE}_hod@lumina.ai\",
    \"password\": \"${TEST_PASS}\",
    \"full_name\": \"Test HOD Quickstart\",
    \"role\": \"hod\"
  }"

# 🔴 COLLEGE_ADMIN SIGNUP (Should fail)
echo "Testing college_admin - should fail with 403:"
curl -X POST $API_BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL_BASE}_college_admin@lumina.ai\",
    \"password\": \"${TEST_PASS}\",
    \"full_name\": \"Test College Admin Quickstart\",
    \"role\": \"college_admin\"
  }"

# ═══════════════════════════════════════════════════════════════════════════
# ❌ ERROR SCENARIOS
# ═══════════════════════════════════════════════════════════════════════════

# ❌ Invalid credentials (Should fail with 401)
echo "Testing invalid credentials - should fail with 401:"
curl -X POST $API_BASE/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{
    \"user\": {
      \"identifier\": \"nonexistent@lumina.ai\",
      \"password\": \"WrongPassword\"
    },
    \"payload\": {
      \"role\": \"student\"
    }
  }"

# ❌ Missing email (Should fail with 422)
echo "Testing missing email - should fail with 422:"
curl -X POST $API_BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"\",
    \"password\": \"${TEST_PASS}\",
    \"full_name\": \"Test User\",
    \"role\": \"student\"
  }"

# ❌ Weak password (Should fail with 422)
echo "Testing weak password - should fail with 422:"
curl -X POST $API_BASE/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${TEST_EMAIL_BASE}_weak@lumina.ai\",
    \"password\": \"weak\",
    \"full_name\": \"Test User\",
    \"role\": \"student\"
  }"

# ═══════════════════════════════════════════════════════════════════════════
# 📊 TEST MATRIX VERIFICATION
# ═══════════════════════════════════════════════════════════════════════════

cat << 'EOF'

═══════════════════════════════════════════════════════════════════════════════
📊 QUICK REFERENCE - EXPECTED RESULTS

SELF-SIGNUP ROLES (All should succeed - 201 Signup, 200 Login):
┌─────────────┬──────────┬────────┐
│ Role        │ Signup   │ Login  │
├─────────────┼──────────┼────────┤
│ Student     │ ✅ 201   │ ✅ 200 │
│ Teacher     │ ✅ 201   │ ✅ 200 │
│ Parent      │ ✅ 201   │ ✅ 200 │
│ Mentor      │ ✅ 201   │ ✅ 200 │
│ Peer Tutor  │ ✅ 201   │ ✅ 200 │
│ Researcher  │ ✅ 201   │ ✅ 200 │
└─────────────┴──────────┴────────┘

INVITE-ONLY ROLES (All should fail - 403 Signup):
┌──────────────┬──────────────┐
│ Role         │ Signup       │
├──────────────┼──────────────┤
│ Admin        │ ❌ 403       │
│ HOD          │ ❌ 403       │
│ College Admin│ ❌ 403       │
└──────────────┴──────────────┘

ERROR SCENARIOS:
┌─────────────────────┬──────────────┐
│ Scenario            │ Expected     │
├─────────────────────┼──────────────┤
│ Invalid Credentials │ ❌ 401       │
│ Missing Email       │ ❌ 422       │
│ Weak Password       │ ❌ 422       │
│ Duplicate Email     │ ❌ 400       │
└─────────────────────┴──────────────┘

═══════════════════════════════════════════════════════════════════════════════

NEXT STEPS:
1. Run: node verify_all_auth_roles.js
2. Check Network tab in DevTools
3. Verify response codes match expected
4. Check console for errors
5. Document results

═══════════════════════════════════════════════════════════════════════════════
EOF
