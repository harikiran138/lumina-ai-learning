import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_user_store, get_course_store, get_user_data_store
from app.store.user_store import UserStore
from app.store.course_store import CourseStore
from typing import Optional, Dict, List

# --- Mocks ---
class MockUserStore:
    def __init__(self):
        self.users = {}

    def get_user_by_email(self, email: str):
        return self.users.get(email)

    def create_user(self, email, password, full_name, role):
        user = {
            "id": "mock_id_" + email,
            "email": email,
            "hashed_password": "hashed_" + password, # Dummy hash logic for mock
            "full_name": full_name,
            "role": role,
            "created_at": "2023-01-01"
        }
        self.users[email] = user
        return user

class MockCourseStore:
    def __init__(self):
        self.courses = []

    def list_courses(self):
        return self.courses

    def get_course_by_code(self, code):
        for c in self.courses:
            if c["code"] == code:
                return c
        return None

    def create_course(self, name, code, description, teacher_id):
        course = {
            "id": "course_" + code,
            "name": name,
            "code": code,
            "description": description,
            "teacher_id": teacher_id
        }
        self.courses.append(course)
        return course

class MockUserDataStore:
    # Minimal mock for dependencies if needed
    pass

# --- Fixtures ---
@pytest.fixture(scope="module")
def mock_user_store():
    return MockUserStore()

@pytest.fixture(scope="module")
def mock_course_store():
    return MockCourseStore()

@pytest.fixture(scope="module")
def client(mock_user_store, mock_course_store):
    # Override dependencies
    app.dependency_overrides[get_user_store] = lambda: mock_user_store
    app.dependency_overrides[get_course_store] = lambda: mock_course_store
    # We also need to patch verify_password because our mock store stores "hashed_password" as "hashed_..." 
    # and the real verify_password expects a bcrypt hash.
    # We can mock verify_password in the auth router, OR just make our mock store store real helper compatible data.
    # Easier: Mock `verify_password` in `app.routers.auth` (or core.security).
    
    # Actually, simpler: The auth router calls `verify_password(plain, hashed)`.
    # If we set hashed to be just the plain text (or something known), we need to patch `verify_password`.
    
    # Let's verify how `verify_password` is imported in `auth.py`. 
    # `from app.core.security import ... verify_password`
    # We will MonkeyPatch it.
    
    from app.routers import auth
    original_verify = auth.verify_password
    auth.verify_password = lambda plain, hashed: hashed == "hashed_" + plain
    
    with TestClient(app) as c:
        yield c
    
    # Restores
    app.dependency_overrides.clear()
    auth.verify_password = original_verify
