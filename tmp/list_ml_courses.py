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
        
        ml_keywords = ["machine learning", "neural networks", "artificial intelligence", "deep learning", "ai", "data science"]
        ml_courses = []
        
        for course in courses:
            name = (course.get("name") or course.get("course_name") or "").lower()
            description = (course.get("description") or "").lower()
            if any(keyword in name or keyword in description for keyword in ml_keywords):
                ml_courses.append({
                    "id": course.get("id"),
                    "name": course.get("name") or course.get("course_name"),
                    "code": course.get("code") or course.get("course_code"),
                    "description": course.get("description"),
                    "current_image": course.get("image") or course.get("thumbnail_url")
                })
                
        print(f"FOUND_ML_COURSES: {len(ml_courses)}")
        for c in ml_courses:
            print(f"ID: {c['id']} | Name: {c['name']} | Code: {c['code']}")
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
