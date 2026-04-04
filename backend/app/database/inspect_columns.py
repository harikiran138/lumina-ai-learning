import asyncio
import os
import sys
from app.database.supabase_manager import supabase_db

async def inspect(table_name):
    # Fetch one row to see columns
    res = await supabase_db.table(table_name).select("*").limit(1).async_execute()
    if res.data:
        print(f"Columns in '{table_name}' table: {list(res.data[0].keys())}")
    else:
        # Try metadata if possible
        print(f"Table '{table_name}' exists but has no data rows yet.")

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python inspect_columns.py <table_name>")
        sys.exit(1)
    asyncio.run(inspect(sys.argv[1]))
