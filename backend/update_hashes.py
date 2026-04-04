import asyncio
from app.database.supabase_manager import supabase_db
from app.core.security import get_password_hash

async def update_hashes():
    client = supabase_db.get_client()
    
    passwords = {
        "student@lumina.com": "student123",
        "teacher@lumina.com": "teacher123",
        "admin@lumina.com": "Admin@123"
    }

    for email, plain in passwords.items():
        hashed = get_password_hash(plain)
        client.table("users").update({"password_hash": hashed}).eq("email", email).execute()
        print(f"Updated hash for {email}")

if __name__ == "__main__":
    asyncio.run(update_hashes())
