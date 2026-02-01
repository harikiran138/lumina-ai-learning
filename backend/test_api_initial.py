import requests
import json
import uuid
import os

BASE_URL = "http://localhost:8000"
API_URL = f"{BASE_URL}/api"


# Helper to print colored status
def print_result(name, success, data=None):
    status = "✅ PASS" if success else "❌ FAIL"
    print(f"{status} - {name}")
    if not success and data:
        print(f"   Error: {data}")
    return success


class Tester:
    def __init__(self):
        self.session = requests.Session()
        self.users = {}
        self.tokens = {}

    def register(self, role, name_prefix):
        email = f"{name_prefix}_{uuid.uuid4().hex[:6]}@example.com"
        password = "secretpassword"
        payload = {
            "email": email,
            "password": password,
            "full_name": f"{name_prefix.capitalize()} User",
            "role": role,
        }
        res = requests.post(f"{API_URL}/auth/register", json=payload)
        if res.status_code == 200:
            user = res.json()
            self.users[role] = user
            print_result(f"Register {role}", True)
            # Login
            login_data = {"username": email, "password": password}
            token_res = requests.post(f"{API_URL}/auth/token", data=login_data)
            if token_res.status_code == 200:
                self.tokens[role] = token_res.json()["access_token"]
                print_result(f"Login {role}", True)
                return True
        print_result(f"Register/Login {role}", False, res.text)
        return False

    def create_course(self):
        if "teacher" not in self.tokens:
            return False

        headers = {"Authorization": f"Bearer {self.tokens['teacher']}"}
        code = f"CS{uuid.uuid4().hex[:4].upper()}"
        data = {"name": f"Intro to AI {code}", "code": code, "description": "A test course"}
        res = requests.post(f"{API_URL}/courses/create", data=data, headers=headers)
        if res.status_code == 200:
            self.course_id = res.json()["course"]["id"]
            print_result("Create Course (Teacher)", True)
            return True
        print_result("Create Course", False, res.text)
        return False

    def list_assignments(self, role):
        token = self.tokens.get(role)
        headers = {"Authorization": f"Bearer {token}"} if token else {}
        res = requests.get(f"{API_URL}/assignments/list", headers=headers)
        if res.status_code == 200:
            print_result(f"List Assignments ({role})", True)
            return True
        print_result(f"List Assignments ({role})", False, res.text)
        return False

    def create_assignment(self):
        if "teacher" not in self.tokens or not hasattr(self, "course_id"):
            return False
        headers = {"Authorization": f"Bearer {self.tokens['teacher']}"}
        data = {
            "title": "Test Assignment 1",
            "course_id": self.course_id,
            "description": "Write an essay about AI.",
            "due_date": "2024-12-31T23:59:59Z",
        }
        res = requests.post(f"{API_URL}/assignments/create", data=data, headers=headers)
        if res.status_code == 200:
            self.assignment_id = res.json()["assignment"]["id"]
            print_result("Create Assignment", True)
            return True
        print_result("Create Assignment", False, res.text)
        return False

    def submit_assignment(self):
        if "student" not in self.tokens or not hasattr(self, "assignment_id"):
            return False
        headers = {"Authorization": f"Bearer {self.tokens['student']}"}

        # Create a dummy file
        with open("test_submission.txt", "w") as f:
            f.write("This is a test submission content.")

        with open("test_submission.txt", "rb") as f:
            files = {"file": ("test_submission.txt", f, "text/plain")}
            data = {"assignment_id": self.assignment_id}
            res = requests.post(
                f"{API_URL}/assignments/submit", data=data, files=files, headers=headers
            )

        os.remove("test_submission.txt")

        if res.status_code == 200:
            self.submission_id = res.json()["submission"]["id"]
            print_result("Submit Assignment (Student)", True)
            return True
        print_result("Submit Assignment", False, res.text)
        return False

    def upload_note(self):
        user_id = self.users.get("student", {}).get("id", "guest")

        with open("test_note.txt", "w") as f:
            f.write(
                "Newton's laws of motion are three laws that describe the relationship between the motion of an object and the forces acting on it."
            )

        with open("test_note.txt", "rb") as f:
            files = {"file": ("test_note.txt", f, "text/plain")}
            data = {"type": "note", "user_id": user_id, "course_id": "test_course"}
            res = requests.post(f"{API_URL}/handwriting/upload", data=data, files=files)

        os.remove("test_note.txt")

        if res.status_code == 200:
            print_result("Upload Note (Handwriting)", True)
            return True
        print_result("Upload Note (Handwriting)", False, res.text)
        return False


if __name__ == "__main__":
    t = Tester()
    print("--- 1. Authentication Flow ---")
    if t.register("teacher", "mr_smith"):
        t.register("student", "johnny")

        print("\n--- 2. Course Management ---")
        if t.create_course():
            print("\n--- 3. Assignment Flow ---")
            if t.create_assignment():
                t.list_assignments("student")
                t.submit_assignment()

        print("\n--- 4. Notes & Handwriting ---")
        t.upload_note()

    print("\nTests Completed.")
