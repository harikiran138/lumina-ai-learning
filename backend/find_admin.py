import asyncio
import os
import sys

# Add backend directory to sys.path
sys.path.append(os.getcwd())

from app.database.manager import db

async def find_admin():
    try:
        await db.connect()
        # Try to find user with role 'admin'
        users = await db.fetch_all("users", {"role": "admin"})
        if not users:
            # Try 'super_admin' or just all users to see what's there
            print("No 'admin' role found, checking all users...")
            users = await db.fetch_all("users")
        
        print(f"Found {len(users)} users:")
        for user in users:
            print(f"- Email: {user.get('email')}, Role: {user.get('role')}, ID: {user.get('id')}")
            
    except Exception as e:
        print(f"Error: {e}")
    finally:
        await db.close()

if __name__ == "__main__":
    asyncio.run(find_admin())
