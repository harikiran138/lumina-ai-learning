import httpx
from termcolor import colored

def test_cors(port=8001):
    print(colored(f"\n[GATE 3] CORS Lockdown (R-002) Verification (Port {port})", "cyan", attrs=["bold"]))
    
    url = f"http://localhost:{port}/api/v1/user/me"
    
    try:
        r = httpx.options(url, headers={"Origin": "http://malicious.com"})
        if "Access-Control-Allow-Origin" not in r.headers:
            print(colored("PASS: CORS headers not present", "green"))
        else:
            print(colored(f"FAIL: CORS headers found: {r.headers['Access-Control-Allow-Origin']}", "red"))
    except Exception as e:
        print(colored(f"ERROR: Could not connect to backend. {e}", "yellow"))

def test_bypass_gone(port=8001):
    print(colored(f"\n[GATE 4] Hardcoded Bypass (R-003) Verification (Port {port})", "cyan", attrs=["bold"]))
    
    headers = {"Authorization": "Bearer admin_debug_v1_bypass"}
    url = f"http://localhost:{port}/api/v1/user/me"
    
    try:
        r = httpx.get(url, headers=headers)
        if r.status_code == 401:
            print(colored("PASS: Bypass token correctly rejected (401)", "green"))
        else:
            print(colored(f"FAIL: Expected 401, got {r.status_code}", "red"))
    except Exception as e:
        print(colored(f"ERROR: Could not connect to backend. {e}", "yellow"))

if __name__ == "__main__":
    test_bypass_gone()
