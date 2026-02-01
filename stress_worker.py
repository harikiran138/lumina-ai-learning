from locust import HttpUser, task, between
import random
import string
import os

class WorkerStressUser(HttpUser):
    wait_time = between(0.1, 0.5) # Fast submission

    def on_start(self):
        # 1. Setup User
        self.email = f"stress_{''.join(random.choices(string.ascii_lowercase, k=8))}@example.com"
        self.password = "password123"

        # Register & Login
        self.client.post("/api/auth/register", json={
            "email": self.email,
            "password": self.password,
            "full_name": "stresser",
            "role": "teacher" # Need teacher to create assignment
        })

        resp = self.client.post("/api/auth/token", data={"username": self.email, "password": self.password})
        self.token = resp.json().get("access_token")
        self.headers = {"Authorization": f"Bearer {self.token}"}

        # 2. Setup Assignment
        setup_resp = self.client.post("/api/assignments/create", headers=self.headers, data={
            "title": "Stress Test Assignment",
            "course_id": "course_123",
            "description": "Grading stress test",
            "due_date": "2026-12-31"
        })
        self.assignment_id = setup_resp.json().get("assignment", {}).get("id")

    @task
    def submit_and_grade(self):
        if not self.assignment_id:
            return

        # 1. Submit
        with open("dummy.pdf", "rb") as f:
            sub_resp = self.client.post("/api/assignments/submit", headers=self.headers,
                data={"assignment_id": self.assignment_id},
                files={"file": ("dummy.pdf", f, "application/pdf")}
            )

        submission_id = sub_resp.json().get("submission", {}).get("id")

        if submission_id:
            # 2. Trigger Grading (Dispatches to Celery)
            self.client.post(f"/api/assignments/{self.assignment_id}/submissions/{submission_id}/grade", headers=self.headers)
