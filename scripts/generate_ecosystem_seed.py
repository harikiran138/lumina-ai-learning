import json
import uuid
import random
import os
from datetime import datetime, timedelta

# Constants
NUM_ADMINS = 1
NUM_TEACHERS = 10
NUM_STUDENTS = 50
COURSES_PER_TEACHER = 2

# Output file
OUTPUT_FILE = "ecosystem_seed.sql"

SUBJECTS = ['computer_science', 'mathematics', 'physics', 'design', 'business']
DIFFICULTIES = ['beginner', 'intermediate', 'advanced']

def generate_uuid():
    return str(uuid.uuid4())

def generate_timestamp(offset_days=0):
    return (datetime.utcnow() - timedelta(days=offset_days)).isoformat() + "Z"

def generate_sql():
    sql = ["-- Lumina AI Learning Ecosystem Seed Script"]
    sql.append("-- Make sure pgcrypto is enabled")
    sql.append("CREATE EXTENSION IF NOT EXISTS pgcrypto;")
    sql.append("BEGIN;")
    
    admins = []
    teachers = []
    students = []
    courses = []
    modules = []
    lessons = []

    sql.append("\n-- 1. Create Users")
    # Admin
    admin_id = generate_uuid()
    admins.append(admin_id)
    sql.append(f"""  # nosec B608
    INSERT INTO public.users (id, email, password_hash, name, role, is_active)
    VALUES ('{admin_id}', 'admin.system@lumina.com', crypt('Admin@123', gen_salt('bf')), 'System Admin', 'admin', true)
    ON CONFLICT (email) DO NOTHING;
    """)

    # Teachers
    for i in range(1, NUM_TEACHERS + 1):
        teacher_id = generate_uuid()
        teachers.append(teacher_id)
        name = f"Teacher {i}"
        sql.append(f"""  # nosec B608
        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('{teacher_id}', 'teacher{i}@lumina.com', crypt('teacher123', gen_salt('bf')), '{name}', 'teacher', true)
        ON CONFLICT (email) DO NOTHING;
        """)

    # Students
    for i in range(1, NUM_STUDENTS + 1):
        student_id = generate_uuid()
        students.append(student_id)
        name = f"Student {i}"
        sql.append(f"""  # nosec B608
        INSERT INTO public.users (id, email, password_hash, name, role, is_active)
        VALUES ('{student_id}', 'student{i}@lumina.com', crypt('student123', gen_salt('bf')), '{name}', 'student', true)
        ON CONFLICT (email) DO NOTHING;
        """)

    sql.append("\n-- 2. Create Courses, Modules, and Lessons")
    for t_idx, teacher_id in enumerate(teachers):
        for c_idx in range(1, COURSES_PER_TEACHER + 1):
            course_id = generate_uuid()
            courses.append(course_id)
            subject = random.choice(SUBJECTS)
            difficulty = random.choice(DIFFICULTIES)
            title = f"Course {c_idx} by Teacher {t_idx+1}: Intro to {subject.capitalize()}"
            desc = f"A comprehensive {difficulty} guide to {subject}."
            
            sql.append(f"""  # nosec B608
            INSERT INTO public.courses (id, name, code, description, teacher_id, is_published, subject, difficulty_level)
            VALUES ('{course_id}', '{title}', 'SUBJ-{t_idx}{c_idx}', '{desc}', '{teacher_id}', true, '{subject}', '{difficulty}')
            ON CONFLICT DO NOTHING;
            """)

    sql.append("\n-- 3. Create Enrollments and Progress (Logical Stories)")
    for student_id in students:
        # Each student takes 3-5 random courses
        enrolled_courses = random.sample(courses, random.randint(3, 5))
        for course_id in enrolled_courses:
            # Random status
            r = random.random()
            if r < 0.2:
                status = 'completed'
                # Generate a dummy array of uuid strings for completed_lessons
                comp_lessons = json.dumps([generate_uuid() for _ in range(5)])
                mod_idx = 3
                less_idx = 0
            elif r < 0.7:
                status = 'active'
                # partially completed
                comp_lessons = json.dumps([generate_uuid() for _ in range(2)])
                mod_idx = 1
                less_idx = 1
            else:
                status = 'active'
                comp_lessons = "[]"
                mod_idx = 0
                less_idx = 0
            
            # Progress
            if status == 'completed':
                hours = random.uniform(10.0, 20.0)
            elif comp_lessons == "[]":
                hours = 0.0
            else:
                hours = random.uniform(1.0, 9.0)
                
            sql.append(f"""  # nosec B608
            INSERT INTO public.progress (user_id, course_id, completed_lessons, hours_spent, current_module_index, current_lesson_index)
            VALUES ('{student_id}', '{course_id}', '{comp_lessons}'::jsonb, {hours:.2f}, {mod_idx}, {less_idx})
            ON CONFLICT (user_id, course_id) DO UPDATE SET
                completed_lessons = EXCLUDED.completed_lessons,
                hours_spent = EXCLUDED.hours_spent,
                current_module_index = EXCLUDED.current_module_index,
                current_lesson_index = EXCLUDED.current_lesson_index;
            """)

    sql.append("COMMIT;")
    
    with open(OUTPUT_FILE, 'w') as f:
        f.write("\n".join(sql))
    
    print(f"Generated {OUTPUT_FILE} successfully with logical ecosystem data.")

if __name__ == "__main__":
    generate_sql()
