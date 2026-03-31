import asyncio
import sys
from playwright.async_api import async_playwright

async def verify_login(context, identifier, password, expected_path):
    page = await context.new_page()
    try:
        print(f"🔍 Testing Login for {identifier}...")
        await page.goto("http://localhost:3001/login")
        
        # Wait for the input to be available
        await page.wait_for_selector('input[type="text"]', timeout=5000)
        
        # Fill identifier and password
        await page.fill('input[type="text"]', identifier)
        await page.fill('input[type="password"]', password)
        
        # Click login
        await page.click('button[type="submit"]')
        
        # Wait for redirect
        # Since onboarding_step is 0, they should all go to /onboarding
        # unless they are already "completed"
        try:
            await page.wait_for_url(f"**{expected_path}", timeout=10000)
            print(f"✅ Login successful for {identifier}, reached {page.url}")
            return True
        except Exception as e:
            print(f"❌ Login failed or timed out for {identifier}. Current URL: {page.url}")
            return False
    finally:
        await page.close()

async def verify_signup(context, name, email, roll_number, password):
    page = await context.new_page()
    try:
        print(f"🔍 Testing Signup for {email}...")
        await page.goto("http://localhost:3001/register")
        
        await page.fill('input[placeholder="Your full name"]', name)
        await page.fill('input[placeholder="name@college.edu"]', email)
        await page.fill('input[placeholder="At least 8 characters"]', password)
        await page.fill('input[placeholder="Re-enter password"]', password)
        
        # Select student role (default is student, but let's be sure)
        await page.click('button:has-text("Student")')
        
        await page.click('button[type="submit"]')
        
        try:
            await page.wait_for_url("**/onboarding", timeout=10000)
            print(f"✅ Signup successful for {email}, reached {page.url}")
            return True
        except Exception as e:
            print(f"❌ Signup failed or timed out for {email}. Current URL: {page.url}")
            return False
    finally:
        await page.close()

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        
        # Test 1: Student Login
        context = await browser.new_context()
        await verify_login(context, "22NU1A0519", "student@123", "/onboarding")
        await context.close()
        
        # Test 2: Faculty Login
        context = await browser.new_context()
        await verify_login(context, "FAC001", "faculty@123", "/onboarding")
        await context.close()
        
        # Test 3: HOD Login
        context = await browser.new_context()
        await verify_login(context, "HOD001", "admin@123", "/onboarding")
        await context.close()
        
        # Test 4: Admin Login
        context = await browser.new_context()
        await verify_login(context, "admin@demo.nsrit.edu.in", "admin@123", "/dashboard/admin")
        await context.close()
        
        # Test 5: Signup
        import random
        unique_roll = f"22NU1A{random.randint(1000, 9999)}"
        unique_email = f"test_{unique_roll}@example.com"
        context = await browser.new_context()
        await verify_signup(context, "Test User", unique_email, unique_roll, "testpassword123")
        await context.close()
        
        await browser.close()

if __name__ == "__main__":
    asyncio.run(main())
