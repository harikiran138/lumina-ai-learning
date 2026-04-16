import asyncio
import os
import sys

# Add backend to path
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.database.supabase_manager import supabase_db

async def check_data():
    print("--- Searching for Teacher 'qwert' ---")
    users = await supabase_db.fetch_all('users', {'full_name': 'qwert'})
    if not users:
        users = await supabase_db.fetch_all('users', {'email': 'qwert@gmail.com'})
    
    for u in users:
        teacher_id = u.get('id')
        print(f"Teacher: {u.get('full_name')} | ID: {teacher_id} | Email: {u.get('email')}")
        
        # Check teacher_assignments table
        assignments = await supabase_db.fetch_all('teacher_assignments', {'teacher_id': teacher_id})
        print(f"  Teacher Assignments Count: {len(assignments)}")
        for a in assignments:
            print(f"    Assignment: Course {a.get('course_id')}, Class {a.get('class_id')}")

        # Check courses owned by teacher
        owned_courses = await supabase_db.fetch_all('courses', {'teacher_id': teacher_id})
        print(f"  Owned Courses Count: {len(owned_courses)}")
        for c in owned_courses:
            print(f"    Course: {c.get('course_name') or c.get('title')} | ID: {c.get('id')}")

    print("\n--- Searching for Students ---")
    students = await supabase_db.fetch_all('users', {'role': 'student'})
    print(f"Total Students in System: {len(students)}")
    
    # Check if any student is enrolled in classes the teacher is assigned to
    teacher_class_ids = []
    for u in users:
        assignments = await supabase_db.fetch_all('teacher_assignments', {'teacher_id': u.get('id')})
        teacher_class_ids.extend([a.get('class_id') for a in assignments if a.get('class_id')])
    
    print(f"Teacher's Linked Classes: {teacher_class_ids}")
    
    for s in students:
        sid = s.get('id')
        enrollments = await supabase_db.fetch_all('student_enrollments', {'student_id': sid})
        matching = [e for e in enrollments if e.get('class_id') in teacher_class_ids]
        if matching or enrollments:
            print(f"  Student: {s.get('full_name')} | ID: {sid} | Total Enrollments: {len(enrollments)} | Matching Teacher Classes: {len(matching)}")
            for e in enrollments:
                 print(f"    - Course {e.get('course_id')}, Class {e.get('class_id')}")

    print("\n--- Checking Pending Submissions ---")
    submissions = await supabase_db.fetch_all('assignment_submissions', {'status': 'submitted'})
    print(f"Total Pending Submissions in System: {len(submissions)}")

if __name__ == "__main__":
    asyncio.run(check_data())
