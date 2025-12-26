import requests
import os
import time

BASE_URL = "http://localhost:8000/api"
TEACHER_EMAIL = "teacher_flow@test.com"
STUDENT_EMAIL = "student_flow@test.com"
PASSWORD = "password123"

# Colors for output
GREEN = "\033[92m"
RED = "\033[91m"
RESET = "\033[0m"

def log(msg, success=True):
    color = GREEN if success else RED
    print(f"{color}{msg}{RESET}")

def get_token(email, password, role="student"):
    # register first just in case
    requests.post(f"{BASE_URL}/auth/register", json={
        "email": email, "password": password, "full_name": "Test User", "role": role
    })
    
    resp = requests.post(f"{BASE_URL}/auth/token", data={
        "username": email, "password": password
    })
    if resp.status_code == 200:
        return resp.json()["access_token"]
    return None

def run_test():
    print("--- Starting Course & Assignment Flow Verification ---")
    
    # 1. Setup Identity
    teacher_token = get_token(TEACHER_EMAIL, PASSWORD, "teacher")
    student_token = get_token(STUDENT_EMAIL, PASSWORD, "student")
    
    teacher_headers = {"Authorization": f"Bearer {teacher_token}"}
    student_headers = {"Authorization": f"Bearer {student_token}"}
    
    if not teacher_token or not student_token:
        log("❌ Failed to authenticate users", False)
        return

    # 2. Link Course (Course Creation)
    log("▶️  Step 1: Creating Course...")
    course_data = {
        "name": "Advanced AI Projects",
        "code": f"AI999_{int(time.time())}",
        "description": "Project based learning course"
    }
    resp = requests.post(f"{BASE_URL}/courses/create", data=course_data, headers=teacher_headers)
    if resp.status_code == 200:
        course_id = resp.json()["course"]["id"]
        log(f"✅ Course Created: {course_id}")
    else:
        log(f"❌ Failed to create course: {resp.text}", False)
        return

    # 3. Create Project (Assignment)
    log("▶️  Step 2: Creating Project (Assignment)...")
    assign_data = {
        "title": "Final Capstone Project",
        "course_id": course_id,
        "description": "Build a Generative AI application. Rubric: Innovation (40%), Technical (40%), Docs (20%)",
        "due_date": "2024-12-31T23:59:59"
    }
    resp = requests.post(f"{BASE_URL}/assignments/create", data=assign_data, headers=teacher_headers)
    if resp.status_code == 200:
        assignment_id = resp.json()["assignment"]["id"]
        log(f"✅ Project/Assignment Created: {assignment_id}")
    else:
        log(f"❌ Failed to create assignment: {resp.text}", False)
        return

    # 4. Student 'Enrolls' & Submits
    # Note: No explicit enrollment, just access
    log("▶️  Step 3: Student Submitting Project...")
    
    # Create a dummy project file
    with open("project_submission.txt", "w") as f:
        f.write("This is my AI project submission. It uses LLMs to generate art.\nDocumentation involved.")
        
    with open("project_submission.txt", "rb") as f:
        files = {"file": ("project.txt", f, "text/plain")}
        data = {"assignment_id": assignment_id}
        resp = requests.post(f"{BASE_URL}/assignments/submit", data=data, files=files, headers=student_headers)
        
    if resp.status_code == 200:
        submission = resp.json()["submission"]
        submission_id = submission["id"]
        log(f"✅ Student Submitted Project: {submission_id}")
    else:
        log(f"❌ Failed to submit project: {resp.text}", False)
        return

    # 5. Teacher Grades Project
    log("▶️  Step 4: Teacher Grading Project...")
    # Using manual score update for reliability in this test, though /grade endpoint exists for AI grading
    grade_data = {
        "score": 95,
        "feedback": "Excellent work on the capstone! Innovative approach."
    }
    resp = requests.put(f"{BASE_URL}/assignments/{assignment_id}/submissions/{submission_id}/score", 
                        json=grade_data, headers=teacher_headers)
    
    if resp.status_code == 200:
        log(f"✅ Project Graded: 95/100")
    else:
        log(f"❌ Failed to grade project: {resp.text}", False)
        return

    # 6. Verify Student Sees Grade
    log("▶️  Step 5: Verifying Grade Visibility...")
    resp = requests.get(f"{BASE_URL}/assignments/list?student_id={submission['student_id']}&course_id={course_id}", headers=student_headers)
    
    if resp.status_code == 200:
        assignments = resp.json()
        target = next((a for a in assignments if a["id"] == assignment_id), None)
        if target and "user_submission" in target:
             grade = target["user_submission"].get("score")
             log(f"✅ Student verified grade: {grade}")
        else:
             log("❌ Grade not visible to student", False)
    else:
        log(f"❌ Failed to fetch assignments: {resp.text}", False)

    # Cleanup
    if os.path.exists("project_submission.txt"):
        os.remove("project_submission.txt")

if __name__ == "__main__":
    run_test()
