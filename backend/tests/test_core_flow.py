import pytest

def test_register_login_create_course(client):
    # 1. Register a Teacher
    teacher_email = "test_teacher@example.com"
    response = client.post("/api/auth/register", json={
        "email": teacher_email,
        "password": "password123",
        "full_name": "Test Teacher",
        "role": "teacher"
    })
    # If user exists from previous run, that's fine, we proceed to login
    assert response.status_code in [200, 400] 

    # 2. Login
    login_response = client.post("/api/auth/token", data={
        "username": teacher_email,
        "password": "password123"
    })
    assert login_response.status_code == 200
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Verify Me
    me_response = client.get("/api/auth/me", headers=headers)
    assert me_response.status_code == 200
    assert me_response.json()["email"] == teacher_email

    # 4. Create a Course
    course_response = client.post("/api/courses/create", 
        data={"name": "Test Course 101", "code": "TEST101", "description": "Unit Test Course"},
        headers=headers
    )
    # 200 or 400 (if exists) is acceptable for this basic verifying test
    assert course_response.status_code in [200, 400]
    
    if course_response.status_code == 200:
        assert course_response.json()["status"] == "success"

    # 5. List Courses
    list_response = client.get("/api/courses/list")
    assert list_response.status_code == 200
    courses = list_response.json()
    assert len(courses) > 0
    # verify our course is there
    found = any(c["code"] == "TEST101" for c in courses)
    assert found
