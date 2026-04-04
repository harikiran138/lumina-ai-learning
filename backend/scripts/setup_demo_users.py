import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.getcwd())

from app.database.supabase_manager import supabase_db
from app.store.user_store import UserStore
from app.core.security import get_password_hash

async def setup_users():
    store = UserStore(supabase_db)
    password = "Lumina@138800"
    
    users_to_create = [
        {"email": "admin@lumina.com", "name": "System Admin", "role": "super_admin"},
        {"email": "hod@lumina.com", "name": "Dept Head", "role": "hod"},
        {"email": "teacher@lumina.com", "name": "Master Teacher", "role": "teacher"},
        {"email": "student@lumina.com", "name": "Junior Student", "role": "student"},
    ]

    for user_info in users_to_create:
        email = user_info["email"]
        role = user_info["role"]
        name = user_info["name"]
        
        existing = await store.get_user_by_email(email)
        if existing:
            print(f"User {email} already exists. Updating role to {role}...")
            # Use raw client to update role directly in 'users' table
            client = supabase_db.get_client()
            await client.table("users").update({"role": role}).eq("id", existing["id"]).async_execute()
            # Update password too to be sure
            hashed = get_password_hash(password)
            await client.table("users").update({"password_hash": hashed}).eq("id", existing["id"]).async_execute()
        else:
            print(f"Creating user {email} as {role}...")
            await store.create_user(
                email=email,
                password=password,
                full_name=name,
                role=role
            )
    
    print("DEMO_USERS_SETUP_COMPLETE")

if __name__ == "__main__":
    asyncio.run(setup_users())
