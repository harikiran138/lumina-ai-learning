import asyncio
import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from app.database.supabase_manager import supabase_db

async def check_data():
    client = supabase_db.get_client()
    
    # Get student UUID
    user_res = client.table("users").select("id").eq("email", "student1@lumina.com").execute()
    if not user_res.data:
        print("Student not found!")
        return
    student_id = user_res.data[0]["id"]
    print(f"Student ID: {student_id}")

    # Check courses
    courses_res = client.table("courses").select("*").execute()
    print(f"Total courses: {len(courses_res.data)}")
    if courses_res.data:
        print(f"Sample courses: {courses_res.data[:2]}")


    # Check progress
    progress_res = client.table("progress").select("*").eq("user_id", student_id).execute()
    print(f"Student progress records: {len(progress_res.data)}")

if __name__ == "__main__":
    asyncio.run(check_data())
