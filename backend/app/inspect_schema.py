import asyncio
from app.database.supabase_manager import supabase_db

async def inspect_schema():
    print("🔍 Inspecting target project schema (odyjksznsdeyweylovzl)...")
    client = supabase_db.get_client()
    
    # Try to see what PostgREST thinks are the columns via a dummy request or RPC if available
    # But often the best way is just to try selects
    
    tables_to_check = {
        "assignments": ["creator_id", "creatorId", "created_by", "createdBy"],
        "progress": ["user_id", "userId", "current_lesson_index", "currentLessonIndex", "daily_streak", "streak"],
        "submissions": ["user_id", "userId", "submitted_at", "submittedAt"]
    }

    for table, columns in tables_to_check.items():
        print(f"\n--- Testing Columns for {table} ---")
        for col in columns:
            try:
                client.table(table).select(col).limit(1).execute()
                print(f"  ✅ '{col}' is VALID")
            except Exception as e:
                # print(f"  ❌ '{col}' is INVALID: {e}")
                pass

if __name__ == "__main__":
    asyncio.run(inspect_schema())

if __name__ == "__main__":
    asyncio.run(inspect_schema())
