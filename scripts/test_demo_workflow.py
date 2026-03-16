import os
import httpx
import asyncio
from dotenv import load_dotenv

load_dotenv()

API_URL = os.getenv("API_URL", "http://127.0.0.1:8000")

async def test_demo_workflow():
    print("--- STARTING DEMO WORKFLOW VERIFICATION ---")
    
    async with httpx.AsyncClient(base_url=API_URL, timeout=30.0) as client:
        # 1. Login as Teacher
        print("\n[Step 1] Logging in as teacher...")
        login_res = await client.post("/api/auth/token", data={
            "username": "teacher@lumina.ai",
            "password": "demo1234"
        })
        if login_res.status_code != 200:
            print(f"❌ Login failed: {login_res.text}")
            return
        
        token = login_res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Content Pipeline: Upload
        print("\n[Step 2] Testing Content Pipeline: Uploading syllabus...")
        upload_params = {
            "original_filename": "syllabus_demo.pdf",
            "storage_url": "https://example.com/syllabus_demo.pdf",
            "file_type": "pdf",
            "file_size_bytes": 1024
        }
        res = await client.post("/api/teacher/content/upload", params=upload_params, headers=headers)
        if res.status_code != 200:
            print(f"❌ Upload failed: {res.text}")
            return
        upload_id = res.json()["id"]
        print(f"✅ Upload successful. ID: {upload_id}")
        
        # 3. Content Pipeline: Mock AI Scaffold (Internal Database update test)
        # We'll skip the manual DB update here and just test the endpoints
        # Assume scaffold generation is done by a background task usually
        
        # 4. AI Verification Queue: Simulate Request
        print("\n[Step 3] Testing AI Verification Queue...")
        
        # Get student ID (from current student)
        # We'll use student@lumina.ai
        student_login = await client.post("/api/auth/token", data={
            "username": "student@lumina.ai",
            "password": "demo1234"
        })
        student_id = "dummy-student-id"
        if student_login.status_code == 200:
            student_token = student_login.json()["access_token"]
            me_res = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {student_token}"})
            student_id = me_res.json().get("id")

        # Create verification item (We'll use a side effect for this since it's not exposed via /ask yet)
        # In a real demo, we'd have a script that populates this.
        # For this test, we verify the endpoint exists and returns correctly (likely empty now)
        
        print(f"Checking verification queue for teacher...")
        queue_res = await client.get("/api/teacher/verification/queue", headers=headers)
        if queue_res.status_code == 200:
            queue = queue_res.json()
            print(f"✅ Queue access successful. Current size: {len(queue)}")
        else:
            print(f"❌ Queue access failed: {queue_res.text}")

        # 5. Teacher Summary Heatmap
        print("\n[Step 4] Testing Teacher Analytics...")
        # We need a course ID. We'll search for AI-101.
        course_res = await client.get("/api/student/dashboard", headers={"Authorization": f"Bearer {student_token}"})
        course_id = None
        if course_res.status_code == 200:
            enrolled = course_res.json().get("enrolled_courses", [])
            if enrolled:
                course_id = enrolled[0]["id"]
        
        if course_id:
            heatmap_res = await client.get(f"/api/teacher/heatmap/{course_id}?student_id={student_id}", headers=headers)
            if heatmap_res.status_code == 200:
                print(f"✅ Heatmap access successful for course {course_id}")
            else:
                print(f"❌ Heatmap access failed: {heatmap_res.text}")

    print("\n--- DEMO WORKFLOW VERIFICATION COMPLETE ---")

if __name__ == "__main__":
    asyncio.run(test_demo_workflow())
