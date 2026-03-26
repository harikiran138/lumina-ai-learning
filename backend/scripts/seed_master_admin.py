import asyncio
from app.store.user_store import UserStore
from app.database.supabase_manager import supabase_db

async def seed_master_admin():
    user_store = UserStore()
    email = "admin@lumin.com"
    password = "admin123"
    full_name = "System Admin"
    
    existing = await user_store.get_user_by_email(email)
    if existing:
        print(f"Admin {email} already exists.")
        return
    
    print(f"Seeding master admin: {email}...")
    try:
        await user_store.create_user(
            email=email,
            password=password,
            full_name=full_name,
            role="admin",
            phone="+10000000000"
        )
        print("✅ Master admin seeded successfully.")
    except Exception as e:
        print(f"❌ Failed to seed admin: {e}")

if __name__ == "__main__":
    asyncio.run(seed_master_admin())
