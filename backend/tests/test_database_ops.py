import pytest
import os
from unittest.mock import patch
from testcontainers.mongodb import MongoDbContainer
from app.store.user_store import UserStore
from app.store.course_store import CourseStore
from app.store.database import Database


def is_docker_available():
    import docker

    try:
        docker.from_env().version()
        return True
    except Exception:
        return False


@pytest.fixture(scope="module")
def mongo_container():
    if not is_docker_available():
        pytest.skip("Docker not available")
    with MongoDbContainer("mongo:latest") as mongo:
        yield mongo


@pytest.fixture(scope="module")
def test_db(mongo_container):
    mongo_url = mongo_container.get_connection_url()

    # Create a fresh database instance for tests
    test_database = Database()
    with patch("app.core.config.settings.MONGODB_URI", mongo_url):
        test_database.connect()
        return test_database.db


def test_user_store_operations(test_db):
    with patch("app.store.user_store.db.get_db", return_value=test_db):
        store = UserStore()

        # Create
        user = store.create_user("test@example.com", "pass", "Test User", "student")
        assert user["email"] == "test@example.com"

        # Get by email
        retrieved = store.get_user_by_email("test@example.com")
        assert retrieved is not None
        assert retrieved["full_name"] == "Test User"

        # Duplicate error
        with pytest.raises(Exception, match="Email already registered"):
            store.create_user("test@example.com", "newpass", "Another", "student")


def test_course_store_operations(test_db):
    with patch("app.store.course_store.db.get_db", return_value=test_db):
        user_store = UserStore()
        teacher = user_store.create_user("teacher@example.com", "pass", "Teacher", "teacher")

        store = CourseStore()
        course = store.create_course("Advanced AI", "AI303", "Deep stuff", teacher["id"])

        assert course["code"] == "AI303"
        assert course["teacher_id"] == teacher["id"]

        # List
        courses = store.list_courses()
        assert len(courses) >= 1
        assert any(c["code"] == "AI303" for c in courses)


def test_seeding_integrity(test_db):
    from app.seed import seed_data

    with patch("app.store.user_store.db.get_db", return_value=test_db), patch(
        "app.store.course_store.db.get_db", return_value=test_db
    ), patch("app.seed.db.get_db", return_value=test_db):
        seed_data(clear=True)

        user_store = UserStore()
        course_store = CourseStore()

        # Verify counts (based on seed.py defaults)
        # Teachers: 10, Students: 100, Courses: ~30
        users_count = test_db.users.count_documents({})
        courses_count = test_db.courses.count_documents({})

        assert users_count == 110  # 10 teachers + 100 students
        assert courses_count > 0
