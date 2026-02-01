from locust import HttpUser, task, between
import random
import string

class StudentUser(HttpUser):
    wait_time = between(1, 3)

    def on_start(self):
        # Generate random credentials for this session
        self.email = f"test_{''.join(random.choices(string.ascii_lowercase, k=8))}@lumina.com"
        self.password = "password123"
        self.full_name = "Load Test User"

        # Register
        self.client.post("/api/auth/register", json={
            "email": self.email,
            "password": self.password,
            "full_name": self.full_name,
            "role": "student"
        })

        # Login
        response = self.client.post("/api/auth/token", data={
            "username": self.email,
            "password": self.password
        })

        if response.status_code == 200:
            self.token = response.json().get("access_token")
            self.headers = {"Authorization": f"Bearer {self.token}"}
        else:
            self.token = None
            self.headers = {}

    @task(3)
    def view_courses(self):
        if self.token:
            self.client.get("/api/courses/list", headers=self.headers)

    @task(2)
    def tutor_chat_task(self):
        if self.token:
            messages = [
                "Explain Quantum Mechanics like I'm five.",
                "What is the difference between SQL and NoSQL?",
                "How do I start learning React?",
                "Tell me a joke about programming."
            ]
            self.client.post("/api/tutor/chat", json={
                "message": random.choice(messages),
                "user_id": self.email,
                "session_id": "load_test_session"
            }, headers=self.headers)

    @task(1)
    def generate_ppt_task(self):
        """Heavy compute task: PPT generation with Gemini."""
        if self.token:
            topics = ["Deep Learning", "Global Warming", "History of Rome", "Space X"]
            self.client.post("/api/tutor/generate-ppt", json={
                "topic": random.choice(topics),
                "slides_count": 5
            }, headers=self.headers)

    @task(1)
    def view_profile(self):
        if self.token:
            self.client.get("/api/auth/me", headers=self.headers)

    @task(1)
    def health_check(self):
        self.client.get("/health")
