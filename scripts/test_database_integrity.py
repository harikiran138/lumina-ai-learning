import os
import asyncio
import sys
from dotenv import load_dotenv

# Add backend to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

REQUIRED_TABLES = [
    "users",
    "roles",
    "courses",
    "lessons",
    "question_bank",
    "ai_answer_queue",
    "assignments",
    "physical_submissions",
    "guardian_log"
]

async def test_database_integrity():
    print("--- LUMINA DATABASE INTEGRITY CHECK ---")
    load_dotenv()
    
    try:
        from app.database.supabase_manager import supabase_db
        client = supabase_db.get_client()
        if not client:
            print("❌ Supabase client initialization failed.")
            return False
            
        print("Checking tables...")
        missing_tables = []
        
        # We'll use a simple query on each table to check existence
        for table in REQUIRED_TABLES:
            try:
                # Querying for 0 rows just to check table existence
                client.table(table).select("count", count="exact").limit(0).execute()
                print(f"✅ Table '{table}' exists.")
            except Exception as e:
                print(f"❌ Table '{table}' check failed: {e}")
                missing_tables.append(table)
        
        print("\n--- SCHEMA VALIDATION ---")
        if missing_tables:
            print(f"❌ Missing or inaccessible tables: {', '.join(missing_tables)}")
        else:
            print("✅ All required tables are present.")
            
        # Optional: Check foreign keys or indexes if possible via RPC or direct SQL
        # For now, we'll stick to table presence for demo readiness.
        
        return len(missing_tables) == 0
        
    except Exception as e:
        print(f"❌ Database integrity check error: {e}")
        return False

if __name__ == "__main__":
    success = asyncio.run(test_database_integrity())
    if not success:
        sys.exit(1)
