import asyncio
import random
import uuid
from typing import List, Dict
from faker import Faker

# Passlib/Bcrypt compatibility monkeypatch
import bcrypt
if not hasattr(bcrypt, "__about__"):
    bcrypt.__about__ = type('about', (object,), {'__version__': bcrypt.__version__})

from app.store.user_store import UserStore
from app.store.course_store import CourseStore
from app.store.student_store import StudentStore
from app.store.assignment_store import AssignmentStore
from app.database.supabase_manager import supabase_db

fake = Faker()

async def clear_database():
    """
    Clears data from Lumina tables using a cascade approach.
    """
    print("🧹 Clearing Supabase Lumina tables...")
    tables = [
        "submissions",
        "assignments",
        "progress",
        "courses",
        "users"
    ]
    
    for table in tables:
        try:
            await supabase_db.delete(table, {"id": "neq.00000000-0000-0000-0000-000000000000"})
            print(f"   - Cleared {table}")
        except Exception as e:
            print(f"   - Warning: Could not clear {table}: {e}")

async def seed_data():
    """
    Seeds the Supabase database with realistic data.
    """
    print("🌱 Seeding Supabase Lumina Database (v2.0)...")

    user_store = UserStore()
    course_store = CourseStore()
    student_store = StudentStore()
    assignment_store = AssignmentStore()

    # 1. Create Teachers
    teachers = []
    print("   - Generating Teachers...")
    for i in range(2):
        email = f"teacher{i+1}@lumina.ai"
        try:
            teacher = await user_store.create_user(
                email=email,
                password="password123",
                full_name=fake.name(),
                role="teacher"
            )
            teachers.append(teacher)
            print(f"     ✅ Created {email}")
        except Exception as e:
            print(f"     ❌ Failed {email}: {e}")

    # 2. Create Students
    students = []
    print("   - Generating Students...")
    for i in range(5):
        email = f"student{i+1}@lumina.ai"
        try:
            student = await user_store.create_user(
                email=email,
                password="password123",
                full_name=fake.name(),
                role="student"
            )
            students.append(student)
            print(f"     ✅ Created {email}")
        except Exception as e:
            print(f"     ❌ Failed {email}: {e}")

    # 3. Create Courses
    courses = []
    course_topics = [
        ("Intro to AI", "Basics of Artificial Intelligence", "computer_science"),
        ("Advanced Python", "Diving deep into Python 3.10+", "computer_science"),
        ("Calculus I", "Limits, derivatives, and integrals", "mathematics")
    ]

    print("   - Generating Courses...")
    for title, desc, subject in course_topics:
        teacher = random.choice(teachers)
        code = f"{title.replace(' ', '')[:4].upper()}-{random.randint(100, 999)}"
        try:
            course = await course_store.create_course(
                name=title,
                code=code,
                description=desc,
                teacher_id=teacher["id"],
                subject=subject
            )
            courses.append(course)
            print(f"     ✅ Created Course: {title}")
        except Exception as e:
            print(f"     ❌ Failed Course {title}: {e}")

    # 4. Progress & Assignments
    print("   - Generating Progress & Assignments...")
    for course in courses:
        # Create an assignment for each course
        try:
            assignment = await assignment_store.create_assignment(
                title=f"Assessment: {course['name']}",
                course_id=course["id"],
                description="Please submit your response to the prompt.",
                due_date=fake.future_date().isoformat(),
                created_by=course["teacher_id"]
            )
            print(f"     📝 Created Assignment for {course['name']}")
        except Exception as e:
            print(f"     ❌ Failed Assignment for {course['name']}: {e}")

        # Enroll 2-3 random students
        selected_students = random.sample(students, random.randint(2, 3))
        for student in selected_students:
            try:
                # enroll_in_course now targets 'progress' table
                await student_store.enroll_in_course(student["id"], course["id"])
                # log_activity now targets 'progress' table
                await student_store.log_activity(student["id"], course["id"], random.randint(30, 120))
                print(f"     👤 Enrolled {student['email']} in {course['name']}")
                
                # Create a submission for the assignment
                await assignment_store.submit_assignment(
                    assignment_id=assignment["id"],
                    student_id=student["id"],
                    file_path="https://example.com/submission.pdf",
                    content=fake.paragraph()
                )
                print(f"     📄 Added Submission for {student['email']}")
            except Exception as e:
                print(f"     ❌ Failed Lifecycle for {student['email']} -> {course['name']}: {e}")

    print("\n✅ Seeding Complete!")
    print("   - Login with student1@lumina.ai / password123")

if __name__ == "__main__":
    asyncio.run(seed_data())

if __name__ == "__main__":
    asyncio.run(seed_data())
