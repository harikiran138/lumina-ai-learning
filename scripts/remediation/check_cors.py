import httpx
from termcolor import colored

def test_cors():
    print(colored("\n[GATE 3] CORS Lockdown (R-002) Verification", "cyan", attrs=["bold"]))
    
    url = "http://localhost:8000/api/v1/auth/me"
    headers = {"Origin": "https://attacker.evil"}
    
    try:
        r = httpx.options(url, headers=headers)
        if "Access-Control-Allow-Origin" not in r.headers:
            print(colored("PASS: Unauthorized origin correctly rejected (hidden).", "green"))
        elif r.headers.get("Access-Control-Allow-Origin") == "*":
            print(colored("FAIL: CORS still open to all (*).", "red"))
        else:
            print(colored(f"RESULT: {r.headers.get('Access-Control-Allow-Origin')}", "yellow"))
    except Exception as e:
        print(colored(f"ERROR: {e}", "yellow"))

if __name__ == "__main__":
    test_cors()
