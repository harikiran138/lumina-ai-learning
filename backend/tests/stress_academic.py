import pytest
import asyncio
from datetime import datetime, timezone
from httpx import AsyncClient, ASGITransport
from app.store.user_store import UserStore
from app.store.course_store import CourseStore
from app.core.config import settings

@pytest.fixture
async def ac(async_client):
    yield async_client

@pytest.mark.asyncio
async def test_academic_stress_concurrency(ac):
    """
    Phase 2: Core API Stress Test - Academic Concurrency
    Tests concurrent enrollment and dashboard data fetching for 10 users simultaneously.
    """
    
    # 1. Setup Test Data (Teacher & Course)
    user_store = UserStore()
    course_store = CourseStore()
    
    teacher_email = f"teacher_{datetime.now(timezone.utc).timestamp()}@test.com"
    teacher = await user_store.create_user(
        email=teacher_email, 
        password="StressPassword123!", 
        full_name="Stress Prof", 
        role="teacher"
    )
    
    course_code = f"STRESS_{int(datetime.now(timezone.utc).timestamp())}"
    course = await course_store.create_course(
        name="Stress Engineering",
        code=course_code,
        description="Concurrency testing course",
        teacher_id=teacher["id"]
    )
    course_id = course["id"]
    
    # 2. Create 10 Students
    student_details = []
    for i in range(10):
        email = f"student_{i}_{datetime.now(timezone.utc).timestamp()}@test.com"
        pwd = "StudentPassword123!"
        student = await user_store.create_user(
            email=email, 
            password=pwd, 
            full_name=f"Student {i}", 
            role="student"
        )
        student_details.append({"email": email, "password": pwd, "id": student["id"]})
        
    # 3. Simulate Concurrent Login & Enrollment
    async def student_workflow(s_data):
        # Create a private client for each student to maintain session (cookies)
        from app.main import app
        async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", timeout=10.0) as sac:
            # Login
            login_res = await sac.post("/api/auth/login", json={
                "identifier": s_data["email"],
                "password": s_data["password"]
            })
            if login_res.status_code != 200:
                return False
                
            # Enroll in Course
            enroll_res = await sac.post("/api/student/enroll", json={"course_id": course_id})
            if enroll_res.status_code != 200:
                return False
                
            # Fetch Dashboard
            dash_res = await sac.get("/api/student/dashboard")
            if dash_res.status_code != 200:
                return False
                
            return True

    # Run 10 workflows in parallel
    results = await asyncio.gather(*[student_workflow(s) for s in student_details])
    
    # Assertions
    assert all(results), "Not all concurrent enrollments succeeded"
    
    # 4. Teacher Verification (Performance check for large student lists)
    from app.main import app
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test", timeout=10.0) as tac:
        await tac.post("/api/auth/login", json={"identifier": teacher_email, "password": "StressPassword123!"})
        
        start_time = datetime.now(timezone.utc)
        students_res = await tac.get("/api/courses/teacher/students")
        end_time = datetime.now(timezone.utc)
        
        assert students_res.status_code == 200
        students_list = students_res.json()
        assert len(students_list) >= 10
        
        latency_ms = (end_time - start_time).total_seconds() * 1000
        # Senior QA benchmark: Dashboard fetching for 10 students should be < 500ms
        assert latency_ms < 500, f"Dashboard performance too slow: {latency_ms}ms"

@pytest.mark.asyncio
async def test_academic_root_list_performance(ac):
    """Verify that root course listing handles pagination/seeding efficiently."""
    start_time = datetime.now(timezone.utc)
    res = await ac.get("/api/courses/")
    end_time = datetime.now(timezone.utc)
    
    assert res.status_code == 200
    latency_ms = (end_time - start_time).total_seconds() * 1000
    assert latency_ms < 200, f"Course listing too slow: {latency_ms}ms"
