import httpx
import asyncio
import json

async def test_login():
    url = "http://127.0.0.1:8000/api/auth/login"
    users = [
        ("student@lumina.com", "student123"),
        ("teacher@lumina.com", "teacher123"),
        ("admin@lumina.com", "Admin@123")
    ]
    
    async with httpx.AsyncClient() as client:
        for email, password in users:
            print(f"Testing login for {email}...")
            data = {"email": email, "password": password}
            try:
                response = await client.post(url, json=data)
                print(f"Status Code: {response.status_code}")
                if response.status_code == 200:
                    print("SUCCESS")
                else:
                    print(f"FAILED: {response.text}")
            except Exception as e:
                import traceback
                traceback.print_exc()
            print("-" * 40)

if __name__ == "__main__":
    asyncio.run(test_login())
