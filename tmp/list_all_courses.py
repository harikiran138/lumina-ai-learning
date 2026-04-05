import asyncio
import os
import sys

# Ensure backend directory is in sys.path
sys.path.append(os.getcwd())

from app.store.course_store import CourseStore
from app.database.supabase_manager import supabase_db

async def main():
    try:
        store = CourseStore()
        courses = await store.list_courses()
        for course in courses:
            name = (course.get("name") or course.get("course_name") or "Untitled")
            print(f"NAME: {name} (CODE: {course.get('code')})")
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
