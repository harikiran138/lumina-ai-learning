import random
import uuid
from faker import Faker
from app.store.user_store import UserStore
from app.store.course_store import CourseStore
from app.core.security import get_password_hash

fake = Faker()
user_store = UserStore()
course_store = CourseStore()

def seed_data():
    print("🌱 Seeding Lumina Database...")
    
    # 1. Create Organizations (Logical grouping for now)
    orgs = ["Lumina Academy", "Tech High", "Future University"]
    print(f"   - Created {len(orgs)} Organizations")

    # 2. Create Teachers
    teachers = []
    for _ in range(10):
        email = fake.unique.email()
        teacher = user_store.create_user(
            email=email,
            password="password123",
            full_name=fake.name(),
            role="teacher"
        )
        teachers.append(teacher)
    print(f"   - Created {len(teachers)} Teachers")

    # 3. Create Courses
    courses = []
    course_topics = ["Calculus", "Physics", "Chemistry", "Biology", "AI", "History", "Literature"]
    for _ in range(50):
        topic = random.choice(course_topics)
        name = f"Intro to {topic} {random.randint(101, 203)}"
        teacher = random.choice(teachers)
        
        try:
            course = course_store.create_course(
                name=name,
                code=f"{topic[:3].lower()}{random.randint(100,999)}",
                description=fake.catch_phrase(),
                teacher_id=teacher["id"]
            )
            courses.append(course)
        except Exception:
            continue # Skip duplicates
    print(f"   - Created {len(courses)} Courses")

    # 4. Create Students
    students = []
    for _ in range(200):
        email = fake.unique.email()
        student = user_store.create_user(
            email=email,
            password="password123",
            full_name=fake.name(),
            role="student"
        )
        students.append(student)
    print(f"   - Created {len(students)} Students")

    print("✅ Seeding Complete! Login with any email and 'password123'")

if __name__ == "__main__":
    seed_data()
