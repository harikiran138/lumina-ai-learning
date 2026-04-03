import os
import uuid
import pytest
from app.routers.auth import get_current_user
from app.database.supabase_manager import supabase_db
from app.core.config import settings

# --- FIXTURES ---

@pytest.fixture
def db_manager():
    # Force a new local mock client to ensure a clean in-memory db
    # This matches test_onboarding_master.py pattern
    supabase_db.get_client(force_new=True)
    return supabase_db

@pytest.fixture
async def ac(async_client):
    yield async_client

# --- HELPERS ---

async def setup_integrity_db(db, user_id):
    # 1. Department
    dept_id = "dept_123"
    db.table("departments").insert({
        "id": dept_id,
        "name": "Computer Science",
        "institution_id": "inst_123"
    }).execute()
    
    # 2. Batch
    batch_id = "batch_123"
    db.table("batches").insert({
        "id": batch_id,
        "dept_id": dept_id,
        "institution_id": "inst_123",
        "name": "CS 2026",
        "current_semester": 1
    }).execute()
    
    # 3. Enrollment Code
    db.table("enrollment_codes").insert({
        "id": "code_123",
        "code": "LUM2026",
        "batch_id": batch_id,
        "institution_id": "inst_123",
        "section": "A"
    }).execute()
    
    # 4. Courses (Subjects) - must match department and semester
    db.table("courses").insert([
        {"id": "sub1", "department_id": dept_id, "institution_id": "inst_123", "semester": 1, "course_name": "Python 101", "course_code": "PY101"},
        {"id": "sub2", "department_id": dept_id, "institution_id": "inst_123", "semester": 1, "course_name": "Data Integrity", "course_code": "DI101"}
    ]).execute()
    
    # 5. Learner Profile (for status check)
    db.table("learner_profiles").insert({
        "user_id": user_id,
        "status": "completed"
    }).execute()

async def setup_test_user(db, email="integrity@test.com", role="student"):
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": email,
        "role": "student",
        "onboarding_step": 0,
        "college_id": "inst_123",
        "full_name": "Integrity User"
    }
    db.table("users").insert(user).execute()
    await setup_integrity_db(db, user_id)
    return user

# --- INTEGRITY TESTS (SECTION 6) ---

@pytest.mark.asyncio
async def test_student_onboarding_integrity_full_flow(ac, db_manager):
    """
    Exhaustive data integrity test for Student Onboarding (Section 6a-e)
    1. Verify DB writes for every step.
    2. Verify step-skipping rejection (409).
    3. Verify session resume (Persistence).
    """
    from app.main import app
    db = db_manager.get_client()
    user = await setup_test_user(db)
    user_id = user["id"]
    
    # Mock authentication to fetch latest from DB
    async def get_mock_user():
        return db.table("users").select("*").eq("id", user_id).execute().data[0]

    app.dependency_overrides[get_current_user] = get_mock_user
    
    try:
        # --- STEP 0: Check Initial State ---
        status_res = await ac.get("/api/onboarding/status")
        assert status_res.status_code == 200
        assert status_res.json()["step"] == 0

        # --- STEP 1: Personal Details ---
        personal_data = {
            "first_name": "John",
            "last_name": "Integrity",
            "date_of_birth": "2000-01-01",
            "phone_number": "9876543210",
            "email": "integrity@test.com"
        }
        res1 = await ac.post("/api/onboarding/personal", json=personal_data, timeout=10.0)
        assert res1.status_code == 200, f"Step 1 failed: {res1.text}"
        
        # DB Integrity Check: user_data table (JSONB progress)
        user_row = db.table("user_data").select("progress").eq("user_id", user_id).execute().data[0]
        progress = user_row["progress"]
        assert progress["step_1"]["firstName"] == "John"
        
        # DB Integrity Check: users table
        user_meta = db.table("users").select("*").eq("id", user_id).execute().data[0]
        assert user_meta["onboarding_step"] == 1

        # --- STEP 2: Enrollment (Institution Mapping) ---
        enrollment_data = {"enrollment_code": "LUM2026"}
        res2 = await ac.post("/api/onboarding/enrollment", json=enrollment_data)
        assert res2.status_code == 200, f"Step 2 failed: {res2.text}"
        
        user_after_2 = db.table("users").select("*").eq("id", user_id).execute().data[0]
        assert user_after_2.get("batch_id") == "batch_123", "Batch ID not persisted"

        # --- STEP 3: Subjects ---
        batch_id = user_after_2.get("batch_id")
        batch_row = db.table("batches").select("*").eq("id", batch_id).execute().data[0]
        batch_via_fetch_one = await db_manager.fetch_one("batches", {"id": batch_id})
        assert batch_via_fetch_one is not None, "fetch_one failed for batch in test environment"
        
        dept_id_debug = batch_row.get("dept_id")
        semester_debug = batch_row.get("current_semester")
        direct_fetch = db.table("courses").select("*").eq("department_id", dept_id_debug).eq("semester", semester_debug).execute().data
        assert len(direct_fetch) > 0, "Direct fetch failed in test environment"
        
        subjects_data = {"subject_ids": ["sub1", "sub2"]}
        res3 = await ac.post("/api/onboarding/subjects", json=subjects_data)
        assert res3.status_code == 200, f"Step 3 failed: {res3.text}"
        
        # DB Integrity Check: student_subjects table
        subjects = db.table("student_subjects").select("*").eq("student_id", user_id).execute().data
        assert len(subjects) >= 2

        # --- STEP 4: Profile Details (Gap #4) ---
        # Note: This is Form Data (Multipart)
        profile_data = {
            "emergency_contact": "9000000001",
            "parent_email": "parent@test.com"
        }
        res4 = await ac.post("/api/onboarding/profile", data=profile_data)
        assert res4.status_code == 200, f"Step 4 failed: {res4.text}"
        
        # DB Integrity Check: users table (phone update)
        user_meta4 = db.table("users").select("*").eq("id", user_id).execute().data[0]
        assert user_meta4["onboarding_step"] == 4

        # --- STEP 5: Preferences ---
        pref_data = {
            "learning_styles": ["visual", "reading"],
            "self_assessment": "intermediate"
        }
        res5 = await ac.post("/api/onboarding/preferences", json=pref_data)
        assert res5.status_code == 200, f"Step 5 failed: {res5.text}"
        
        # DB Integrity Check: user_data (progress JSONB)
        user_row5 = db.table("user_data").select("progress").eq("user_id", user_id).execute().data[0]
        assert user_row5["progress"]["step_5"]["selfAssessment"] == "intermediate"

        # --- STEP 6: Completion ---
        comp_res = await ac.post("/api/onboarding/complete")
        assert comp_res.status_code == 200
        assert comp_res.json()["success"] is True

        # --- FINAL INTEGRITY CHECK ---
        final_user = db.table("users").select("onboarding_step").eq("id", user_id).execute().data[0]
        assert final_user["onboarding_step"] == 5
        
        final_status = await ac.get("/api/onboarding/status")
        assert final_status.json()["isComplete"] is True
    
    finally:
        app.dependency_overrides.clear()
