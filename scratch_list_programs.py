import asyncio
import os
import sys

backend_path = os.path.join(os.getcwd(), "backend")
sys.path.append(backend_path)

from app.database.supabase_manager import supabase_db

async def run():
    programs = await supabase_db.fetch_all('programs')
    for p in programs:
        print(f"Program: {p.get('name') or p.get('title')} | ID: {p.get('id')}")

if __name__ == "__main__":
    asyncio.run(run())
