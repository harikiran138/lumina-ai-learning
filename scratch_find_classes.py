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
        print("No Enrollments found.")
    
    # Try common table names for classes
    common = ['batches', 'sections', 'sections_table', 'academic_classes']
    for c in common:
        try:
            res = await supabase_db.fetch_all(c)
            if res:
                print(f"Table '{c}' EXISTS. Rows: {len(res)}. Columns: {list(res[0].keys())}")
        except:
            pass

if __name__ == "__main__":
    asyncio.run(run())
