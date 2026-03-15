import asyncio
from app.database.supabase_manager import supabase_db
from app.core.config import settings

async def verify_connectivity():
    print(f"--- Client Configuration ---")
    print(f"SUPABASE_URL: {settings.SUPABASE_URL}")
    
    client = supabase_db.get_client()
    
    # Try to get the project ID via a dummy call to an edge function or similar 
    # Or just check the URL structure
    project_ref = settings.SUPABASE_URL.split("//")[1].split(".")[0]
    print(f"Project Reference from URL: {project_ref}")
    
    print(f"\n--- Database Counts (via API) ---")
    for table in ["users", "courses", "assignments", "submissions", "progress", "enrollments"]:
        try:
            res = client.table(table).select("count", count="exact").execute()
            print(f"Table {table}: {res.count} rows")
        except Exception as e:
            print(f"Table {table}: Error {e}")

if __name__ == "__main__":
    asyncio.run(verify_connectivity())
