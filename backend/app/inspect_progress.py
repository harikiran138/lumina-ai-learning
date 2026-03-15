import asyncio
from app.database.supabase_manager import supabase_db

async def inspect_progress():
    print("🔍 Inspecting progress table columns...")
    client = supabase_db.get_client()
    try:
        # Try to select one row from progress
        res = client.table("progress").select("*").limit(1).execute()
        if res.data:
            print(f"✅ Columns found: {list(res.data[0].keys())}")
        else:
            print("⚠️ No data in progress table. Trying to fetch schema info via RPC or descriptive error...")
            # Try to force an error to see what columns exist
            try:
                client.table("progress").select("non_existent_column").execute()
            except Exception as e:
                print(f"DEBUG Error output: {e}")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    asyncio.run(inspect_progress())
