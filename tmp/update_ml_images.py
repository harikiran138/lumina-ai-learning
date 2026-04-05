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
        
        ml_keywords = ["machine learning", "neural networks", "artificial intelligence", "deep learning", "ai", "data science", "agentic"]
        
        updated_count = 0
        for course in courses:
            name = (course.get("name") or course.get("course_name") or "").lower()
            description = (course.get("description") or "").lower()
            if any(keyword in name or keyword in description for keyword in ml_keywords):
                # Update image
                course_id = course.get("id")
                # Using the public path
                img_url = "/courses/agentic_ai.png"
                await store.update_course(course_id, {"thumbnail_url": img_url, "image_url": img_url})
                print(f"UPDATED: {name} (ID: {course_id})")
                updated_count += 1
                
        print(f"TOTAL_UPDATED: {updated_count}")
    except Exception as e:
        print(f"ERROR: {str(e)}")

if __name__ == "__main__":
    asyncio.run(main())
