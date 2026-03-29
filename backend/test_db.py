import asyncio
from app.database.supabase_manager import supabase_db

async def test():
    await supabase_db.connect()
    # Simple query
    client = supabase_db.get_client()
    res = client.table("users").select("id").limit(1).execute()
    print("DB connection successful:", res)

asyncio.run(test())
