import os
import httpx
import asyncio
from dotenv import load_dotenv

load_dotenv()

API_URL = os.getenv("API_URL", "http://localhost:8000")

# Test Credentials
TEACHER_EMAIL = "teacher@lumina.com"
TEACHER_PASS = "teacher123"

async def test_dashboard_and_roles():
    print(f"--- DASHBOARD & ROLE VERIFICATION ---")
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Login as Teacher
        login_data = {"username": TEACHER_EMAIL, "password": TEACHER_PASS}
        resp = await client.post(f"{API_URL}/api/auth/token", data=login_data)
        
        if resp.status_code != 200:
            print(f"❌ Login failed: {resp.status_code} - {resp.text}")
            return
            
        token = resp.json().get("access_token")
        headers = {"Authorization": f"Bearer {token}"}
        print(f"✅ Logged in as {TEACHER_EMAIL}")

        # 2. Check Faculty Dashboard (should not be empty if data exists)
        resp = await client.get(f"{API_URL}/api/faculty/dashboard/summary", headers=headers)
        if resp.status_code == 200:
            data = resp.json()
            total_students = data.get("total_students", 0)
            print(f"✅ Faculty Dashboard: totalStudents={total_students}")
        else:
            print(f"❌ Faculty Dashboard Failed: {resp.status_code} - {resp.text}")

        # 3. Test Course Creation (The 403 fix)
        course_data = {
            "title": "Verification Course",
            "code": "VRFY101",
            "description": "Course for verifying Phase 2 fixes",
            "level": "Intermediate",
            "instructor_id": "dummy-id",
            "modules": []
        }
        resp = await client.post(f"{API_URL}/api/courses/", headers=headers, json=course_data)
        if resp.status_code == 201:
            print(f"✅ Course Creation Success (201)")
        elif resp.status_code == 400 and "exists" in resp.text:
            print(f"✅ Course Creation Success (Found existing VRFY101)")
        else:
            print(f"❌ Course Creation Failed: {resp.status_code} - {resp.text}")

if __name__ == "__main__":
    asyncio.run(test_dashboard_and_roles())
