import sys
import os
from typing import List

# Add backend to path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.core.middleware import RBAC_RULES

def simulate_rbac(path: str, user_roles: List[str]) -> bool:
    """Simulates the SentinelMiddleware RBAC logic."""
    # Check against all rules
    for prefix, allowed_roles in RBAC_RULES.items():
        if path.startswith(prefix):
            # SuperAdmin bypass
            if "super_admin" in user_roles:
                continue
            
            # Check if user has any of the allowed roles
            if not any(role in user_roles for role in allowed_roles):
                return False # Access denied
                
    return True # Access granted or no rule matched

# Test cases: (Path, Roles, Expected Result)
test_cases = [
    ("/api/admin/stats", ["admin"], True),
    ("/api/admin/stats", ["student"], False),
    ("/api/admin/stats", ["super_admin"], True), # Bypass
    ("/api/hod/dashboard", ["hod"], True),
    ("/api/hod/dashboard", ["faculty"], False),
    ("/api/hod/dashboard", ["admin"], True),
    ("/api/faculty/courses", ["faculty"], True),
    ("/api/faculty/courses", ["hod"], True),
    ("/api/student/profile", ["student"], True),
    ("/api/student/profile", ["teacher"], True), # Teachers can view student profiles
    ("/api/parent/children", ["parent"], True),
    ("/api/parent/children", ["student"], False),
    ("/api/alumni/network", ["alumni"], True),
    ("/api/alumni/network", ["student"], False),
    ("/api/content-creator/upload", ["content_creator"], True),
    ("/api/content-creator/upload", ["faculty"], False),
    ("/api/super-admin/users", ["super_admin"], True),
    ("/api/super-admin/users", ["admin"], False), # Strict super_admin route
    ("/auth/login", ["student"], True), # No RBAC rule for /auth (unprotected)
]

def run_tests():
    print("--- RBAC Verification Start ---")
    failed = 0
    for path, roles, expected in test_cases:
        result = simulate_rbac(path, roles)
        status = "PASS" if result == expected else "FAIL"
        if result != expected:
            failed += 1
        print(f"[{status}] Path: {path:<25} Roles: {str(roles):<30} Expected: {expected} Result: {result}")
    
    print("--- RBAC Verification End ---")
    if failed == 0:
        print("ALL TESTS PASSED!")
    else:
        print(f"{failed} TESTS FAILED!")
        sys.exit(1)

if __name__ == "__main__":
    run_tests()
