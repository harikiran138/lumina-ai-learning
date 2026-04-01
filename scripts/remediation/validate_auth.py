import httpx
from termcolor import colored

def test_auth_lockdown(port=8001):
    print(colored(f"\n[GATE 1] Auth Restoration (R-001) Verification (Port {port})", "cyan", attrs=["bold"]))
    
    url = f"http://localhost:{port}/api/auth/me"
    # Wait, the path might be /api/v1/user/me or /api/v1/auth/me
    # Let's check common paths.
    # In auth.py it was @router.get("/me") and router is /auth
    try:
        r = httpx.get(url)
        if r.status_code == 401:
            print(colored("PASS: Unauthorized access correctly rejected (401)", "green"))
        else:
            print(colored(f"FAIL: Expected 401, got {r.status_code}", "red"))
    except Exception as e:
        print(colored(f"ERROR: Could not connect to backend. Is it running? {e}", "yellow"))

if __name__ == "__main__":
    test_auth_lockdown()
