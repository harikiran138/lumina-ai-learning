import httpx
import asyncio
from typing import Dict, Any, List

BASE_URL = "http://localhost:8000/api"

async def seed_data():
    """Main seeding logic."""
    print("🚀 Starting Lumina-AI seeding...")

    # 1. Register Users (Lumina123! satisfies complexity)
    users = [
        {"email": "teacher@lumina.edu", "password": "Password123!", "full_name": "Dr. Sarah Smith", "role": "teacher"},
        {"email": "student1@lumina.edu", "password": "Password123!", "full_name": "John Doe", "role": "student"},
        {"email": "student2@lumina.edu", "password": "Password123!", "full_name": "Jane Smith", "role": "student"},
    ]

    for user in users:
        print(f"Registering {user['email']}...")
        async with httpx.AsyncClient() as client:
            try:
                resp = await client.post(f"{BASE_URL}/auth/register", json=user)
                if resp.status_code in [200, 201]:
                    print(f"✅ User {user['email']} registered.")
                else:
                    print(f"⚠️ Registration for {user['email']} status: {resp.status_code} - {resp.text}")
            except Exception as e:
                print(f"❌ Error registering {user['email']}: {e}")

    # 2. Login Teacher to get Token (JSON endpoint)
    teacher_creds = {"email": "teacher@lumina.edu", "password": "Password123!"}
    async with httpx.AsyncClient() as client:
        print("Logging in teacher...")
        resp = await client.post(f"{BASE_URL}/auth/login", json=teacher_creds)
        if resp.status_code != 200:
            print(f"❌ Failed to login teacher: {resp.text}")
            return
        token = resp.json().get("accessToken")
        if not token:
            print(f"❌ Login successful but no accessToken in response: {resp.json()}")
            return
        headers = {"Authorization": f"Bearer {token}"}
        print("✅ Teacher logged in.")

    # 3. Create Courses (JSON)
    courses = [
        {"title": "Intro to AI", "code": "AI101", "description": "Fundamentals of AI"},
        {"title": "Advanced ML", "code": "ML202", "description": "Deep Dive into ML"},
        {"title": "Web Development", "code": "CS303", "description": "Intro to Modern Web Apps"},
    ]

    course_ids = []
    for course in courses:
        print(f"Creating course {course['title']}...")
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{BASE_URL}/courses/", json=course, headers=headers)
            if resp.status_code in [200, 201]:
                data = resp.json()
                course_id = data.get("courseId") or data.get("course", {}).get("id")
                if course_id:
                  course_ids.append(course_id)
                  print(f"✅ Course {course['title']} created (ID: {course_id}).")
                else:
                   print(f"⚠️ Course {course['title']} created but no ID returned: {data}")
            else:
                print(f"❌ Failed to create course {course['title']}: {resp.text}")

    # 4. Create Assignments (Form Data)
    for course_id in course_ids:
        assignment_data = {
            "title": "Semester Project",
            "course_id": str(course_id),
            "description": "Complete the final project for this course.",
            "due_date": "2024-12-31T23:59:59Z",
        }
        print(f"Creating assignment for course {course_id}...")
        async with httpx.AsyncClient() as client:
            resp = await client.post(f"{BASE_URL}/assignments/create", data=assignment_data, headers=headers)
            if resp.status_code in [200, 201]:
                print(f"✅ Assignment created for course {course_id}.")
            else:
                print(f"❌ Failed to create assignment for course {course_id}: {resp.text}")

    print("🎉 Seeding complete!")

if __name__ == "__main__":
    asyncio.run(seed_data())
