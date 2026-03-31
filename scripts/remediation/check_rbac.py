import sys
import os

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.core.rbac import normalize_role, Role
from termcolor import colored

def test_rbac():
    print(colored("\n[GATE 5] RBAC Consolidation (R-004) Verification", "cyan", attrs=["bold"]))
    
    test_cases = [
        ("teacher", "faculty"),
        ("admin", "super_admin"),
        ("STUDENT ", "student"),
        ("Faculty", "faculty"),
        (None, "student"),
        ("unknown", "student")
    ]
    
    all_pass = True
    for input_val, expected in test_cases:
        actual = normalize_role(input_val)
        if actual == expected:
            print(colored(f"PASS: {input_val} -> {actual}", "green"))
        else:
            print(colored(f"FAIL: {input_val} -> {actual} (Expected {expected})", "red"))
            all_pass = False
            
    if all_pass:
        print(colored("\nALL RBAC NORMALIZATION GATES SECURE", "green", attrs=["bold"]))

if __name__ == "__main__":
    test_rbac()
