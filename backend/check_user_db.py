import asyncio
from app.database.supabase_manager import supabase_db

async def check():
    client = supabase_db.get_client()
    users = client.table("users").select("*").in_("email", ["student@lumina.com", "teacher@lumina.com", "admin@lumina.com"]).execute()
    for user in users.data:
        print(f"User: {user['email']}, Hashed: {user.get('password_hash')[:20]}..., Is Active: {user.get('is_active')}")

if __name__ == "__main__":
    asyncio.run(check())
