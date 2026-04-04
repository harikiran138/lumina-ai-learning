import asyncio
import os
import sys

# Add the current directory to the search path for imports
sys.path.append(os.getcwd())

from app.database.supabase_manager import supabase_db

async def check():
    client = supabase_db.get_client()
    try:
        # Fetching ONE row to see columns
        res = await client.table("users").select("*").limit(1).async_execute()
        if res.data:
            print("First user columns:", res.data[0].keys())
        else:
            print("No users found. Checking schema cache workaround...")
            # Try to fetch schema info via PostgREST metadata if available
            # Or just try common names
            cols = ["id", "email", "name", "full_name", "role", "password_hash"]
            available = []
            for c in cols:
                try:
                    await client.table("users").select(c).limit(1).async_execute()
                    available.append(c)
                except:
                    pass
            print("Available columns in 'users':", available)
    except Exception as e:
        print("Schema check failed:", str(e))

if __name__ == "__main__":
    asyncio.run(check())
