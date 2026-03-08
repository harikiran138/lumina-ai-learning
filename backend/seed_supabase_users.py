import asyncio
import os
import sys

# Ensure backend path is in sys.path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.security import get_password_hash
from app.database.supabase_manager import supabase_db

async def seed_users():
    client = supabase_db.get_client()

    demo_users = [
        {
            "email": "student@lumina.com",
            "password": "student123",
            "name": "Alex Student",
            "role": "student",
        },
        {
            "email": "teacher@lumina.com",
            "password": "teacher123",
            "name": "Jane Teacher",
            "role": "teacher",
        },
        {
            "email": "admin@lumina.com",
            "password": "Admin@123",
            "name": "Super Admin",
            "role": "admin",
        }
    ]

    for user in demo_users:
        # Check if user exists
        existing = client.table("users").select("*").eq("email", user["email"]).execute()
        if existing.data:
            print(f"User {user['email']} already exists. Updating password...")
            hashed = get_password_hash(user["password"])
            client.table("users").update({"password_hash": hashed}).eq("email", user["email"]).execute()
        else:
            print(f"Creating user {user['email']}...")
            hashed = get_password_hash(user["password"])
            new_user = {
                "email": user["email"],
                "password_hash": hashed,
                "name": user["name"],
                "role": user["role"],
                "status": "active",
                "is_active": True,
                "profile_image": f"https://ui-avatars.com/api/?name={user['name'].replace(' ', '+')}&background=random",
            }
            client.table("users").insert(new_user).execute()

    print("Supabase seed complete.")

if __name__ == "__main__":
    asyncio.run(seed_users())
