import random
import uuid
import argparse
import asyncio
from faker import Faker
from app.store.user_store import UserStore
from app.store.course_store import CourseStore
from app.database.manager import db

fake = Faker()
user_store = UserStore()
course_store = CourseStore()


async def clear_database():
    print("🧹 Clearing Database...")
    _db = db.get_db()
    if _db is not None:
        collections = await _db.list_collection_names()
        for col in collections:
            if not col.startswith("system."):
                await _db[col].delete_many({})
        print(f"   - Cleared {len(collections)} collections")


async def seed_data(clear=False):
    await db.connect()

    if clear:
        await clear_database()

    print("🌱 Seeding Lumina Database...")

    # 1. Create Teachers
    teachers = []
    print("   - Generating Teachers...")
    for _ in range(10):
        email = fake.unique.email()
        teacher = await user_store.create_user(
            email=email, password="password123", full_name=fake.name(), role="teacher"
        )
        teachers.append(teacher)
    print(f"   - Created {len(teachers)} Teachers")

    # 2. Create Courses
    courses = []
    print("   - Generating Courses...")
    course_topics = [
        ("Calculus", "Mathematics"),
        ("Quantum Mechanics", "Physics"),
        ("Organic Chemistry", "Science"),
        ("Microbiology", "Science"),
        ("Machine Learning", "Technology"),
        ("Ancient History", "Humanities"),
        ("Post-Modern Literature", "Humanities"),
        ("Artificial Intelligence", "Technology"),
        ("Neuroscience", "Science"),
        ("Macroeconomics", "Business"),
    ]

    for _ in range(30):
        topic, category = random.choice(course_topics)
        name = f"{topic}: {fake.catch_phrase()}"
        code = f"{topic[:2].upper()}{random.randint(100, 999)}-{uuid.uuid4().hex[:4].upper()}"
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
    for _ in range(50):
        student = await user_store.create_user(
            email=fake.unique.email(), password="password123", full_name=fake.name(), role="student"
        )
        students.append(student)

        # Simulate enrollment in 1-3 courses (Future Phase)

    print(f"   - Created {len(students)} Students")
    print("✅ Seeding Complete! Login with any email and 'password123'")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed the Lumina database.")
    parser.add_argument("--clear", action="store_true", help="Clear the database before seeding")
    args = parser.parse_args()

    asyncio.run(seed_data(clear=args.clear))
