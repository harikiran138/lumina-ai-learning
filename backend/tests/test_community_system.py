import pytest
import uuid
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.store.user_store import UserStore
from app.store.community_store import CommunityStore

@pytest.fixture
async def ac(async_client):
    yield async_client

async def create_test_user(role="student"):
    uid = str(uuid.uuid4())[:8]
    email = f"community_test_{uid}@example.com"
    pwd = "Password123A1" # Meets complexity
    name = f"Community {role.capitalize()}"
    phone = f"+1555{uuid.uuid4().int % 1000000:06d}"
    user_store = UserStore()
    user = await user_store.create_user(email, pwd, name, role, phone)
    return user, pwd

async def get_token(ac, email, password):
    res = await ac.post("/api/auth/token", data={"username": email, "password": password})
    if res.status_code != 200:
        raise Exception(f"Auth failed: {res.text}")
    return res.json()["access_token"]

@pytest.mark.asyncio
async def test_student_community_flow_tc_comm_001(ac):
    """TC-COMM-001: Student community integration flow (Join, Post, Like)."""
    # 1. Create student
    student, pwd = await create_test_user("student")
    token = await get_token(ac, student["email"], pwd)
    headers = {"Authorization": f"Bearer {token}"}

    # 2. List communities
    # Seed a community first since Mock store is empty
    client = UserStore().db.get_client()
    await client.table("communities").insert({
        "id": "phys-101",
        "name": "Physics",
        "subject_tag": "physics",
        "description": "Physics Discussion"
    }).execute()

    res = await ac.get("/api/community/communities", headers=headers)
    assert res.status_code == 200
    communities = res.json()["data"]
    assert len(communities) > 0
    community_id = communities[0]["id"]

    # 3. Join community
    res = await ac.post(f"/api/community/join/{community_id}", headers=headers)
    assert res.status_code == 200

    # 4. Create post
    post_data = {
        "title": "Integration Test Post",
        "content": "This is a test post for the Student Community System.",
        "subject_tag": "general"
    }
    res = await ac.post(f"/api/community/posts?community_id={community_id}", json=post_data, headers=headers)
    assert res.status_code == 200
    post = res.json()["data"]
    post_id = post["id"]

    # 5. Like post
    res = await ac.post(f"/api/community/posts/{post_id}/like", headers=headers)
    assert res.status_code == 200
    assert res.json()["liked"] is True

    # 6. Cleanup
    user_store = UserStore()
    await user_store.delete_user(student["id"])

@pytest.mark.asyncio
async def test_rbac_block_teacher_create_post_tc_comm_002(ac):
    """TC-COMM-002: Ensure teachers cannot create community posts."""
    teacher, pwd = await create_test_user("teacher")
    token = await get_token(ac, teacher["email"], pwd)
    headers = {"Authorization": f"Bearer {token}"}

    # 1. Get a community (Teachers can view)
    # Seed a community first
    client = UserStore().db.get_client()
    await client.table("communities").insert({
        "id": "chem-101",
        "name": "Chemistry",
        "subject_tag": "chemistry",
        "description": "Chemistry Discussion"
    }).execute()

    comm_res = await ac.get("/api/community/communities", headers=headers)
    community_id = comm_res.json()["data"][0]["id"]

    # 2. Attempt post creation (Should fail - restricted to get_current_student)
    post_data = {
        "title": "Teacher Post (Unauthorized)",
        "content": "Teachers should not be able to post in student communities."
    }
    res = await ac.post(f"/api/community/posts?community_id={community_id}", json=post_data, headers=headers)
    # Since teachers fail get_current_student, it should be 403 or 401 depending on the dependency behavior
    assert res.status_code in [403, 401]

    # 3. Cleanup
    user_store = UserStore()
    await user_store.delete_user(teacher["id"])

@pytest.mark.asyncio
async def test_anonymous_access_block_tc_comm_003(ac):
    """TC-COMM-003: Ensure anonymous users cannot access community endpoints."""
    # Attempt list (Should fail)
    res = await ac.get("/api/community/communities")
    assert res.status_code == 401
