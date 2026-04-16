import asyncio
import os
import sys

backend_path = os.path.join(os.getcwd(), "backend")
sys.path.append(backend_path)

from app.database.supabase_manager import supabase_db

async def run():
    batches = await supabase_db.fetch_all('batches')
    for b in batches:
        print(f"Batch: {b.get('label')} | ID: {b.get('id')}")
    
    courses = await supabase_db.fetch_all('courses')
    for c in courses:
         print(f"Course: {c.get('course_name')} | ID: {c.get('id')} | Teacher: {c.get('teacher_id')}")

if __name__ == "__main__":
    asyncio.run(run())
