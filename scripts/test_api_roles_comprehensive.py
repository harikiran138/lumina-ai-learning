import os
import httpx
import asyncio
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

API_URL = os.getenv("API_URL", "http://localhost:8000")

# Test Credentials from seed_user.py
TEST_USERS = [
    {"role": "admin", "email": "admin@lumina.com", "password": "Admin@123"},
    {"role": "teacher", "email": "teacher@lumina.com", "password": "teacher123"},
    {"role": "student", "email": "student@lumina.com", "password": "student123"},
]

async def get_token(client, email, password):
    login_data = {"username": email, "password": password}
    try:
        resp = await client.post(f"{API_URL}/api/auth/token", data=login_data)
        if resp.status_code == 200:
            return resp.json().get("access_token")
        else:
            print(f"  ❌ Login failed for {email}: {resp.status_code} - {resp.text}")
            return None
    except Exception as e:
        print(f"  ❌ Connection error during login for {email}: {e}")
        return None

async def test_endpoint(client, name, method, path, token, expected_status=200):
    headers = {"Authorization": f"Bearer {token}"} if token else {}
    try:
        if method == "GET":
            resp = await client.get(f"{API_URL}{path}", headers=headers)
        elif method == "POST":
            resp = await client.post(f"{API_URL}{path}", headers=headers, json={})
        
        status = resp.status_code
        if status == expected_status:
            print(f"  ✅ {name} ({path}): {status}")
            return True
        else:
            print(f"  ❌ {name} ({path}): Expected {expected_status}, got {status}")
            return False
    except Exception as e:
        print(f"  ❌ {name} ({path}): Error connecting: {e}")
        return False

async def verify_roles():
    print(f"--- LUMINA COMPREHENSIVE API ROLE VERIFICATION ---")
    print(f"API Target: {API_URL}")
    
    async with httpx.AsyncClient(timeout=10.0) as client:
        for user in TEST_USERS:
            print(f"\n[Testing Role: {user['role'].upper()}] Account: {user['email']}")
            token = await get_token(client, user['email'], user['password'])
            if not token:
                continue
            
            # Common Endpoint
            await test_endpoint(client, "Profile Check", "GET", "/api/auth/me", token)
            
            # Role-Specific Endpoints
            if user['role'] == "admin":
                await test_endpoint(client, "Admin Dashboard", "GET", "/api/admin/dashboard", token)
                await test_endpoint(client, "Admin Config", "GET", "/api/admin/config", token)
                await test_endpoint(client, "User Management", "GET", "/api/admin/users", token)
            
            elif user['role'] == "teacher":
                # Testing unauthorized access to admin
                await test_endpoint(client, "Admin Access Breach", "GET", "/api/admin/dashboard", token, expected_status=403)
                
                # Correct Teacher endpoints
                # Note: summary requires student_id. Using a dummy UUID for verification.
                dummy_id = "00000000-0000-0000-0000-000000000000"
                await test_endpoint(client, "Teacher Summary", "GET", f"/api/teacher/dashboard/summary?student_id={dummy_id}", token)
                await test_endpoint(client, "Intervention Queue", "GET", "/api/teacher/interventions/queue", token)
                
                # Course listing with trailing slash to avoid 307
                await test_endpoint(client, "Course Listing", "GET", "/api/courses/", token)
            
            elif user['role'] == "student":
                # Testing unauthorized access to admin
                await test_endpoint(client, "Admin Access Breach", "GET", "/api/admin/dashboard", token, expected_status=403)
                await test_endpoint(client, "Student Dashboard", "GET", "/api/student/dashboard", token)
                await test_endpoint(client, "Student Profile", "GET", "/api/student/profile", token)

if __name__ == "__main__":
    asyncio.run(verify_roles())
