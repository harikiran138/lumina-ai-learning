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
            "admin": {"email": "superadmin@lumina.com", "password": "password"},
            "teacher": {"email": "teacher@lumina.com", "password": "password"},
            "student": {"email": "student_22nu1a0519@lumina.com", "password": "password"},
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
            "code": "LUM",
            "city": "San Francisco",
            "state": "CA",
            "login_policy": "email_only"
        }
        resp = await client.post(f"{BASE_URL}/api/colleges", json=college_data, headers=headers_admin)
        if resp.status_code != 200:
            # Maybe already exists, list them
            resp = await client.get(f"{BASE_URL}/api/colleges", headers=headers_admin)
            print(f"DEBUG: College list response: {resp.json()}")
            json_resp = resp.json()
            if isinstance(json_resp, list) and len(json_resp) > 0:
                college = json_resp[0]
            else:
                print(f"✗ Failed to create or list colleges: {json_resp}")
                return
        else:
            college = resp.json()
        college_id = college["id"]
        print(f"✓ College settled: {college.get('institution_name', college.get('name', 'Unknown'))} ({college_id})")

        # Create Department
        dept_data = {"name": "Artificial Intelligence", "abbreviation": "AI", "description": "Leading AI research"}
        resp = await client.post(f"{BASE_URL}/api/colleges/{college_id}/departments", json=dept_data, headers=headers_admin)
        if resp.status_code != 200:
            resp = await client.get(f"{BASE_URL}/api/colleges/{college_id}/departments", headers=headers_admin)
            print(f"DEBUG: Dept list response: {resp.json()}")
            json_resp = resp.json()
            if isinstance(json_resp, list) and len(json_resp) > 0:
                dept = json_resp[0]
            else:
                print(f"✗ Failed to create or list departments: {json_resp}")
                return
        else:
            dept = resp.json()
        dept_id = dept["id"]
        print(f"✓ Department settled: {dept['department_name']} ({dept_id})")

        # Phase 4: Teacher Workflow (Batch & Code)
        print("\n--- Phase 4: Teacher Workflow ---")
        headers_teacher = {"Authorization": f"Bearer {tokens['teacher']}"}
        
        # Create Batch
        batch_data = {"year": 2026, "label": "Swarm-Alpha", "sections": ["A", "B"]}
        resp = await client.post(f"{BASE_URL}/api/departments/{dept_id}/batches", json=batch_data, headers=headers_teacher)
        if resp.status_code != 200:
            print(f"DEBUG: Batch create resp: {resp.json()}")
            resp = await client.get(f"{BASE_URL}/api/departments/{dept_id}/batches", headers=headers_teacher)
            json_resp = resp.json()
            if isinstance(json_resp, list) and len(json_resp) > 0:
                batch = json_resp[0]
            else:
                print(f"✗ Failed to create or list batches: {json_resp}")
                return
        else:
            batch = resp.json()
            
        batch_id = batch["id"]
        print(f"✓ Batch settled: {batch['label']} ({batch_id})")

        # Create Subject
        subject_data = {"name": "Agentic Workflows", "code": "AI-404", "credits": 4, "semester": 8}
        resp = await client.post(f"{BASE_URL}/api/departments/{dept_id}/subjects", json=subject_data, headers=headers_teacher)
        if resp.status_code != 200:
            print(f"DEBUG: Subject create resp: {resp.json()}")
            resp = await client.get(f"{BASE_URL}/api/departments/{dept_id}/subjects", headers=headers_teacher)
            json_resp = resp.json()
            if isinstance(json_resp, list) and len(json_resp) > 0:
                subject = json_resp[0]
            else:
                print(f"✗ Failed to create or list subjects: {json_resp}")
                return
        else:
            subject = resp.json()
            
        subject_id = subject["id"]
        print(f"✓ Subject settled: {subject.get('course_name', 'Unknown')} ({subject_id})")

        # Get Enrollment Code
        resp = await client.post(f"{BASE_URL}/api/batches/{batch_id}/enrollment-code", json={"section": "A"}, headers=headers_teacher)
        if resp.status_code != 200:
            print(f"✗ Failed to generate enrollment code: {resp.json()}")
            return
        code = resp.json()["code"]
        print(f"✓ Enrollment Code generated: {code}")

        # Phase 5: Student Learning
        print("\n--- Phase 5: Student Workflow ---")
        student_data = {
            "enrollmentCode": code,
            "rollNumber": f"RS-{uuid.uuid4().hex[:4].upper()}",
            "fullName": "Student Demo",
            "email": f"demo_student_{uuid.uuid4().hex[:4]}@lumina.com",
            "password": "Password123!"
        }
        resp = await client.post(f"{BASE_URL}/api/enroll", json=student_data)
        if resp.status_code != 200:
             print(f"✗ Failed to enroll student or update info: {resp.status_code} {resp.text}")
        else:
             print(f"✓ Student enrolled successfully via enrollment code.")
             
        # Ask AI Tutor
        print("\n--- Asking AI Tutor ---")
        headers_student = {"Authorization": f"Bearer {tokens['student']}"}
        ai_resp = await client.post(f"{BASE_URL}/api/ai/ask", json={
            "query": "Explain what an abstract class is.",
            "subject_id": subject_id
        }, headers=headers_student)
        if ai_resp.status_code == 200:
            print(f"✓ AI Tutor response length: {len(ai_resp.json().get('text', ''))}")
        else:
            print(f"✗ Failed AI Tutor query: {ai_resp.text}")

        # Dashboard Test
        print("\n--- Validating Dashboards ---")
        student_dash = await client.get(f"{BASE_URL}/api/student/dashboard", headers=headers_student)
        print(f"✓ Student Dashboard: {'OK' if student_dash.status_code == 200 else 'FAIL'} {student_dash.status_code}")

        teacher_dash = await client.get(f"{BASE_URL}/api/teacher/dashboard", headers=headers_teacher)
        print(f"✓ Teacher Dashboard: {'OK' if teacher_dash.status_code == 200 else 'FAIL'} {teacher_dash.status_code}")

        print("\n✅ End-to-End Demo Complete!")

if __name__ == "__main__":
    asyncio.run(complete_demo())
