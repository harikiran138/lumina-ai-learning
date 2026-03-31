import sys
import os
import requests
import json
from datetime import timedelta

# Add backend to path
sys.path.append(os.path.join(os.path.dirname(__file__), "../../backend"))

from app.core.security import create_access_token
from app.core.config import settings

BASE_URL = "http://localhost:8000"

ROLES = ["student", "faculty", "admin"]
ENDPOINTS = [
    {"path": "/api/student/profile", "expected": {"student": 200, "faculty": 200, "admin": 200, "anon": 401}},
    {"path": "/api/admin/dashboard", "expected": {"student": 403, "faculty": 403, "admin": 200, "anon": 401}},
    {"path": "/api/ai-tutor/chat", "expected": {"student": 200, "faculty": 200, "admin": 200, "anon": 401}},
    {"path": "/api/courses", "expected": {"student": 200, "faculty": 200, "admin": 200, "anon": 401}},
]

def generate_tokens():
    tokens = {}
    for role in ROLES:
        token = create_access_token(
            subject=f"test_{role}@lumina.ai",
            extra_claims={"role": role, "userId": f"uid_{role}"}
        )
        tokens[role] = token
    return tokens

def run_matrix():
    print("\n🚀 Starting Lumina Sentinel: RBAC Permission Matrix Validation\n")
    tokens = generate_tokens()
    
    results = {}
    
    for endpoint in ENDPOINTS:
        path = endpoint["path"]
        results[path] = {}
        
        # Test each role
        for role, token in tokens.items():
            headers = {"Authorization": f"Bearer {token}"}
            try:
                # Use a dummy payload if needed for POSTs, but these are mostly GETs/simulated
                response = requests.get(f"{BASE_URL}{path}", headers=headers, timeout=5)
                status = response.status_code
            except Exception:
                status = "ERROR"
            
            results[path][role] = status
            
        # Test anonymous
        try:
            response = requests.get(f"{BASE_URL}{path}", timeout=5)
            status = response.status_code
        except Exception:
            status = "ERROR"
        results[path]["anon"] = status

    # Generate Report
    print(f"{'Endpoint':<25} | {'Student':<10} | {'Faculty':<10} | {'Admin':<10} | {'Anon':<10}")
    print("-" * 75)
    
    overall_pass = True
    for endpoint in ENDPOINTS:
        path = endpoint["path"]
        row = f"{path:<25} | "
        for actor in ["student", "faculty", "admin", "anon"]:
            actual = results[path][actor]
            expected = endpoint["expected"][actor]
            
            status_str = f"{actual}"
            if actual != expected:
                status_str += f" (!EXP {expected})"
                overall_pass = False
            
            row += f"{status_str:<10} | "
        print(row)
        
    if overall_pass:
        print("\n✅ SENTINEL_PASS: RBAC Matrix is perfectly enforced.")
    else:
        print("\n❌ SENTINEL_FAIL: RBAC violation detected in matrix!")
        sys.exit(1)

if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--run":
        run_matrix()
    else:
        print("Usage: python test_permissions_matrix.py --run")
