import asyncio
from app.database.supabase_manager import supabase_db
from app.core.security import verify_password, get_password_hash

async def check():
    client = supabase_db.get_client()
    emails = ["superadmin@lumina.com", "teacher@lumina.com", "student_22nu1a0519@lumina.com", "admin@lumina.com", "student@lumina.com"]
    users = client.table("users").select("*").in_("email", emails).execute()
    
    passwords_to_try = [
        "Lumina@138800", "Admin@123", "student123", "teacher123", "admin123", "password", "Password@123"
    ]

    for user in users.data:
        email = user["email"]
        hashed = user["password_hash"]
        found = False
        for p in passwords_to_try:
            if verify_password(p, hashed):
                print(f"User: {email}, Password is: {p}")
                found = True
                break
        if not found:
            print(f"User: {email}: Could not find password among guesses.")

if __name__ == "__main__":
    asyncio.run(check())
