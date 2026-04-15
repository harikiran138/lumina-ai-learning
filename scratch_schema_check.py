import asyncio
from app.database.supabase_manager import supabase_db

async def investigate_schema():
    client = supabase_db.get_client()
    # List tables by querying a known one or trying to infer
    # Actually, let's check the backend models to see where enrollment_code is defined.
    import os
    print("Files in app/models:")
    print(os.listdir("backend/app/models"))

if __name__ == "__main__":
    asyncio.run(investigate_schema())
