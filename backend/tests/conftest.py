import pytest
import sys
from unittest.mock import MagicMock

# --- Global Mocks for Heavy Dependencies ---
# These override real imports to prevent ModuleNotFoundError in tests
try:
    import boto3
except ImportError:
    # If missing in test env, mock it
    sys.modules["boto3"] = MagicMock()
    sys.modules["botocore"] = MagicMock()
    sys.modules["botocore.exceptions"] = MagicMock()

# Mock torch and submodules for legacy tests/embeddings
mocks = [
    "torch",
    "torch.nn",
    "torch.optim",
    "torch.utils",
    "torch.utils.data",
    "sentence_transformers",
    "sentence_transformers.cross_encoder",
    "sentence_transformers.cross_encoder.CrossEncoder",
    "transformers",
]
for m in mocks:
    mock_mod = MagicMock()
    # Fix for transformers check
    mock_mod.__spec__ = MagicMock()
    sys.modules[m] = mock_mod

from fastapi.testclient import TestClient
from app.main import app
from app.dependencies import get_user_store, get_course_store, get_user_data_store
from app.store.user_store import UserStore
from app.store.course_store import CourseStore
from app.store.user_data_store import UserDataStore
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
            "hashed_password": "hashed_" + password,
            "full_name": full_name,
            "role": role,
            "created_at": "2023-01-01",
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
            "teacher_id": teacher_id,
        }
        self.courses.append(course)
        return course


class MockUserDataStore:
    def __init__(self):
        self.quiz_attempts = {}  # user_id -> list
        self.notes = {}  # user_id -> list

    def add_quiz_attempt(self, user_id, result):
        if user_id not in self.quiz_attempts:
            self.quiz_attempts[user_id] = []
        self.quiz_attempts[user_id].append(result)

    def get_recent_quiz_stats(self, user_id):
        # Mock logic
        attempts = self.quiz_attempts.get(user_id, [])
        return {"total_attempts": len(attempts), "average_score": 85 if attempts else 0}

    def add_note(self, user_id, content):
        if user_id not in self.notes:
            self.notes[user_id] = []
        self.notes[user_id].append(content)

    def get_notes(self, user_id):
        return self.notes.get(user_id, [])


# --- Fixtures ---
@pytest.fixture(scope="module")
def mock_user_store():
    return MockUserStore()


@pytest.fixture(scope="module")
def mock_course_store():
    return MockCourseStore()


@pytest.fixture(scope="module")
def mock_user_data_store():
    return MockUserDataStore()


@pytest.fixture(scope="module")
def client(mock_user_store, mock_course_store, mock_user_data_store):
    # Override dependencies
    app.dependency_overrides[get_user_store] = lambda: mock_user_store
    app.dependency_overrides[get_course_store] = lambda: mock_course_store
    app.dependency_overrides[get_user_data_store] = lambda: mock_user_data_store

    # Patch verify_password
    from app.routers import auth

    original_verify = auth.verify_password
    auth.verify_password = lambda plain, hashed: hashed == "hashed_" + plain

    with TestClient(app) as c:
        yield c

    # Restores
    app.dependency_overrides.clear()
    auth.verify_password = original_verify
