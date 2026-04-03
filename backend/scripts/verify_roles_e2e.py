import asyncio
import time
from playwright.async_api import async_playwright, Page
from typing import Dict, Any

FRONTEND_URL = "http://localhost:3000"

# Target users to test
USERS = [
    {"role_name": "Student", "email": "student@lumina.com", "expected_path": "/student/dashboard"},
    {"role_name": "Super Admin", "email": "superadmin@lumina.com", "expected_path": "/super-admin/dashboard"},
    {"role_name": "System Admin", "email": "admin@lumina.com", "expected_path": "/admin/dashboard"},
    {"role_name": "Teacher", "email": "teacher@lumina.com", "expected_path": "/faculty/dashboard"},
    {"role_name": "HOD", "email": "hod_hod001@lumina.com", "expected_path": "/hod/dashboard"},
    {"role_name": "Faculty", "email": "faculty_fac001@lumina.com", "expected_path": "/faculty/dashboard"},
    {"role_name": "Legacy Admin", "email": "admin@demo.nsrit.edu.in", "expected_path": "/admin/dashboard"},
    {"role_name": "Legacy Student", "email": "student_22nu1a0519@lumina.com", "expected_path": "/student/dashboard"},
]

PASSWORD = "password"

async def test_role(browser, user_data: Dict[str, Any]) -> Dict[str, Any]:
    email = user_data["email"]
    role = user_data["role_name"]
    expected_path = user_data["expected_path"]
    
    report = {
        "ROLE": role,
        "Login": "❌ FAIL",
        "Session Cookie": "❌ INVALID",
        "Onboarding": "N/A",
        "Dashboard": {"Load Time": "N/A", "API Calls": "N/A"},
        "Sidebar": {},
        "Access Control": "N/A",
        "Issues": [],
        "Fixes Applied": [],
        "FINAL STATUS": "❌ FAIL"
    }

    context = await browser.new_context()
    page = await context.new_page()
    
    # --- Redirection Loop Detection ---
    redirect_count = [0]
    def track_redirect(frame):
        if frame == page.main_frame:
            redirect_count[0] += 1
            if redirect_count[0] > 10:
                print(f"🚨 Redirect loop detected for {email}!")
                
    page.on("framenavigated", track_redirect)

    # --- API Hook Testing ---
    api_responses = {"total": 0, "success": 0, "failures": []}
    
    async def log_api(response):
        if "/api/" in response.url or "_next/data" in response.url:
            api_responses["total"] += 1
            if response.status >= 400:
                api_responses["failures"].append(f"{response.url} ({response.status})")
            else:
                api_responses["success"] += 1
                
    page.on("response", log_api)

    try:
        # 1. Login Phase
        start_time = time.time()
        print(f"\n[{role}] Navigating to login...")
        await page.goto(f"{FRONTEND_URL}/login")
        
        await page.fill('input[type="email"]', email)
        await page.fill('input[type="password"]', PASSWORD)
        await page.click('button[type="submit"]')
        
        # Wait for either dashboard or onboarding
        try:
            await page.wait_for_url("**/dashboard", timeout=5000)
            report["Login"] = "✅ PASS"
            report["Onboarding"] = "✅ PASS (Pre-completed)"
        except Exception:
            try:
                await page.wait_for_url("**/onboarding", timeout=5000)
                report["Login"] = "✅ PASS"
                report["Onboarding"] = "⚠ PENDING (Need intervention)"
                print(f"[{role}] Stuck at onboarding. Needs fallback.")
                # TODO: Implement Onboarding Fallback here if needed
                report["Issues"].append("Stuck at onboarding")
                return report
            except Exception:
                report["Issues"].append(f"Login failed or timeout. Current URL: {page.url}")
                return report

        if redirect_count[0] > 10:
             report["Issues"].append("Redirect loop detected after login")
             return report

        # 2. Session Validation
        cookies = await context.cookies()
        if any(c["name"] == "session_token" for c in cookies):
             report["Session Cookie"] = "✅ VALID"
        else:
             report["Issues"].append("Missing session_token cookie")

        # 3. Performance Timing & Deep Validation
        load_time = time.time() - start_time
        report["Dashboard"]["Load Time"] = f"{load_time:.2f}s " + ("✅" if load_time < 3 else "⚠ (Slow)")
        
        # Wait for hydration (no "Loading..." text)
        loading_count = await page.locator("text=Loading").count()
        if loading_count > 0:
            # wait a bit for it to disappear
            try:
                await page.locator("text=Loading").wait_for(state="hidden", timeout=3000)
            except Exception:
                report["Issues"].append("Dashboard stuck on Loading state")

        if expected_path in page.url:
            report["Dashboard"]["URL"] = "✅ MATCH"
        else:
            report["Issues"].append(f"Expected {expected_path}, got {page.url}")

        # 4. Access Control (Negative Test)
        # Assuming everyone who is not admin should be blocked from /admin
        if role not in ["System Admin", "Legacy Admin", "Super Admin"]:
            await page.goto(f"{FRONTEND_URL}/admin/dashboard")
            # Wait for redirect back or Unauthorized message
            await asyncio.sleep(1) # Let router kick in
            if "/admin/" in page.url and await page.locator("text=Unauthorized").count() == 0:
                 report["Issues"].append("Critical: Role could access Admin Dashboard")
                 report["Access Control"] = "❌ FAIL"
            else:
                 report["Access Control"] = "✅ PASS"

        # Final API Stats
        report["Dashboard"]["API Calls"] = f"{api_responses['success']}/{api_responses['total']} success " + ("✅" if not api_responses['failures'] else "❌")
        if api_responses["failures"]:
            for f in api_responses["failures"]:
                report["Issues"].append(f"API Failed: {f}")

        # Status eval
        if not report["Issues"]:
            report["FINAL STATUS"] = "✅ PASS"
        else:
            report["FINAL STATUS"] = "⚠ PARTIAL PASS" if report["Login"] == "✅ PASS" else "❌ FAIL"

    except Exception as e:
        report["Issues"].append(f"Script Exception: {str(e)}")

    finally:
        await context.close()
        
    return report

async def main():
    print("Starting Lumina E2E Multi-Role Suite...\n")
    results = []
    
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        for user in USERS:
            rep = await test_role(browser, user)
            results.append(rep)
            
        await browser.close()

    print("\n" + "="*50)
    print("FINAL TEST REPORT")
    print("="*50)
    for r in results:
        print(f"\nROLE: {r['ROLE']}")
        print(f"Login: {r['Login']}")
        print(f"Session Cookie: {r['Session Cookie']}")
        print(f"Onboarding: {r['Onboarding']}")
        print("Dashboard:")
        print(f"  Load Time: {r['Dashboard']['Load Time']}")
        print(f"  API Calls: {r['Dashboard']['API Calls']}")
        print(f"Access Control: {r['Access Control']}")
        
        if r['Issues']:
            print("Issues:")
            for i in r['Issues']:
                print(f"  - {i}")
        if r['Fixes Applied']:
            print("Fixes Applied:")
            for f in r['Fixes Applied']:
                print(f"  - {f}")
        print(f"\nFINAL STATUS: {r['FINAL STATUS']}")
        print("-" * 50)

if __name__ == "__main__":
    asyncio.run(main())
