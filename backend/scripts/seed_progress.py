import os
import sys
import json
import random
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from app.core.config import settings
from app.database.supabase_manager import get_supabase_client

def seed_ecosystem():
    supabase = get_supabase_client()
    
    print("Fetching existing courses...")
    courses = supabase.table('courses').select('id').execute().data
    if not courses:
        print("No courses found. Cannot seed enrollments/progress.")
        return
        
    print("Fetching existing students...")
    students = supabase.table('users').select('id').eq('role', 'student').execute().data
    
    if not students:
        print("No students found. Run basic Python user seed first if needed.")
        return
    
    print(f"Seeding progress for {len(students)} students across {len(courses)} courses...")
    
    progress_records = []
    
    for student in students:
        student_id = student['id']
        # Each student takes 3-5 random courses
        enrolled_courses = random.sample(courses, min(len(courses), random.randint(3, 5)))
        
        for course in enrolled_courses:
            course_id = course['id']
            r = random.random()
            
            if r < 0.2:
                # 20% Completed
                hours = round(random.uniform(10.0, 20.0), 2)
                mod_idx = 3
                less_idx = 0
                comp_lessons = [str(random.randint(1000, 9999)) for _ in range(5)]
            elif r < 0.7:
                # 50% Active
                hours = round(random.uniform(1.0, 9.0), 2)
                mod_idx = 1
                less_idx = 1
                comp_lessons = [str(random.randint(1000, 9999)) for _ in range(2)]
            else:
                # 30% New
                hours = 0.0
                mod_idx = 0
                less_idx = 0
                comp_lessons = []
                
            progress_records.append({
                'user_id': student_id,
                'course_id': course_id,
                'completed_lessons': comp_lessons,
                'hours_spent': hours,
                'current_module_index': mod_idx,
                'current_lesson_index': less_idx
            })
            
    # Batch insert to avoid huge payload limits
    batch_size = 50
    for i in range(0, len(progress_records), batch_size):
        batch = progress_records[i:i+batch_size]
        try:
           supabase.table('progress').upsert(batch).execute()
        except Exception as e:
           print(f"Error on batch {i}: {e}")
           
    print("Finished seeding progress via Supabase REST client.")

if __name__ == "__main__":
    seed_ecosystem()
