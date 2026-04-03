import asyncio
import os
import sys
from pathlib import Path

# Add the current directory to sys.path to find 'app'
sys.path.append(str(Path(__file__).parent.parent))

from app.database.supabase_manager import supabase_db

async def check_users():
    try:
        # Fetching a single row to see columns
        res = await supabase_db.execute("SELECT * FROM users LIMIT 1")
        if res:
            print("Columns in 'users' table:", list(res[0].keys()))
        else:
            # If table is empty, try to get columns from information_schema
            res = await supabase_db.execute("SELECT column_name FROM information_schema.columns WHERE table_name = 'users'")
            print("Columns in 'users' table (via info schema):", [r['column_name'] for r in res])
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(check_users())
