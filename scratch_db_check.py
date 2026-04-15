import asyncio
import os
from app.database.supabase_manager import supabase_db

async def get_valid_enrollment_code():
    client = supabase_db.get_client()
    # Looking for a batch with an enrollment code
    result = client.table("batches").select("enrollment_code, id").limit(5).execute()
    print("Batches:", result.data)
    
    # Also check institutions just in case
    result = client.table("institutions").select("id, name").limit(5).execute()
    print("Institutions:", result.data)

if __name__ == "__main__":
    # Ensure we are in the backend directory context if needed
    # But usually just setting PYTHONPATH is enough
    asyncio.run(get_valid_enrollment_code())
