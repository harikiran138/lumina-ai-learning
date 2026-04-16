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
    "attendance",
    "student_enrollments",
    "quiz_attempts",
    "quizzes",
    "course_versions",
    "assignments",
    "enrollment_codes",
    "user_data",
    "student_pathways",
    "skill_mastery",
    "conversations",
    "teacher_profiles",
    "student_profiles",
    "learner_profiles",
    "onboarding_profiles",
    "courses",
    "users"
]

async def clear_database():
    print("🧹 Clearing Supabase Lumina Tables (Referential Order)...")
    # Clear in order to avoid FK violations
    for table in LUMINA_TABLES:
        try:
            client = supabase_db.get_client()
            # Use raw query for delete bypass RLS if using service role
            await client.table(table).delete().neq("id", uuid.uuid4()).async_execute()
            print(f"   - Cleared {table}")
        except Exception as e:
            # Table might not exist or have no 'id' column
            if "not found" in str(e).lower() or "not exist" in str(e).lower():
                continue
            # Try clearing without the 'id' filter if it has no id column
            try:
                await client.table(table).delete().neq("created_at", "1970-01-01").async_execute()
                print(f"   - Cleared {table} (fallback)")
            except:
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
                email=email, password="Password@123", full_name=fake.name(), role="teacher"
			)
            teachers.append(teacher)
        except Exception as e:
            print(f"      ⚠️ Failed to create teacher: {e}")
            
    if not teachers:
        print("   ❌ No teachers created. Aborting.")
        return

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

    if not courses:
        print("   ❌ No courses created. Enrollments will be skipped.")
    else:
        # 3. Create Students and Enrollments
        students = []
        print("   - Generating Students & Enrollments...")
        for _ in range(20):
            try:
                student = await user_store.create_user(
                    email=f"student_{fake.unique.email()}", password="Password@123", full_name=fake.name(), role="student"
                )
                students.append(student)

                # Enroll in 2 random courses
                enrolled_courses = random.sample(courses, min(len(courses), 2))
                for course in enrolled_courses:
                    # Use class_id instead of course_id based on schema inspection
                    await supabase_db.insert_safe("student_enrollments", {
                        "student_id": student.get("id"),
                        "class_id": course.get("id"), # In this schema 'id' matches 'class_id'
                        "status": "active",
                        "progress": {
                            "completed_lessons": [],
                            "mastery": random.randint(0, 100),
                            "hours_spent": random.randint(1, 20),
                            "last_accessed": fake.date_time_this_month().isoformat()
                        }
                    })
            except Exception as e:
                print(f"      ⚠️ Failed to create student/enrollment: {e}")

        print(f"   - Created {len(students)} Students")

        # 4. Create Quizzes for Courses
        print("   - Generating Quizzes...")
        for course in courses:
            try:
                await supabase_db.insert_safe("quizzes", {
                    "course_id": course.get("id"),
                    "title": f"Intro to {course.get('title') or course.get('name') or 'Course'}",
                    "description": "Initial assessment",
                    "is_published": True,
                    "questions": [
                        {"q": "What is Lumina AI?", "a": "A learning platform"},
                        {"q": "Who is the instructor?", "a": "AI Agent"}
                    ]
                })
            except Exception as e:
                print(f"      ⚠️ Failed to create quiz for {course.get('code')}: {e}")

    print("✅ Seeding Complete! Login with 'Password@123'")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed the Lumina database.")
    parser.add_argument("--clear", action="store_true", help="Clear the database before seeding")
    args = parser.parse_args()

    asyncio.run(seed_data(clear=args.clear))
