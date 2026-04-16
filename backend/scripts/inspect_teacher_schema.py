import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.database.supabase_manager import supabase_db

async def inspect():
    await supabase_db.connect()
    client = supabase_db.get_client()
    
    table = "teacher_profiles"
    print(f"Inspecting columns for table: {table}")
    
    try:
        res = await client.table(table).select("*").limit(1).async_execute()
        if res.data:
            print(f"Columns: {list(res.data[0].keys())}")
        else:
            print("Table is empty, trying guesses...")
            guesses = ["user_id", "employee_id", "department_id", "department_id", "name", "email"]
            for g in guesses:
                try:
                    test = await client.table(table).select(g).limit(1).async_execute()
                    print(f"Found column: {g}")
                except Exception as e:
                    pass
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(inspect())
