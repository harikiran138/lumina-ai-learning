import os
import httpx
import asyncio
from dotenv import load_dotenv

load_dotenv()

API_URL = os.getenv("API_URL", "http://127.0.0.1:8000")

async def test_auth_flow(email, password, role, name):
    print(f"\n--- TESTING AUTH FLOW FOR {role.upper()} ---")
    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Register
        reg_payload = {
            "email": email,
            "password": password,
            "full_name": name,
            "role": role
        }
        print(f"Registering {email}...")
        resp = await client.post(f"{API_URL}/api/auth/register", json=reg_payload)
        if resp.status_code == 201:
            print(f"✅ Registration successful: {resp.json().get('id')}")
        elif resp.status_code == 400 and "already registered" in resp.text:
            print(f"ℹ️ User already registered.")
        else:
            print(f"❌ Registration failed ({resp.status_code}): {resp.text}")
            return None

        # 2. Login
        print(f"Logging in {email}...")
        login_data = {
            "username": email,
            "password": password
        }
        resp = await client.post(f"{API_URL}/api/auth/token", data=login_data)
        if resp.status_code == 200:
            token = resp.json().get("access_token")
            print("✅ Login successful. Token obtained.")
            return token
        else:
            print(f"❌ Login failed ({resp.status_code}): {resp.text}")
            return None

async def test_protected_routes(token, role):
    print(f"\n--- TESTING PROTECTED ROUTES FOR {role.upper()} ---")
    headers = {"Authorization": f"Bearer {token}"}
    async with httpx.AsyncClient(timeout=10.0) as client:
        # 1. Check /me
        resp = await client.get(f"{API_URL}/api/auth/me", headers=headers)
        if resp.status_code == 200:
            print(f"✅ /me access successful: {resp.json().get('role')}")
        else:
            print(f"❌ /me access failed: {resp.status_code}")

        # 2. Role-specific dashboard
        if role == "teacher":
            # Teacher summary requires student_id query params
            endpoint = "/api/teacher/dashboard/summary?student_id=dummy-id"
        elif role == "student":
            endpoint = "/api/student/dashboard"
        else:
            print(f"No specific test for role {role}")
            return

        print(f"Accessing {endpoint}...")
        resp = await client.get(f"{API_URL}{endpoint}", headers=headers)
        if resp.status_code == 200:
            print(f"✅ {endpoint} access successful.")
        else:
            print(f"❌ {endpoint} access failed ({resp.status_code}): {resp.text}")

async def main():
    print("Starting API Verification...")
    
    # Test Teacher
    teacher_token = await test_auth_flow("teacher@lumina.ai", "demo1234", "teacher", "Demo Teacher")
    if teacher_token:
        await test_protected_routes(teacher_token, "teacher")

    # Test Student
    student_token = await test_auth_flow("student@lumina.ai", "demo1234", "student", "Demo Student")
    if student_token:
        await test_protected_routes(student_token, "student")

if __name__ == "__main__":
    asyncio.run(main())
