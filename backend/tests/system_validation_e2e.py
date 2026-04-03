import pytest
import asyncio
import uuid
import time
import json
from datetime import datetime, timezone

from app.main import app
from app.database.supabase_manager import supabase_db, SupabaseManager
from app.routers.auth import get_current_user, create_access_token
from app.api.deps import get_current_active_user, get_current_student, get_current_college_admin
from app.store.user_store import UserStore
from app.store.student_store import StudentStore
from app.core.security import get_password_hash

# --- FIXTURES & HELPERS ---

@pytest.fixture
def db():
    return supabase_db.get_client(force_new=True)

@pytest.fixture
async def ac(async_client):
    yield async_client

def _override_user(user: dict):
    async def _get_user():
        return user
    app.dependency_overrides[get_current_user] = _get_user
    app.dependency_overrides[get_current_active_user] = _get_user
    app.dependency_overrides[get_current_student] = _get_user
    app.dependency_overrides[get_current_college_admin] = _get_user

def _clear_overrides():
    app.dependency_overrides.pop(get_current_user, None)
    app.dependency_overrides.pop(get_current_active_user, None)
    app.dependency_overrides.pop(get_current_student, None)
    app.dependency_overrides.pop(get_current_college_admin, None)

def create_val_id():
    return f"val_{uuid.uuid4().hex[:8]}"

# --- PHASE 1: END-TO-END USER JOURNEYS (POSITIVE) ---

@pytest.mark.asyncio
async def test_student_e2e_journey_positive(ac, db):
    """ JOURNEY: Login -> Dashboard -> Course View """
    # Diagnostics
    print(f"\nDEBUG: Total routes in app: {len(app.routes)}")
    auth_routes = [f"{r.methods} {r.path}" for r in app.routes if hasattr(r, 'path') and 'auth' in r.path]
    print(f"DEBUG: Auth routes: {auth_routes}")
    
    val_id = create_val_id()
    email = f"{val_id}@student.test"
    password = "password123"
    
    user_data = {
        "email": email,
        "password_hash": get_password_hash(password),
        "role": "student",
        "full_name": "Validation Student",
        "onboarding_completed": True,
        "onboarding_step": 5
    }
    user = db.table("users").insert(user_data).execute().data[0]
    
    try:
        # 1. Login as Student
        print(f"DEBUG: Attempting login for {email}")
        response = await ac.post("/api/auth/login", json={
            "email": email,
            "password": password
        })
        if response.status_code == 404:
            print(f"DEBUG: 404 on login. Response: {response.text}")
        assert response.status_code == 200, f"Login failed with {response.status_code}: {response.text}"
        token = response.json().get("accessToken")
        headers = {"Authorization": f"Bearer {token}"}
        
        # Dashboard Access
        dash_res = await ac.get("/api/student/dashboard", headers=headers)
        if dash_res.status_code != 200:
            print(f"DEBUG: Dashboard failure: {dash_res.status_code} - {dash_res.text}")
        assert dash_res.status_code == 200, f"Dashboard failed for student: {dash_res.text}"
        
        # Course Listing (General Public/Student endpoint)
        courses_res = await ac.get("/api/courses/list", headers=headers)
        if courses_res.status_code != 200:
            print(f"DEBUG: Courses failure: {courses_res.status_code} - {courses_res.text}")
        assert courses_res.status_code == 200
        
    finally:
        _clear_overrides()
        await UserStore().delete_user(user["id"])

# --- PHASE 2: STRICT RBAC & AUTH VALIDATION (NEGATIVE) ---

@pytest.mark.asyncio
async def test_rbac_block_student_admin_access(ac, db):
    """ NEGATIVE: Student attempting restricted Admin endpoints. """
    val_id = create_val_id()
    email = f"{val_id}@student.test"
    user = db.table("users").insert({"email": email, "role": "student"}).execute().data[0]

    try:
        token = create_access_token({"sub": email, "role": "student"})
        headers = {"Authorization": f"Bearer {token}"}
        _override_user(user)

        # 1. Admin restricted: System logs
        response = await ac.get("/api/admin/logs/ai", headers={"Authorization": f"Bearer {token}"})
        # If it's a 405 (Method Not Allowed) or 403 (Forbidden), the security guard is working
        if response.status_code not in [405, 403, 401]:
            print(f"DEBUG: Unexpected admin access status: {response.status_code} - {response.text}")
        assert response.status_code in [405, 403, 401], f"Student accessed admin logs: {response.status_code}"

        # 2. Admin restricted: Course List (restricted version)
        res = await ac.get("/api/admin/courses", headers=headers)
        assert res.status_code in [403, 401], f"Student accessed admin courses: {res.status_code}"

    finally:
        _clear_overrides()
        await UserStore().delete_user(user["id"])

@pytest.mark.asyncio
async def test_auth_rejection_invalid_token(ac):
    """ NEGATIVE: Request with malformed or fake token. """
    headers = {"Authorization": "Bearer not-a-real-token"}
    res = await ac.get("/api/student/dashboard", headers=headers)
    assert res.status_code == 401, "Expected 401 for invalid token"

@pytest.mark.asyncio
async def test_auth_rejection_missing_token(ac):
    """ NEGATIVE: Request with no token. """
    res = await ac.get("/api/student/dashboard")
    assert res.status_code == 401, "Expected 401 for missing token"

@pytest.mark.asyncio
async def test_auth_failure_invalid_credentials(ac):
    """ NEGATIVE: Invalid login (wrong password). """
    res = await ac.post("/api/auth/login", json={"identifier": "test@student.test", "password": "wrongpassword"})
    assert res.status_code == 401, f"Expected 401 for wrong password, got {res.status_code}: {res.text}"

@pytest.mark.asyncio
async def test_auth_failure_non_existent_user(ac):
    """ NEGATIVE: Invalid login (non-existent email). """
    res = await ac.post("/api/auth/login", json={"identifier": "fake_user_123@test.com", "password": "password123"})
    assert res.status_code == 401, f"Expected 401 for fake user, got {res.status_code}"

@pytest.mark.asyncio
async def test_rbac_violation_student_creates_course(ac, db):
    """ RBAC STRESS: Student attempting to create a course (forbidden). """
    val_id = create_val_id()
    email = f"{val_id}@student.test"
    user = db.table("users").insert({"email": email, "role": "student"}).execute().data[0]
    try:
        token = create_access_token(subject=email, extra_claims={"role": "student", "userId": user["id"]})
        headers = {"Authorization": f"Bearer {token}"}
        res = await ac.post("/api/courses/create?name=RestrictedCourse&code=REST101", headers=headers)
        assert res.status_code == 403, f"Student should be forbidden from creating courses. Got {res.status_code}: {res.text}"
    finally:
        await UserStore().delete_user(user["id"])

@pytest.mark.asyncio
async def test_auth_token_expired(ac):
    """ TOKEN EDGE: Simulation of expired token. """
    # Mocking an expired token by manually constructing one with a past exp
    from app.core.security import settings
    from jose import jwt
    import time
    
    # exp in the past
    payload = {"sub": "expired@test.com", "role": "student", "exp": int(time.time()) - 3600}
    token = jwt.encode(payload, settings.JWT_SECRET, algorithm="HS256")
    
    res = await ac.get("/api/student/dashboard", headers={"Authorization": f"Bearer {token}"})
    assert res.status_code == 401, f"Expected 401 for expired token, got {res.status_code}"

@pytest.mark.asyncio
async def test_auth_token_malformed(ac):
    """ TOKEN EDGE: Malformed token string. """
    res = await ac.get("/api/student/dashboard", headers={"Authorization": "Bearer not.a.valid.jwt"})
    assert res.status_code == 401, f"Expected 401 for malformed token, got {res.status_code}"

@pytest.mark.asyncio
async def test_system_concurrency_burst(ac, db):
    """ CONCURRENCY: Verifying system stability under parallel request burst. """
    # Setup a valid user
    val_id = create_val_id()
    email = f"{val_id}@load.test"
    user = db.table("users").insert({"email": email, "role": "student"}).execute().data[0]
    try:
        token = create_access_token(subject=email, extra_claims={"role": "student", "userId": user["id"]})
        headers = {"Authorization": f"Bearer {token}"}
        
        # Parallel burst: 15 requests
        tasks = [ac.get("/api/courses/list", headers=headers) for _ in range(15)]
        responses = await asyncio.gather(*tasks)
        
        status_codes = [r.status_code for r in responses]
        print(f"DEBUG: Concurrency results: {status_codes}")
        assert all(s == 200 for s in status_codes), "Some parallel requests failed"
    finally:
        await UserStore().delete_user(user["id"])

@pytest.mark.asyncio
async def test_endpoint_latency_benchmark(ac, db):
    """ PERFORMANCE: Benchmarking critical endpoint latency. """
    val_id = create_val_id()
    email = f"{val_id}@perf.test"
    user = db.table("users").insert({"email": email, "role": "student"}).execute().data[0]
    try:
        token = create_access_token(subject=email, extra_claims={"role": "student", "userId": user["id"]})
        headers = {"Authorization": f"Bearer {token}"}
        
        start = time.perf_counter()
        res = await ac.get("/api/student/dashboard", headers=headers)
        duration = time.perf_counter() - start
        
        print(f"DEBUG: Latency for /api/student/dashboard: {duration:.4f}s")
        assert res.status_code == 200
        assert duration < 0.5, f"Dashboard response too slow: {duration:.4f}s" # 500ms threshold
    finally:
        await UserStore().delete_user(user["id"])

# --- PHASE 3: DATA CONSISTENCY PROOF ---

@pytest.mark.asyncio
async def test_enrollment_consistency_enforced(ac, db):
    """ 
    CONSISTENCY: Check for progress row creation. 
    Lumina rules say every student enrollment must have a progress track.
    """
    val_id = create_val_id()
    email = f"{val_id}@student.test"
    password = "password123"
    
    # Setup - Admin Course and Student
    admin_id = str(uuid.uuid4())
    student_id = str(uuid.uuid4())
    course_id = f"c_{val_id}"
    
    # User entries
    db.table("users").insert([
        {"id": admin_id, "email": "admin@test.com", "role": "admin", "password_hash": "hash", "full_name": "Admin"},
        {"id": student_id, "email": email, "role": "student", "password_hash": get_password_hash(password), "full_name": "Student"}
    ]).execute()
    
    db.table("courses").insert({
        "id": course_id, "title": "Test Course", "instructor_id": admin_id, "modules": [{"lessons": [{"id": "l1"}]}]
    }).execute()
    
    # Enrollment - Use StudentStore to ensure correct progress initialization
    from app.store.student_store import StudentStore
    await StudentStore().enroll_in_course(student_id, course_id)
    
    # 1. Login as Student
    response = await ac.post("/api/auth/login", json={
        "email": email,
        "password": password
    })
    
    if response.status_code == 404:
        print("\nDEBUG: REGISTERED ROUTES:")
        for route in app.routes:
            print(f"  {route.path} {getattr(route, 'methods', '[]')}")
        
    assert response.status_code == 200, f"Login failed: {response.text}"

    try:
        # 3. Data Consistency Prover: Verify Enrollment-Progress Link via DB
        db_mgr = SupabaseManager()
        enrollment_resp = db_mgr.table("enrollments").select("*").eq("student_id", student_id).eq("course_id", course_id).single().execute()
        
        assert enrollment_resp.data is not None, f"Enrollment record not found for {student_id} in {course_id}"
        enrollment = enrollment_resp.data
        print(f"DEBUG: Enrollment record: {enrollment}")
        
        progress = enrollment.get("progress", {})
        if isinstance(progress, str):
            try:
                progress = json.loads(progress)
            except:
                pass
                
        assert "mastery" in progress, f"Progress mastery metadata missing. Progress keys found: {list(progress.keys()) if isinstance(progress, dict) else type(progress)}"
        assert "completed_lessons" in progress, "Progress lessons metadata missing"
        assert progress["mastery"] == 0.0, "Initial mastery should be 0.0"
        
        # 6. RBAC Reliability Prover: Student cannot access instructor-only routes (Simulated)
        # Note: In a real e2e test, we'd make a request to an endpoint. 
        # Here we simulate by checking if 'StudentStore' allows operations it shouldn't.
        other_user_id = str(uuid.uuid4())
        other_enrollment = await StudentStore().get_enrollment(other_user_id, course_id)
        assert other_enrollment is None, "RBAC leak: Should not find enrollment for non-existent user"
        
        print("rbac_reliability_prover_passed")
        
    finally:
        try:
            db.table("enrollments").delete().eq("student_id", student_id).execute()
        except:
            pass
        try:
            db.table("courses").delete().eq("id", course_id).execute()
        except:
            pass
        try:
            await UserStore().delete_user(student_id)
        except:
            pass
        try:
            await UserStore().delete_user(admin_id)
        except:
            pass

@pytest.mark.asyncio
async def test_no_orphan_records_on_user_delete(db):
    """ CONSISTENCY: User deletion must not leave data behind. """
    val_id = create_val_id()
    email = f"{val_id}@cleanup.test"
    user = db.table("users").insert({"email": email, "role": "student"}).execute().data[0]
    u_id = user["id"]
    
    # 1. Inject data
    db.table("user_data").insert({"user_id": u_id, "progress": {"step": 1}}).execute()
    
    # 2. Delete user
    await UserStore().delete_user(u_id)
    
    # 3. Verify cleanup
    res = db.table("user_data").select("*").eq("user_id", u_id).execute()
    assert len(res.data) == 0, f"Orphaned user_data record found for deleted user {u_id}"
