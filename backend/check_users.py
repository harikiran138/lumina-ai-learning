import asyncio
import os
import sys

# Add backend directory to sys.path
sys.path.append(os.path.join(os.getcwd()))

from app.database.manager import db

async def check_users():
    try:
        await db.connect()
        users = await db.fetch_all("SELECT email, role FROM users")
        print("Existing Users in DB:")
        for user in users:
            print(f"- {user['email']} ({user['role']})")
    except Exception as e:
        print(f"Error checking users: {e}")
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(check_users())
