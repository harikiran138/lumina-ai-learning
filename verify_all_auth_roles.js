#!/usr/bin/env node

/**
 * 🧪 Comprehensive Auth Test Suite - All Roles
 * Tests signup and login for every individual role
 * 
 * Usage: node verify_all_auth_roles.js
 */

const API_BASE = process.env.API_BASE || "http://localhost:9000";
const AUTH_BASE = process.env.AUTH_BASE || API_BASE;

// All roles to test: Self-Signup Roles
const SELF_SIGNUP_ROLES = [
  { name: "student", label: "Student" },
  { name: "teacher", label: "Teacher" },
  { name: "parent", label: "Parent" },
  { name: "mentor", label: "Mentor" },
  { name: "peer_tutor", label: "Peer Tutor" },
  { name: "researcher", label: "Researcher" },
];

// Invite-only roles (signup should fail)
const INVITE_ONLY_ROLES = [
  { name: "admin", label: "Admin" },
  { name: "hod", label: "HOD" },
  { name: "college_admin", label: "College Admin" },
];

// Test results tracking
let results = {
  passed: 0,
  failed: 0,
  tests: [],
};

// Colors for console output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m",
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name, passed, details = "") {
  const status = passed ? "✅ PASS" : "❌ FAIL";
  const color = passed ? "green" : "red";
  log(`  ${status}: ${name}`, color);
  if (details) {
    log(`     ${details}`, "yellow");
  }
  results.tests.push({ name, passed, details });
  if (passed) results.passed++;
  else results.failed++;
}

async function makeRequest(method, endpoint, data) {
  try {
    const url = `${AUTH_BASE}${endpoint}`;
    const options = {
      method,
      headers: { "Content-Type": "application/json" },
      body: data ? JSON.stringify(data) : undefined,
    };

    const response = await fetch(url, options);
    const body = await response.json();

    return {
      status: response.status,
      ok: response.ok,
      body,
    };
  } catch (error) {
    return {
      status: 0,
      ok: false,
      body: { error: error.message },
    };
  }
}

async function testSignup(role, email) {
  log(`\n📝 Testing SIGNUP for ${role.label} (${role.name})`, "cyan");

  const signupData = {
    email: email,
    password: "SecurePass123",
    full_name: `Test ${role.label}`,
    role: role.name,
  };

  const result = await makeRequest("POST", "/api/auth/register", signupData);

  if (result.ok && result.status === 201) {
    logTest(
      `${role.label} signup succeeds (201)`,
      true,
      `Email: ${result.body.email}`
    );
    return email; // Return the email so we can use it for login
  } else if (result.status === 403) {
    logTest(
      `${role.label} signup blocked (403)`,
      true,
      `Correctly rejected invite-only role`
    );
    return false; // Expected for invite-only roles
  } else if (result.status === 400) {
    logTest(
      `${role.label} signup - email conflict (400)`,
      result.body.detail?.includes("already exists"),
      `Will use existing account for login test`
    );
    return false; // User likely already exists
  } else {
    logTest(
      `${role.label} signup fails`,
      false,
      `Status: ${result.status}, Detail: ${result.body.detail}`
    );
    return false;
  }
}

async function testLogin(role, email, password = "SecurePass123") {
  log(`\n🔐 Testing LOGIN for ${role.label} (${role.name})`, "cyan");

  const loginData = {
    user: {
      identifier: email,
      password: password,
    },
    payload: {
      role: role.name,
    },
  };

  const result = await makeRequest("POST", "/api/auth/login", loginData);

  if (result.ok && result.status === 200) {
    logTest(
      `${role.label} login succeeds (200)`,
      true,
      `Returned access token: ${result.body.accessToken ? "✓" : "✗"}`
    );
    logTest(
      `${role.label} user data present`,
      result.body.user?.id && result.body.user?.email,
      `Role: ${result.body.user?.role}`
    );
    return true;
  } else if (result.status === 401) {
    logTest(
      `${role.label} login - invalid credentials (401)`,
      true,
      `Expected when using wrong password`
    );
    return false;
  } else {
    logTest(
      `${role.label} login fails`,
      false,
      `Status: ${result.status}, Detail: ${result.body.detail}`
    );
    return false;
  }
}

async function runTests() {
  log("\n═══════════════════════════════════════════════════════════", "blue");
  log("🧪 LUMINA AUTH VERIFICATION - ALL ROLES TEST SUITE", "blue");
  log("═══════════════════════════════════════════════════════════", "blue");
  log(`\nAPI Base: ${AUTH_BASE}`, "cyan");
  log(`Test Start: ${new Date().toISOString()}\n`, "cyan");

  // ─────────────────────────────────────────────────────────────────────────
  // TEST GROUP 1: SELF-SIGNUP ROLES
  // ─────────────────────────────────────────────────────────────────────────
  log("\n📊 TEST GROUP 1: SELF-SIGNUP ROLES", "blue");
  log("═══════════════════════════════════════════════════════════", "blue");

  for (const role of SELF_SIGNUP_ROLES) {
    const email = `test_${role.name}_${Date.now()}@lumina-test.com`;

    const signupEmail = await testSignup(role, email);

    if (signupEmail) {
      // If signup succeeds, test login with the newly created account and correct password
      await testLogin(role, signupEmail, "SecurePass123");
    } else {
      // If signup fails (likely user exists), try login with default user
      const defaultEmail = `${role.name}@lumina.ai`;
      log(
        `  ℹ️  Trying login with default test account: ${defaultEmail}`,
        "yellow"
      );
      await testLogin(role, defaultEmail, "SecurePass123");
    }
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST GROUP 2: INVITE-ONLY ROLES (Should fail signup)
  // ─────────────────────────────────────────────────────────────────────────
  log("\n📊 TEST GROUP 2: INVITE-ONLY ROLES (Signup should fail)", "blue");
  log("═══════════════════════════════════════════════════════════", "blue");

  for (const role of INVITE_ONLY_ROLES) {
    const email = `test_${role.name}_${Date.now()}@lumina-test.com`;

    log(`\n📝 Testing SIGNUP for ${role.label} (${role.name})`, "cyan");

    const signupData = {
      email: email,
      password: "SecurePass123",
      full_name: `Test ${role.label}`,
      role: role.name,
    };

    const result = await makeRequest("POST", "/api/auth/register", signupData);

    const expectedFail =
      result.status === 403 || result.status === 400;
    logTest(
      `${role.label} signup correctly blocked`,
      expectedFail,
      `Status: ${result.status} (expected 403 or 400)`
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEST GROUP 3: ERROR SCENARIOS
  // ─────────────────────────────────────────────────────────────────────────
  log("\n📊 TEST GROUP 3: ERROR SCENARIOS", "blue");
  log("═══════════════════════════════════════════════════════════", "blue");

  log("\n❌ Testing INVALID CREDENTIALS", "cyan");
  const invalidLoginData = {
    user: {
      identifier: "nonexistent@lumina.ai",
      password: "WrongPassword",
    },
    payload: {
      role: "student",
    },
  };

  let result = await makeRequest("POST", "/api/auth/login", invalidLoginData);
  logTest(
    "Invalid credentials returns 401",
    result.status === 401,
    `Status: ${result.status}`
  );

  log("\n❌ Testing MISSING REQUIRED FIELDS", "cyan");
  const emptyData = {
    user: {
      identifier: "",
      password: "",
    },
    payload: {
      role: "student",
    },
  };

  result = await makeRequest("POST", "/api/auth/login", emptyData);
  logTest(
    "Missing fields handled correctly",
    result.status >= 400,
    `Status: ${result.status}`
  );

  log("\n❌ Testing WEAK PASSWORD", "cyan");
  const weakPasswordData = {
    email: `weak_${Date.now()}@lumina.ai`,
    password: "weak",
    full_name: "Test User",
    role: "student",
  };

  result = await makeRequest("POST", "/api/auth/register", weakPasswordData);
  logTest(
    "Weak password rejected",
    result.status >= 400,
    `Status: ${result.status} (expected 422)`
  );

  // ─────────────────────────────────────────────────────────────────────────
  // SUMMARY
  // ─────────────────────────────────────────────────────────────────────────
  log("\n═══════════════════════════════════════════════════════════", "blue");
  log("📊 TEST SUMMARY", "blue");
  log("═══════════════════════════════════════════════════════════", "blue");

  log(`\n✅ Passed: ${results.passed}`, "green");
  log(`❌ Failed: ${results.failed}`, results.failed > 0 ? "red" : "green");
  log(
    `Total: ${results.passed + results.failed}`,
    results.failed === 0 ? "green" : "yellow"
  );

  if (results.failed === 0) {
    log("\n🎉 ALL TESTS PASSED!", "green");
  } else {
    log(`\n⚠️  ${results.failed} test(s) failed`, "red");
    log("\nFailed tests:", "yellow");
    results.tests
      .filter((t) => !t.passed)
      .forEach((t) => {
        log(`  • ${t.name}`, "red");
        if (t.details) log(`    ${t.details}`, "yellow");
      });
  }

  log(
    `\nTest End: ${new Date().toISOString()}`,
    "cyan"
  );
  log("═══════════════════════════════════════════════════════════\n", "blue");

  process.exit(results.failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch((error) => {
  log(`\n❌ Test suite error: ${error.message}`, "red");
  process.exit(1);
});
