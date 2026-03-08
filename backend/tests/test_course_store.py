import pytest
import uuid
import sys
import os

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
from app.store.course_store import CourseStore

@pytest.fixture
def store():
    return CourseStore()

@pytest.mark.asyncio
async def test_create_course(store):
    test_id = str(uuid.uuid4())[:8]
    code = f"TEST-{test_id}"
    
    # Supabase needs a real teacher_id or we use a dummy one if it doesn't foreign key strictly, OR
    # wait, the course_store doesn't natively crash if teacher_id is fake, unless RLS/FK mandates it.
    # We will use a random UUID for teacher
    teacher_id = str(uuid.uuid4())
    
    course = await store.create_course(f"Course {test_id}", code, "Desc", teacher_id)
    assert course["course_code"] == code
    
    # Verify retrievable
    fetched = await store.get_course_by_code(code)
    assert fetched["id"] == course["id"]
    
    # Cleanup
    await store.delete_course(course["id"])


@pytest.mark.asyncio
async def test_update_course(store):
    test_id = str(uuid.uuid4())[:8]
    code = f"TEST-{test_id}"
    teacher_id = str(uuid.uuid4())
    
    course = await store.create_course(f"Course {test_id}", code, "Desc", teacher_id)
    
    success = await store.update_course(course["id"], {"description": "New Desc"})
    assert success
    
    fetched = await store.get_course_by_code(code)
    assert fetched["description"] == "New Desc"
    
    await store.delete_course(course["id"])


@pytest.mark.asyncio
async def test_add_module(store):
    test_id = str(uuid.uuid4())[:8]
    code = f"TEST-{test_id}"
    teacher_id = str(uuid.uuid4())
    course = await store.create_course(f"Course {test_id}", code, "Desc", teacher_id)
    
    success = await store.add_module(course["id"], {"id": "mod1", "title": "Module 1"})
    assert success
    
    fetched = await store.get_course_by_code(code)
    modules = fetched.get("modules") or []
    assert len(modules) == 1
    assert modules[0]["title"] == "Module 1"
    
    await store.delete_course(course["id"])


@pytest.mark.asyncio
async def test_update_modules(store):
    test_id = str(uuid.uuid4())[:8]
    code = f"TEST-{test_id}"
    teacher_id = str(uuid.uuid4())
    course = await store.create_course(f"Course {test_id}", code, "Desc", teacher_id)
    
    success = await store.update_modules(course["id"], [{"id": "mod2", "title": "Replaced Module"}])
    assert success
    
    fetched = await store.get_course_by_code(code)
    modules = fetched.get("modules") or []
    assert len(modules) == 1
    assert modules[0]["title"] == "Replaced Module"
    
    await store.delete_course(course["id"])


@pytest.mark.asyncio
async def test_delete_course(store):
    test_id = str(uuid.uuid4())[:8]
    code = f"TEST-{test_id}"
    teacher_id = str(uuid.uuid4())
    course = await store.create_course(f"Course {test_id}", code, "Desc", teacher_id)
    
    success = await store.delete_course(course["id"])
    assert success
    
    fetched = await store.get_course_by_code(code)
    assert fetched is None
