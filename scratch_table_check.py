import asyncio
import os
import sys

# Ensure backend directory is in the path
backend_path = os.path.join(os.getcwd(), "backend")
sys.path.append(backend_path)

from app.database.supabase_manager import supabase_db

async def run():
    print("--- Database Schema Audit ---")
    
    tables_to_check = [
        'teacher_assignments',
        'teacher_links',
        'courses',
        'users',
        'student_enrollments',
        'ai_answer_queue'
    ]
    
    for table in tables_to_check:
        try:
            # Try a raw SQL query to get table count or a simple select
            res = await supabase_db.fetch_all(table)
            print(f"✅ Table '{table}' found. Rows: {len(res)}")
        except Exception as e:
            if "PGRST204" in str(e) or "404" in str(e) or "not found" in str(e).lower():
                print(f"❌ Table '{table}' DOES NOT EXIST.")
            else:
                print(f"⚠️ Table '{table}' error: {e}")

if __name__ == "__main__":
    asyncio.run(run())
