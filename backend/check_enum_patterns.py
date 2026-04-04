import asyncio
import os
import sys

# Add the current directory to the search path for imports
sys.path.append(os.getcwd())

from app.database.supabase_manager import supabase_db

async def check():
    client = supabase_db.get_client()
    # Try to find ALL types and their enum values
    sql = """
    SELECT 
        t.typname as type_name, 
        e.enumlabel as label
    FROM pg_type t 
    JOIN pg_enum e ON t.oid = e.enumtypid 
    JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
    WHERE n.nspname = 'public'
    ORDER BY t.typname, e.enumsortorder;
    """
    # Note: supabase-py doesn't have a direct 'execute_sql' but we can try to use a dummy RPC 
    # or just try to get it via postgrest if we have a view.
    # Since we don't have a view, I'll try to guess common ones.
    
    # Let's try to query a table that definitely has roles.
    try:
        # Check if there's a 'roles' table as seen in seed.sql
        res = client.table("roles").select("name").execute()
        print("Values in 'roles' table:", [r['name'] for r in res.data])
    except Exception as e:
        print("Could not read 'roles' table:", str(e))

if __name__ == "__main__":
    asyncio.run(check())
