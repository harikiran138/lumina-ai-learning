
import asyncio
import os
from app.database.supabase_manager import supabase_db

async def check_course():
    os.environ["LUMINA_FORCE_REAL_DB"] = "1"
    client = supabase_db.get_client()
    if client is None:
        print("Failed to get Supabase client")
        return
    
    # Try a select
    print("Checking for courses...")
    try:
        response = await client.table("courses").select("id, code, title").limit(5).async_execute()
        print(f"Results: {response.data}")
        
        # Check specifically for CS110
        response = await client.table("courses").select("id, code, title").eq("code", "CS110").async_execute()
        if response.data:
            print(f"Course with code 'CS110' found! ID: {response.data[0]['id']}, Title: {response.data[0].get('title')}")
        else:
            print("Course with code 'CS110' not found.")
    except Exception as e:
        print(f"Error checking course: {str(e)}")

if __name__ == "__main__":
    asyncio.run(check_course())
