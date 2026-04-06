import pytest
import uuid
import logging
from app.database.supabase_manager import supabase_db
from app.services.onboarding_service import OnboardingService
from app.routers.auth import get_current_user
from app.api.deps import get_current_faculty
from app.main import app

# Disable uvicorn logging during tests if it's too noisy
logging.getLogger("uvicorn.error").setLevel(logging.ERROR)

# --- Mocks and Helpers ---

def get_mock_user_base(role="student"):
    uid = str(uuid.uuid4())
    return {
        "id": uid,
        "email": f"test_{role}_{uid[:8]}@example.com",
        "role": role,
        "onboarding_step": 1,
        "onboarding_status": "in_progress",
        "full_name": "Test User",
        "name": "Test User",
        "employee_id": "EMP_001" if role == "teacher" else None
    }

@pytest.fixture
def db_manager():
    # Force a new local mock client to ensure a clean in-memory db
    supabase_db.get_client(force_new=True)
    return supabase_db

@pytest.fixture
async def ac(async_client):
    yield async_client

# --- Layer 1: Service (Unit) Tests ---

@pytest.mark.asyncio
async def test_service_student_migration(db_manager):
    user = get_mock_user_base("student")
    user_id = user["id"]
    db_manager.client.table("users").insert(user).execute()
    
    onboarding_data = {
        "user_id": user_id,
        "progress": {
            "step_1": {"first_name": "Student", "last_name": "Name", "phone": "123456789"},
            "step_2": {"batch_id": "batch_001", "dept_id": "dept_001"},
            "step_5": {"learning_styles": ["visual"]}
        }
    }
    db_manager.client.table("user_data").insert(onboarding_data).execute()
    
    service = OnboardingService(db_manager)
    result = await service.complete_onboarding(user_id, "student", user, {})
    
    assert result["success"] is True
    # Verify user record updated
    updated_user = await db_manager.fetch_one("users", {"id": user_id})
    assert updated_user["onboarding_step"] == 5
    assert updated_user["full_name"] == "Student Name"

@pytest.mark.asyncio
async def test_service_faculty_migration(db_manager):
    user = get_mock_user_base("teacher")
    user_id = user["id"]
    db_manager.client.table("users").insert(user).execute()
    
    onboarding_data = {
        "user_id": user_id,
        "progress": {
            "step_1": {"full_name": "Dr. Teacher", "designation": "Professor"},
            "step_2": {"subjects": ["Advanced Math"]}
        }
    }
    db_manager.client.table("user_data").insert(onboarding_data).execute()
    
    service = OnboardingService(db_manager)
    result = await service.complete_onboarding(user_id, "teacher", user, {"teaching_goal": "Innovation"})
    
    assert result["success"] is True
    profile = await db_manager.fetch_one("teacher_profiles", {"user_id": user_id})
    assert profile is not None
    assert "Advanced Math" in profile["subjects"]

@pytest.mark.asyncio
async def test_service_institution_faculty_migration(db_manager):
    user = get_mock_user_base("faculty")
    user["college_id"] = "college_001"
    user_id = user["id"]
    db_manager.client.table("users").insert(user).execute()

    onboarding_data = {
        "user_id": user_id,
        "progress": {
            "step_1": {
                "fullName": "Dr. Faculty",
                "employeeId": "FAC-101",
                "collegeId": "college_001",
                "department": "Computer Science",
                "designation": "Associate Professor",
            },
            "step_2": {
                "subjects": ["Operating Systems"],
                "experienceYears": 9,
                "verificationDocs": ["https://example.com/faculty-proof"],
                "confirmedAssignments": True,
            },
            "step_3": {
                "officeHours": "Mon 2 PM - 4 PM",
                "teachingModes": ["lecture", "lab"],
                "facultyNotes": "Teacher verification should stay enabled.",
            },
            "step_4": {
                "gradingScale": "A-F",
                "analyticsFocus": ["concept_mastery", "risk_alerts"],
            },
        },
    }
    db_manager.client.table("user_data").insert(onboarding_data).execute()

    service = OnboardingService(db_manager)
    result = await service.complete_onboarding(user_id, "faculty", user, {})

    assert result["success"] is True
    profile = await db_manager.fetch_one("teacher_profiles", {"user_id": user_id})
    assert profile is not None
    assert profile["institution_id"] == "college_001"
    assert "Operating Systems" in profile["subjects"]

@pytest.mark.asyncio
async def test_service_parent_migration_creates_relationships(db_manager):
    user = get_mock_user_base("parent")
    user_id = user["id"]
    db_manager.client.table("users").insert(user).execute()

    onboarding_data = {
        "user_id": user_id,
        "progress": {
            "step_1": {
                "fullName": "Parent User",
                "relation": "guardian",
                "contactPhone": "9876543210",
                "parentEmail": "parent@example.com",
            },
            "step_2": {
                "studentIds": ["student_1", "student_2"],
                "monitoringGoals": ["attendance", "assignments"],
                "checkInFrequency": "Weekly",
            },
            "step_3": {
                "alertPreferences": ["low_attendance"],
                "supportNotes": "Call if attendance dips below threshold.",
                "preferredLanguage": "English",
            },
            "step_4": {
                "communicationMode": "both",
                "dashboardIntent": "Surface progress trends and alerts.",
                "relationshipConfirmation": True,
            },
        },
    }
    db_manager.client.table("user_data").insert(onboarding_data).execute()

    service = OnboardingService(db_manager)
    result = await service.complete_onboarding(user_id, "parent", user, {})

    assert result["success"] is True
    # In some versions, parent metadata also goes to learner_profiles
    profile = await db_manager.fetch_one("learner_profiles", {"user_id": user_id})
    assert profile is not None
    
    relationship = await db_manager.fetch_one("parent_guardian", {"parent_user_id": user_id, "student_user_id": "student_1"})
    assert relationship is not None
    assert relationship["relationship"] == "guardian"

# --- Layer 2: API (Integration) Tests ---

@pytest.mark.asyncio
async def test_api_onboarding_status(ac, db_manager):
    user = get_mock_user_base("student")
    db_manager.client.table("users").insert(user).execute()
    
    app.dependency_overrides[get_current_user] = lambda: user
    
    response = await ac.get("/api/onboarding/status")
    app.dependency_overrides.clear()
    
    assert response.status_code == 200
    assert "step" in response.json()

@pytest.mark.asyncio
async def test_api_complete_success(ac, db_manager):
    user = get_mock_user_base("student")
    user_id = user["id"]
    db_manager.client.table("users").insert(user).execute()
    db_manager.client.table("user_data").insert({
        "user_id": user_id,
        "progress": {"step_1": {"full_name": "API User"}, "onboarding_step": 4}
    }).execute()
    
    app.dependency_overrides[get_current_user] = lambda: user
    
    response = await ac.post("/api/onboarding/complete")
    app.dependency_overrides.clear()
    
    assert response.status_code == 200
    assert response.json()["success"] is True

# --- Layer 3: Database (Persistence) Tests ---

@pytest.mark.asyncio
async def test_db_persistence_across_steps(ac, db_manager):
    user = get_mock_user_base("student")
    user_id = user["id"]
    db_manager.client.table("users").insert(user).execute()
    
    app.dependency_overrides[get_current_user] = lambda: user
    
    await ac.post("/api/onboarding/start", json={"role": "student"})
    
    session = await db_manager.fetch_one("onboarding_sessions", {"user_id": user_id})
    assert session is not None
    assert session["status"] == "in_progress"
    
    app.dependency_overrides.clear()

# --- Layer 4: E2E Lifecycle Simulation ---

@pytest.mark.asyncio
async def test_e2e_student_lifecycle(ac, db_manager):
    user = get_mock_user_base("student")
    user_id = user["id"]
    db_manager.client.table("users").insert(user).execute()
    
    # We use a dynamic lookup in the dependency override to reflect DB changes
    def get_latest_user():
        # db_manager.client.table(...).execute() is synchronous in migrations/mock
        res = db_manager.client.table("users").select("*").eq("id", user_id).execute()
        return res.data[0] if (res and res.data) else None
        
    app.dependency_overrides[get_current_user] = get_latest_user
    
    # 1. Start session
    await ac.post("/api/onboarding/start", json={"role": "student"})
    
    # 2. Update to step 4 logically
    await db_manager.client.table("users").update({"onboarding_step": 4}).eq("id", user_id).execute()
    db_manager.client.table("user_data").upsert({
        "user_id": user_id, 
        "progress": {"onboarding_step": 4}
    }, on_conflict="user_id").execute()
    
    # 3. Check status
    status_resp = await ac.get("/api/onboarding/status")
    assert status_resp.json()["step"] == 4
    
    # 4. Complete
    await ac.post("/api/onboarding/complete")
    
    # 5. Final State Verification
    final_status = await ac.get("/api/onboarding/status")
    assert final_status.json()["step"] == 5
    
    app.dependency_overrides.clear()

# --- Security and Error Case Tests ---

@pytest.mark.asyncio
async def test_unauthorized_access(ac, db_manager):
    app.dependency_overrides.clear()
    response = await ac.get("/api/onboarding/status")
    # This app usually returns 401 for unauthorized API access or redirects to login
    assert response.status_code in [401, 307, 403, 500] 

@pytest.mark.asyncio
async def test_role_violation(ac, db_manager):
    user = get_mock_user_base("student")
    db_manager.client.table("users").insert(user).execute()
    
    # Override both to be sure
    app.dependency_overrides[get_current_user] = lambda: user
    app.dependency_overrides[get_current_faculty] = lambda: user
    
    # URL structure: /api/teacher prefix + /onboarding/... route
    response = await ac.post("/api/teacher/onboarding/complete", json={
        "teaching_goal": "test",
        "consents": {"teacherVerifiedAi": True, "academicIntegrity": True, "dataPolicy": True},
        "teaching_styles": ["visual"],
        "internet_type": "wifi",
        "primary_device": "laptop"
    })
    
    # Should be 403 as the user is a student trying to complete teacher onboarding
    assert response.status_code == 403
    
    app.dependency_overrides.clear()
