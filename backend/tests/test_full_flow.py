import requests
import sys

BASE_URL = "http://127.0.0.1:8000/api"

def test_flow():
    # 1. Register Teacher
    print("1. Registering Teacher...")
    teacher_email = "teacher_test@example.com"
    teacher_password = "password123"
    try:
        res = requests.post(f"{BASE_URL}/auth/register", json={
            "email": teacher_email,
            "password": teacher_password,
            "full_name": "Test Teacher",
            "role": "teacher"
        })
        if res.status_code == 200:
            print("   Teacher registered.")
        elif res.status_code == 400 and "already registered" in res.text:
            print("   Teacher already exists.")
        else:
            print(f"   Failed: {res.text}")
            return
    except Exception as e:
        print(f"   Failed to connect: {e}")
        return

    # 2. Login Teacher
    print("2. Logging in Teacher...")
    res = requests.post(f"{BASE_URL}/auth/token", data={
        "username": teacher_email,
        "password": teacher_password
    })
    if res.status_code != 200:
        print(f"   Login failed: {res.text}")
        return
    teacher_token = res.json()["access_token"]
    print("   Teacher logged in.")
    teacher_headers = {"Authorization": f"Bearer {teacher_token}"}

    # 3. Create Course
    print("3. Creating Course...")
    res = requests.post(f"{BASE_URL}/courses/create", headers=teacher_headers, data={
        "name": "Test Course 101",
        "code": "TEST101",
        "description": "A test course"
    })
    if res.status_code == 200:
        course = res.json()["course"]
        course_id = course.get("id") or course.get("_id") # Handle both potentially
        print(f"   Course created: {course['name']} ({course_id})")
    elif res.status_code == 400 and "already exists" in res.text:
        print("   Course already exists (skipping creation).")
        # Try to find it in list
        res = requests.get(f"{BASE_URL}/courses/list")
        courses = res.json()
        course = next((c for c in courses if c["code"] == "TEST101"), None)
        course_id = course["id"]
        print(f"   Found existing course: {course_id}")
    else:
        print(f"   Failed: {res.text}")
        return

    # 4. Create Assignment
    print("4. Creating Assignment...")
    res = requests.post(f"{BASE_URL}/assignments/create", headers=teacher_headers, data={
        "title": "Test Assignment 1",
        "course_id": course_id,
        "description": "Solve 2+2",
        "due_date": "2025-01-01T00:00:00"
    })
    if res.status_code == 200:
        assignment = res.json()["assignment"]
        assignment_id = assignment["id"]
        print(f"   Assignment created: {assignment['title']} ({assignment_id})")
    else:
        print(f"   Failed: {res.text}")
        return

    # 5. Register Student
    print("5. Registering Student...")
    student_email = "student_test@example.com"
    student_password = "password123"
    try:
        res = requests.post(f"{BASE_URL}/auth/register", json={
            "email": student_email,
            "password": student_password,
            "full_name": "Test Student",
            "role": "student"
        })
        if res.status_code == 200:
            print("   Student registered.")
        elif res.status_code == 400:
            print("   Student already exists.")
    except:
        pass

    # 6. Login Student
    print("6. Logging in Student...")
    res = requests.post(f"{BASE_URL}/auth/token", data={
        "username": student_email,
        "password": student_password
    })
    student_token = res.json()["access_token"]
    student_headers = {"Authorization": f"Bearer {student_token}"}
    print("   Student logged in.")

    # 7. Submit Assignment
    print("7. Submitting Assignment...")
    # Create a dummy file
    with open("test_submission.txt", "w") as f:
        f.write("The answer is 4.")
    
    with open("test_submission.txt", "rb") as f:
        res = requests.post(
            f"{BASE_URL}/assignments/submit",
            headers=student_headers,
            data={"assignment_id": assignment_id},
            files={"file": ("test_submission.txt", f, "text/plain")}
        )
    
    if res.status_code == 200:
        submission = res.json()["submission"]
        submission_id = submission["id"]
        print(f"   Assignment submitted: {submission_id}")
    else:
        print(f"   Failed: {res.text}")
        return

    # 8. List Submissions (Teacher)
    print("8. Check Submissions (Teacher)...")
    res = requests.get(f"{BASE_URL}/assignments/{assignment_id}/submissions", headers=teacher_headers)
    if res.status_code == 200:
        subs = res.json()
        print(f"   Found {len(subs)} submissions.")
        if len(subs) > 0:
            print("   Flow Success!")
    else:
        print(f"   Failed: {res.text}")

if __name__ == "__main__":
    try:
        import requests
        test_flow()
    except ImportError:
        print("requests library not found. Please install it (pip install requests) to run this test.")
