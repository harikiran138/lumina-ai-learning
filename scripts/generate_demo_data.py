import os
import uuid
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client
from app.core.security import get_password_hash

load_dotenv()

SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_ROLE_KEY") # Use service role key for seeding

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY not found in .env")
    exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Use a fixed password for all demo users
DEMO_PASSWORD_HASH = get_password_hash("demo1234")

async def seed_data():
    print("🚀 Starting Demo Data Generation...")

    # 1. Clear existing demo data (optional but recommended for a clean demo)
    # Note: We'll skip clearing for now to avoid side effects, unless emails match.
    emails = ["teacher@lumina.ai", "student@lumina.ai", "alice@lumina.ai", "bob@lumina.ai"]
    supabase.table("users").delete().in_("email", emails).execute()

    # 2. Create Users
    users_to_create = [
        {"email": "teacher@lumina.ai", "password_hash": DEMO_PASSWORD_HASH, "name": "Prof. David", "role": "teacher"},
        {"email": "student@lumina.ai", "password_hash": DEMO_PASSWORD_HASH, "name": "Justin Student", "role": "student"},
        {"email": "alice@lumina.ai", "password_hash": DEMO_PASSWORD_HASH, "name": "Alice Wonder", "role": "student"},
        {"email": "bob@lumina.ai", "password_hash": DEMO_PASSWORD_HASH, "name": "Bob Builder", "role": "student"},
    ]
    
    user_results = supabase.table("users").insert(users_to_create).execute()
    created_users = {u["email"]: u["id"] for u in user_results.data}
    print(f"✅ Created {len(created_users)} users.")

    teacher_id = created_users["teacher@lumina.ai"]

    # 3. Create Course
    course_data = {
        "code": "AI-101",
        "name": "Artificial Intelligence Foundations",
        "description": "A comprehensive introduction to machine learning, neural networks, and generative models.",
        "teacher_id": teacher_id,
        "subject": "Computer Science",
        "difficulty_level": "beginner",
        "is_published": True
    }
    course_result = supabase.table("courses").insert(course_data).execute()
    course = course_result.data[0]
    course_id = course["id"]
    print(f"✅ Created Course: {course['name']} ({course['id']})")

    # 4. Create Knowledge Nodes (Concepts)
    concepts = [
        {"course_id": course_id, "concept": "Machine Learning Basics", "subject": "AI", "difficulty": "beginner"},
        {"course_id": course_id, "concept": "Neural Networks", "subject": "AI", "difficulty": "intermediate"},
        {"course_id": course_id, "concept": "Natural Language Processing", "subject": "AI", "difficulty": "intermediate"},
        {"course_id": course_id, "concept": "Computer Vision", "subject": "AI", "difficulty": "intermediate"},
        {"course_id": course_id, "concept": "Generative Models", "subject": "AI", "difficulty": "advanced"},
    ]
    kn_results = supabase.table("knowledge_nodes").insert(concepts).execute()
    kn_ids = [kn["id"] for kn in kn_results.data]
    print(f"✅ Created {len(kn_ids)} knowledge nodes.")

    # 5. Create Progress & Enrollments
    progress_data = []
    student_ids = [created_users[m] for m in ["student@lumina.ai", "alice@lumina.ai", "bob@lumina.ai"]]
    
    import random
    for sid in student_ids:
        progress_data.append({
            "user_id": sid,
            "course_id": course_id,
            "mastery": round(random.uniform(0.1, 0.9), 2),
            "hours_spent": round(random.uniform(5, 50), 1),
            "daily_streak": random.randint(0, 15)
        })
    
    supabase.table("progress").insert(progress_data).execute()
    print(f"✅ Enrolled {len(student_ids)} students and seeded progress.")

    # 6. Create Assignments
    assignments = [
        {
            "course_id": course_id,
            "creator_id": teacher_id,
            "title": "Machine Learning Essay",
            "description": "Write a 500-word essay on the impact of transformers.",
            "assignment_type": "essay",
            "due_date": (datetime.utcnow() + timedelta(days=7)).isoformat(),
            "is_published": True
        },
        {
            "course_id": course_id,
            "creator_id": teacher_id,
            "title": "Handwritten Math Quiz",
            "description": "Solve the attached calculus problems and upload a photo.",
            "assignment_type": "file_upload",
            "due_date": (datetime.utcnow() + timedelta(days=3)).isoformat(),
            "is_published": True
        }
    ]
    supabase.table("assignments").insert(assignments).execute()
    print(f"✅ Created 2 assignments.")

    print("\n🎉 Demo data generation complete!")

if __name__ == "__main__":
    import asyncio
    asyncio.run(seed_data())
