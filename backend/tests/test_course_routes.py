import pytest
from httpx import AsyncClient, ASGITransport
import uuid
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.main import app
from app.store.user_store import UserStore
from app.store.course_store import CourseStore

@pytest.fixture
async def ac():
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://localhost") as client:  # nosec B113
        yield client

def gen_user_data():
    uid = str(uuid.uuid4())[:8]
    phone = f"+1555{uuid.uuid4().int % 1000000:06d}"
    return f"test_{uid}@example.com", "password123", "Test User", "teacher", phone

@pytest.fixture
async def teacher_user():
    user_store = UserStore()
    email, pwd, name, role, phone = gen_user_data()
    user = await user_store.create_user(email, pwd, name, "teacher", phone)
    yield user, pwd
    await user_store.delete_user(user["id"])

@pytest.fixture
async def student_user():
    user_store = UserStore()
    uid = str(uuid.uuid4())[:8]
    email = f"student_{uid}@example.com"
    pwd = "password123"
    phone = f"+1555{uuid.uuid4().int % 1000000:06d}"
    user = await user_store.create_user(email, pwd, "Student", "student", phone)
    yield user, pwd
    await user_store.delete_user(user["id"])

@pytest.fixture
async def admin_user():
    user_store = UserStore()
    uid = str(uuid.uuid4())[:8]
    email = f"admin_{uid}@example.com"
    pwd = "password123"
    phone = f"+1555{uuid.uuid4().int % 1000000:06d}"
    user = await user_store.create_user(email, pwd, "Admin User", "admin", phone)
    yield user, pwd
    await user_store.delete_user(user["id"])

async def get_token(ac, email, pwd):
    res = await ac.post("/api/auth/token", data={"username": email, "password": pwd})
    return res.json()["access_token"]

@pytest.mark.asyncio
async def test_create_course(ac, admin_user):
    user, pwd = admin_user
    token = await get_token(ac, user["email"], pwd)
    
    test_id = str(uuid.uuid4())[:8]
    code = f"T-{test_id}"
    res = await ac.post("/api/courses/", json={
        "name": "Integration Test Course",
        "code": code,
        "description": "Integration Test"
    }, headers={"Authorization": f"Bearer {token}"})
    
    assert res.status_code == 200 # endpoint returns 200
    course = res.json()
    assert course["code"] == code
    
    store = CourseStore()
    await store.delete_course(course["id"])

@pytest.mark.asyncio
async def test_teacher_cannot_create_course(ac, teacher_user):
    user, pwd = teacher_user
    token = await get_token(ac, user["email"], pwd)
    
    res = await ac.post("/api/courses/", json={
        "name": "Illegal Course",
        "code": "FAIL-101",
        "description": "Should fail"
    }, headers={"Authorization": f"Bearer {token}"})
    
    assert res.status_code == 403


@pytest.mark.asyncio
async def test_list_courses(ac):
    res = await ac.get("/api/courses/list")
    assert res.status_code == 200
    assert isinstance(res.json(), list)


@pytest.mark.asyncio
async def test_get_course(ac, teacher_user):
    user, _ = teacher_user
    store = CourseStore()
    test_id = str(uuid.uuid4())[:8]
    code = f"T-{test_id}"
    course = await store.create_course("Get Course Test", code, "Desc", user["id"])
    
    res = await ac.get(f"/api/courses/{course['id']}")
    assert res.status_code == 200
    assert res.json()["id"] == course["id"]
    
    await store.delete_course(course["id"])


@pytest.mark.asyncio
async def test_update_course(ac, teacher_user):
    user, pwd = teacher_user
    token = await get_token(ac, user["email"], pwd)
    store = CourseStore()
    test_id = str(uuid.uuid4())[:8]
    code = f"T-{test_id}"
    course = await store.create_course("Get Course Test", code, "Desc", user["id"])
    
    res = await ac.patch(f"/api/courses/{course['id']}", json={
        "description": "Updated Description"
    }, headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    
    fetched = await store.get_course_by_id(course["id"])
    assert fetched["description"] == "Updated Description"
    
    await store.delete_course(course["id"])


@pytest.mark.asyncio
async def test_delete_course(ac, admin_user):
    user, pwd = admin_user
    token = await get_token(ac, user["email"], pwd)
    store = CourseStore()
    test_id = str(uuid.uuid4())[:8]
    code = f"T-{test_id}"
    course = await store.create_course("Delete test", code, "Desc", user["id"])
    
    res = await ac.delete(f"/api/courses/{course['id']}", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 200
    
    res_get = await ac.get(f"/api/courses/{course['id']}")
    assert res_get.status_code == 404

@pytest.mark.asyncio
async def test_enroll_student(ac, student_user, teacher_user):
    # Setup course
    t_user, _ = teacher_user
    store = CourseStore()
    test_id = str(uuid.uuid4())[:8]
    code = f"T-{test_id}"
    course = await store.create_course("Enroll Test", code, "Desc", t_user["id"])
    
    # Enroll student
    s_user, s_pwd = student_user
    token = await get_token(ac, s_user["email"], s_pwd)
    
    res = await ac.post("/api/student/enroll", json={
        "course_id": course["id"]
    }, headers={"Authorization": f"Bearer {token}"})
    
    assert res.status_code == 200
    assert res.json()["status"] == "success"
    
    await store.delete_course(course["id"])
