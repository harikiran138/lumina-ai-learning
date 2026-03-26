import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.abspath("."))

from app.database.supabase_manager import supabase_db

async def main():
    print("--- Departments ---")
    depts = await supabase_db.fetch_all("departments")
    for d in depts:
        print(f"ID: {d['id']} | Name: {d.get('department_name') or d.get('name')} | HOD: {d.get('hod_id')}")
    
    print("\n--- Teacher Requests (Pending HOD) ---")
    reqs = await supabase_db.fetch_all("teacher_requests", {"status": "PENDING_HOD"})
    for r in reqs:
        print(f"ID: {r['id']} | Teacher: {r['teacher_id']} | Dept: {r.get('department_id')}")

if __name__ == "__main__":
    asyncio.run(main())
