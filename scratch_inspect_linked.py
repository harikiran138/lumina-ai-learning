import asyncio
import os
import sys

backend_path = os.path.join(os.getcwd(), "backend")
sys.path.append(backend_path)

from app.database.supabase_manager import supabase_db

async def run():
    course = await supabase_db.fetch_one('courses', {})
    if course:
        print(f"Course Columns: {list(course.keys())}")
        print(f"Sample Course: {course.get('course_name')} | ID: {course.get('id')} | Teacher: {course.get('teacher_id')}")
    else:
        print("No Courses found.")
        
    class_row = await supabase_db.fetch_one('classes', {})
    if class_row:
        print(f"Class Columns: {list(class_row.keys())}")
    else:
        print("No Classes found.")

if __name__ == "__main__":
    asyncio.run(run())
