import httpx
import subprocess
import time
import os
import sys
from termcolor import colored

PORT = 8001
BASE_URL = f"http://localhost:{PORT}/api"

def run_tests():
    print(colored("\n🚀 LUMINA SHIELD V1 - FINAL VERIFICATION", "cyan", attrs=["bold"]))
    
    # 1. Auth Locked (No token)
    print(colored("\n[GATE 1] Auth Restoration (R-001)", "blue"))
    try:
        r = httpx.get(f"{BASE_URL}/auth/me")
        if r.status_code == 401:
            print(colored("✅ PASS: Anonymous access rejected as expected (401)", "green"))
        else:
            print(colored(f"❌ FAIL: Expected 401, got {r.status_code}", "red"))
    except Exception as e:
        print(colored(f"⚠️ ERROR: {e}", "yellow"))

    # 2. CORS Lockdown
    print(colored("\n[GATE 2] CORS Lockdown (R-002)", "blue"))
    try:
        headers = {"Origin": "https://evil-attacker.com"}
        r = httpx.options(f"{BASE_URL}/auth/me", headers=headers)
        if "Access-Control-Allow-Origin" not in r.headers:
            print(colored("✅ PASS: Malicious origin rejected (No CORS headers)", "green"))
        else:
            print(colored(f"❌ FAIL: Origin allowed: {r.headers.get('Access-Control-Allow-Origin')}", "red"))
    except Exception as e:
        print(colored(f"⚠️ ERROR: {e}", "yellow"))

    # 3. Bypass Removal
    print(colored("\n[GATE 3] Bypass Removal (R-003)", "blue"))
    try:
        headers = {"Authorization": "Bearer admin_debug_v1_bypass"}
        r = httpx.get(f"{BASE_URL}/auth/me", headers=headers)
        if r.status_code == 401:
            print(colored("✅ PASS: Hardcoded bypass token rejected (401)", "green"))
        else:
            print(colored(f"❌ FAIL: Bypass token still works! (Code {r.status_code})", "red"))
    except Exception as e:
        print(colored(f"⚠️ ERROR: {e}", "yellow"))

if __name__ == "__main__":
    run_tests()
