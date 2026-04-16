import asyncio
import os
import sys

backend_path = os.path.join(os.getcwd(), "backend")
sys.path.append(backend_path)

from app.database.supabase_manager import supabase_db

async def run():
    # Use direct SQL if possible or try to fetch from information_schema
    # But for now I'll just try to fetch from 'classes' again and if empty, see what columns it has by inserting a junk row (and deleting)
    try:
        res = await supabase_db.fetch_all('classes', limit=1)
        print(f"Classes: {res}")
    except Exception as e:
        print(f"Error fetching classes: {e}")

if __name__ == "__main__":
    asyncio.run(run())
