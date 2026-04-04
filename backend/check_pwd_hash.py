import asyncio
from app.database.supabase_manager import supabase_db
from app.core.security import verify_password, get_password_hash

async def check():
    client = supabase_db.get_client()
    users = client.table("users").select("*").in_("email", ["student@lumina.com", "teacher@lumina.com", "admin@lumina.com"]).execute()
    
    passwords = {
        "student@lumina.com": "student123",
        "teacher@lumina.com": "teacher123",
        "admin@lumina.com": "Admin@123"
    }

    for user in users.data:
        email = user["email"]
        plain = passwords[email]
        hashed = user["password_hash"]
        is_valid = verify_password(plain, hashed)
        print(f"User: {email}, Plain: {plain}, HashValid: {is_valid}")

if __name__ == "__main__":
    asyncio.run(check())
