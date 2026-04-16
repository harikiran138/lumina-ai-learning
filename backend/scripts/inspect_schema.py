import asyncio
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).parent.parent.resolve()
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.database.supabase_manager import supabase_db

async def inspect_schema():
    tables = ["student_enrollments", "learner_profiles", "teacher_profiles", "courses"]
    client = supabase_db.get_client()
    for table in tables:
        try:
            res = await client.table(table).select("*").limit(1).async_execute()
            if res.data:
                print(f"Table: {table} | Columns: {list(res.data[0].keys())}")
            else:
                # If no data, we cannot easily get columns from PostgREST without an empty select
                # But we can try to insert a dummy and see error? No.
                # Try to get from OpenAPI? No.
                print(f"Table: {table} | No data to inspect columns.")
        except Exception as e:
            print(f"Table: {table} | Error: {e}")

if __name__ == "__main__":
    asyncio.run(inspect_schema())
