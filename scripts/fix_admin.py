import asyncio
import os
from dotenv import load_dotenv
from app.store.user_store import UserStore
from app.core.security import get_password_hash

async def fix_admin_password():
    load_dotenv()
    store = UserStore()
    client = store.db.get_client()
    
    password = "Admin@123"
    hashed = get_password_hash(password)
    
    print(f"Updating password for admin@lumina.com...")
    result = client.table("users").update({"password_hash": hashed}).eq("email", "admin@lumina.com").execute()
    
    if result.data:
        print(f"✅ Password updated for {result.data[0]['email']}")
    else:
        print("❌ Admin user not found. Re-creating...")
        await store.create_user(
            email="admin@lumina.com",
            password=password,
            full_name="Super Admin",
            role="admin"
        )
        print("✅ Admin user created.")

if __name__ == "__main__":
    asyncio.run(fix_admin_password())
