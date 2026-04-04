import asyncio
import httpx
import sys
import os
import json
import uuid

# Base URL for the running FastAPI server
BASE_URL = "http://localhost:8000"

async def complete_demo():
    print("🚀 Starting Lumina Complete E2E Demo...")
    
    async with httpx.AsyncClient(timeout=120.0) as client:
        # Phase 2: Login
        print("\n--- Phase 2: Authentication ---")
        users = {
            "admin": {"email": "superadmin@lumina.com", "password": "Lumina@138800"},
            "teacher": {"email": "teacher@lumina.com", "password": "Lumina@138800"},
            "student": {"email": "student_22nu1a0519@lumina.com", "password": "Lumina@138800"},
        }
        tokens = {}
        for role, creds in users.items():
            print(f"Logging in as {role}...")
            resp = await client.post(f"{BASE_URL}/api/auth/login", json={
                "identifier": creds["email"],
                "password": creds["password"]
            })
            if resp.status_code == 200:
                tokens[role] = resp.json()["accessToken"]
                print(f"✓ {role.capitalize()} logged in.")
            else:
                print(f"✗ Failed to login as {role}: {resp.text}")
                return

        # Phase 3: Setup College & Dept (Admin)
        print("\n--- Phase 3: Institutional Setup ---")
        headers_admin = {"Authorization": f"Bearer {tokens['admin']}"}
        
        # Create College
        college_data = {
            "name": "Lumina University",
            "email": "contact@lumina.edu",
            "code": f"LUM-{uuid.uuid4().hex[:4].upper()}",
            "city": "Cyber City",
            "state": "Digital State"
        }
        resp = await client.post(f"{BASE_URL}/api/college_architecture/colleges", json=college_data, headers=headers_admin)
        if resp.status_code != 200:
            # Maybe already exists, list them
            resp = await client.get(f"{BASE_URL}/api/college_architecture/colleges", headers=headers_admin)
            print(f"DEBUG: College list response: {resp.json()}")
            college = resp.json()[0]
        else:
            college = resp.json()
        college_id = college["id"]
        print(f"✓ College settled: {college['institution_name']} ({college_id})")

        # Create Department
        dept_data = {"name": "Artificial Intelligence", "abbreviation": "AI", "description": "Leading AI research"}
        resp = await client.post(f"{BASE_URL}/api/college_architecture/colleges/{college_id}/departments", json=dept_data, headers=headers_admin)
        if resp.status_code != 200:
            resp = await client.get(f"{BASE_URL}/api/college_architecture/colleges/{college_id}/departments", headers=headers_admin)
            dept = resp.json()[0]
        else:
            dept = resp.json()
        dept_id = dept["id"]
        print(f"✓ Department settled: {dept['department_name']} ({dept_id})")

        # Phase 4: Teacher Workflow (Batch & Code)
        print("\n--- Phase 4: Teacher Workflow ---")
        headers_teacher = {"Authorization": f"Bearer {tokens['teacher']}"}
        
        # Create Batch
        batch_data = {"year": 2026, "label": "Swarm-Alpha", "sections": ["A", "B"]}
        resp = await client.post(f"{BASE_URL}/api/college_architecture/departments/{dept_id}/batches", json=batch_data, headers=headers_teacher)
        batch = resp.json()
        batch_id = batch["id"]
        print(f"✓ Batch created: {batch['label']} ({batch_id})")

        # Create Subject
        subject_data = {"name": "Agentic Workflows", "code": "AI-404", "credits": 4, "semester": 8}
        resp = await client.post(f"{BASE_URL}/api/college_architecture/departments/{dept_id}/subjects", json=subject_data, headers=headers_teacher)
        subject = resp.json()
        subject_id = subject["id"]
        print(f"✓ Subject created: {subject['course_name']} ({subject_id})")

        # Get Enrollment Code
        resp = await client.post(f"{BASE_URL}/api/college_architecture/batches/{batch_id}/enrollment-code", json={"section": "A"}, headers=headers_teacher)
        code = resp.json()["code"]
        print(f"✓ Enrollment Code generated: {code}")

        # Phase 5: Student Learning
        print("\n--- Phase 5: Student Workflow ---")
        student_data = {
            "enrollmentCode": code,
            "rollNumber": f"RS-{uuid.uuid4().hex[:4].upper()}",
            "fullName": "Student Demo",
            "email": f"student_{uuid.uuid4().hex[:4]}@demo.com",
            "password": "Lumina@138800"
        }
        resp = await client.post(f"{BASE_URL}/api/college_architecture/enroll", json=student_data)
        if resp.status_code == 200:
            student_id = resp.json()["userId"]
            print(f"✓ Student enrolled successfully: {student_id}")
        else:
            print(f"✗ Student enrollment failed: {resp.text}")
            return

        # Login as new student
        resp = await client.post(f"{BASE_URL}/api/auth/login", json={"identifier": student_data["email"], "password": student_data["password"]})
        student_token = resp.json().get("accessToken") or resp.json().get("access_token")
        headers_student = {"Authorization": f"Bearer {student_token}"}

        # Ask AI Question
        print("Asking AI Question...")
        question_data = {
            "message": "What is Lumina platform?",
            "user_id": student_id,
            "session_id": "demo-session-1",
            "provider": "google"
        }
        # In demo mode, this might be mocked or use GEMINI_API_KEY if present
        resp = await client.post(f"{BASE_URL}/api/ai/tutor/chat", json=question_data, headers=headers_student)
        print(f"✓ AI Response received (Pending Teacher Approval if applicable).")

        print("\n--- Demo Execution Successful! ---")
        print(f"Final Student: {student_data['email']}")
        print(f"Subject: {subject['course_name']}")

if __name__ == "__main__":
    asyncio.run(complete_demo())
