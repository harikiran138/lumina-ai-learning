import random
import uuid
import argparse
import asyncio
from faker import Faker
from app.store.user_store import UserStore
from app.store.course_store import CourseStore
from app.database.supabase_manager import supabase_db

fake = Faker()
user_store = UserStore()
course_store = CourseStore()

LUMINA_TABLES = [
    "user_data",
    "student_pathways",
    "skill_mastery",
    "quiz_attempts",
    "quizzes",
    "conversations",
    "enrollments",
    "courses",
    "users"
]

async def clear_database():
    print("🧹 Clearing Supabase Lumina Tables...")
    for table in LUMINA_TABLES:
        try:
            # Delete all rows if allowed by RLS or Service Role
            # We use the direct client for administrative clearing
            client = supabase_db.get_client()
            client.table(table).delete().neq("id", uuid.uuid4()).execute()
            print(f"   - Cleared {table}")
        except Exception as e:
            print(f"   ⚠️ Could not clear {table}: {e}")

async def seed_data(clear=False):
    await supabase_db.connect()

    if clear:
        await clear_database()

    print("🌱 Seeding Lumina Database...")

    # 1. Create Teachers
    teachers = []
    print("   - Generating Teachers...")
    for _ in range(5):
        email = f"teacher_{fake.unique.email()}"
        try:
            teacher = await user_store.create_user(
                email=email, password="password123", full_name=fake.name(), role="teacher"
            )
            teachers.append(teacher)
        except Exception as e:
            print(f"      ⚠️ Failed to create teacher: {e}")
            
    print(f"   - Created {len(teachers)} Teachers")

    # 2. Create Courses
    courses = []
    print("   - Generating Courses...")
    course_topics = [
        "Calculus", "Quantum Mechanics", "Organic Chemistry", "Microbiology",
        "Machine Learning", "Ancient History", "Post-Modern Literature",
        "Artificial Intelligence", "Neuroscience", "Macroeconomics"
    ]

    for topic in course_topics:
        name = f"{topic}: {fake.catch_phrase()}"
        code = f"{topic[:3].upper()}-{random.randint(100, 999)}"
        teacher = random.choice(teachers)

        try:
            course = await course_store.create_course(
                name=name,
                code=code,
                description=fake.paragraph(nb_sentences=3),
                teacher_id=teacher["id"],
            )
            courses.append(course)
        except Exception as e:
            print(f"      ⚠️ Failed to create course {code}: {e}")
            continue
    print(f"   - Created {len(courses)} Courses")

    # 3. Create Students and Enrollments
    students = []
    print("   - Generating Students & Enrollments...")
    for _ in range(20):
        try:
            student = await user_store.create_user(
                email=f"student_{fake.unique.email()}", password="password123", full_name=fake.name(), role="student"
            )
            students.append(student)

            # Enroll in 2 random courses
            enrolled_courses = random.sample(courses, 2)
            for course in enrolled_courses:
                await supabase_db.insert("enrollments", {
                    "student_id": student["id"],
                    "course_id": course["id"],
                    "status": "active",
                    "progress": random.randint(0, 100)
                })
        except Exception as e:
            print(f"      ⚠️ Failed to create student/enrollment: {e}")

    print(f"   - Created {len(students)} Students")

    # 4. Create Quizzes for Courses
    print("   - Generating Quizzes...")
    for course in courses:
        try:
            await supabase_db.insert("quizzes", {
                "course_id": course["id"],
                "title": f"Intro to {course['title']}",
                "description": "Initial assessment",
                "is_published": True,
                "questions": [
                    {"q": "What is Lumina AI?", "a": "A learning platform"},
                    {"q": "Who is the instructor?", "a": "AI Agent"}
                ]
            })
        except Exception as e:
            print(f"      ⚠️ Failed to create quiz for {course['code']}: {e}")

    print("✅ Seeding Complete! Login with 'password123'")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed the Lumina database.")
    parser.add_argument("--clear", action="store_true", help="Clear the database before seeding")
    args = parser.parse_args()

    asyncio.run(seed_data(clear=args.clear))
