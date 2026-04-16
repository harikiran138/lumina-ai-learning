import asyncio
import os
import sys
import uuid

backend_path = os.path.join(os.getcwd(), "backend")
sys.path.append(backend_path)

from app.database.supabase_manager import supabase_db

async def run():
    print("--- 1. ENSURE PROGRAM ---")
    program = await supabase_db.fetch_one('programs', {})
    if not program:
        program_id = str(uuid.uuid4())
        await supabase_db.insert('programs', {
            "id": program_id,
            "name": "General Science",
            "code": "GS101",
            "institution_id": "848bd950-e9ea-47c1-a870-681729c42848" # Dummy from other logs
        })
        print(f"Created Program: {program_id}")
    else:
        program_id = program['id']
        print(f"Using Program: {program_id}")

    print("--- 2. UPDATING COURSE/BATCH ---")
    course = await supabase_db.fetch_one('courses', {'course_name': 'Physics 101'})
    course_id = course['id']
    await supabase_db.update('courses', {'program_id': program_id}, {'id': course_id})
    batch = await supabase_db.fetch_one('batches', {'label': 'Alpha-2026'})
    batch_id = batch['id']
    # If batches has program_id, update it
    try:
        await supabase_db.update('batches', {'program_id': program_id}, {'id': batch_id})
    except:
        pass

    print("--- 3. CREATE CLASS ---")
    class_id = str(uuid.uuid4())
    try:
        await supabase_db.insert('classes', {
            "id": class_id,
            "batch_id": batch_id,
            "program_id": program_id,
            "name": "B.Tech Physics Section A"
        })
        print(f"Created Class: {class_id}")
    except Exception as e:
        print(f"Class creation failed: {e}")
        # Try to find existing
        cl = await supabase_db.fetch_one('classes', {'batch_id': batch_id})
        if cl:
            class_id = cl['id']
            print(f"Using existing class: {class_id}")
        else:
            return

    print("--- 4. LINK TEACHER ---")
    teacher = await supabase_db.fetch_one('users', {'email': 'qwert@gmail.com'})
    teacher_id = teacher['id']
    await supabase_db.upsert('teacher_assignments', {
        "teacher_id": teacher_id,
        "course_id": course_id,
        "class_id": class_id,
        "is_primary": True
    }, on_conflict="teacher_id,course_id,class_id")

    print("--- 5. ENROLL STUDENTS ---")
    students = await supabase_db.fetch_all('users', {'role': 'student'})
    count = 0
    for s in students:
        try:
            # We bypass course_id if it's not in schema, but we ALREADY saw it's not.
            # However some systems use sub-tables. Let's try minimal safe.
            await supabase_db.insert('student_enrollments', {
                "student_id": s['id'],
                "class_id": class_id,
                "program_id": program_id,
                "status": "active"
            })
            count += 1
        except:
            pass
    print(f"Enrolled {count} students.")

if __name__ == "__main__":
    asyncio.run(run())
