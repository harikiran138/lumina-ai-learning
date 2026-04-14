import asyncio
import httpx

async def main():
    async with httpx.AsyncClient() as client:
        # 1. Login
        resp = await client.post("http://localhost:8000/api/auth/token", data={
            "username": "admin@lumin.com",
            "password": "admin123"
        })
        token = resp.json().get("access_token")
        
        # 2. Get users
        resp2 = await client.get("http://localhost:8000/api/admin/users", headers={
            "Authorization": f"Bearer {token}"
        })
        print("USERS:", resp2.status_code, resp2.text)

if __name__ == "__main__":
    asyncio.run(main())
