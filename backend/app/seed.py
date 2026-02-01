import random
import uuid
import argparse
from faker import Faker
from app.store.user_store import UserStore
from app.store.course_store import CourseStore
from app.store.database import db

fake = Faker()
user_store = UserStore()
course_store = CourseStore()


def clear_database():
    print("🧹 Clearing Database...")
    _db = db.get_db()
    if _db is not None:
        collections = _db.list_collection_names()
        for col in collections:
            if col != "system.indexes":
                _db[col].delete_many({})
        print(f"   - Cleared {len(collections)} collections")


def seed_data(clear=False):
    if clear:
        clear_database()

    print("🌱 Seeding Lumina Database...")

    # 1. Create Teachers
    teachers = []
    print("   - Generating Teachers...")
    for _ in range(10):
        email = fake.unique.email()
        teacher = user_store.create_user(
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
    ]

    for _ in range(30):
        topic, category = random.choice(course_topics)
        name = f"{topic}: {fake.catch_phrase()}"
        code = f"{topic[:2].upper()}{random.randint(100, 999)}"
        teacher = random.choice(teachers)

        try:
            course = course_store.create_course(
                name=name,
                code=code,
                description=fake.paragraph(nb_sentences=3),
                teacher_id=teacher["id"],
            )
            # Add metadata if possible (even if store doesn't explicitly handle it,
            # we can pass it if we modify create_course or just simulate it)
            courses.append(course)
        except Exception:
            continue
    print(f"   - Created {len(courses)} Courses")

    # 3. Create Students and Enrollments
    students = []
    print("   - Generating Students & Enrollments...")
    for _ in range(100):
        student = user_store.create_user(
            email=fake.unique.email(), password="password123", full_name=fake.name(), role="student"
        )
        students.append(student)

        # Simulate enrollment in 1-3 courses
        enrolled_count = random.randint(1, 3)
        enrolled_courses = random.sample(courses, min(enrolled_count, len(courses)))

        # Since we don't have an enrollment store yet, we'll just log it
        # In a real app, we'd have an enrollment table.

    print(f"   - Created {len(students)} Students")
    print("✅ Seeding Complete! Login with any email and 'password123'")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Seed the Lumina database.")
    parser.add_argument("--clear", action="store_true", help="Clear the database before seeding")
    args = parser.parse_args()

    seed_data(clear=args.clear)
