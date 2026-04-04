import asyncio
import os
import sys

# Add the current directory to the search path for imports
sys.path.append(os.getcwd())

from app.database.supabase_manager import supabase_db

async def check():
    client = supabase_db.get_client()
    try:
        # Try to find ANY user in the 'users' table
        res = await client.table("users").select("email, role").limit(10).async_execute()
        if res.data:
            print("Found some users:")
            for u in res.data:
                print(f"User: {u['email']}, Role: '{u['role']}'")
        else:
            print("No users found in 'users' table.")
            
        # Also check 'auth.users' if we have access (via rpc)
        # But we likely don't.
        
    except Exception as e:
        print("Investigation failed:", str(e))

if __name__ == "__main__":
    asyncio.run(check())
