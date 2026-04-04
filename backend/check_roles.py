import asyncio
import os
import sys

# Add the current directory to the search path for imports
sys.path.append(os.getcwd())

from app.database.supabase_manager import supabase_db

async def check():
    try:
        # Get the real client
        client = supabase_db.get_client()
        
        # Check current enum values for user_role
        # Note: We use a raw SQL approach via RPC if available, or just try to 
        # catch the error to see what values are expected.
        try:
            # This is a common pattern to get enum values in Postgres
            res = client.rpc("get_enum_values", {"enum_name": "user_role"}).execute()
            print("Enum values for user_role:", res.data)
        except Exception as e:
            print("RPC get_enum_values failed, trying direct select on users table...")
            
        # Check users table schema by trying to fetch one
        res = client.table("users").select("role").limit(1).execute()
        print("Sample user role from DB:", res.data)
        
    except Exception as e:
        print("Role check failed:", str(e))
        
        # Fallback: simple SQL to check type
        try:
             # Try a raw SQL query if get_enum_values RPC isn't available
             pass
        except:
             pass

if __name__ == "__main__":
    asyncio.run(check())
