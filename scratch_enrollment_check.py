import asyncio
import os
import sys

backend_path = os.path.join(os.getcwd(), "backend")
sys.path.append(backend_path)

from app.database.supabase_manager import supabase_db

async def run():
    enrollment = await supabase_db.fetch_one('student_enrollments', {})
    if enrollment:
        print(f"Enrollment Columns: {list(enrollment.keys())}")
    else:
        # Check all rows
        rows = await supabase_db.fetch_all('student_enrollments')
        print(f"Total Enrollments: {len(rows)}")
        if rows:
             print(f"Enrollment Columns (from fetch_all): {list(rows[0].keys())}")

if __name__ == "__main__":
    asyncio.run(run())
