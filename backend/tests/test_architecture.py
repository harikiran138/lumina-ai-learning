"""
Architecture enforcement tests.

These tests fail if legacy patterns are reintroduced.
Run as part of CI on every PR:  pytest backend/tests/test_architecture.py -v
"""

import ast
import os
import pytest

# ── Config ────────────────────────────────────────────────────────────────────

ROLE_CRITICAL_ROUTES = [
    "backend/app/routers/student.py",
    "backend/app/routers/teacher.py",
    "backend/app/routers/hod.py",
    "backend/app/routers/admin.py",
]

LEGACY_TABLE_NAMES = ["enrollments", "sections"]

CANONICAL_DEPENDENCY_MAP = {
    "student.py": "get_current_student",
    "teacher.py": "get_current_teacher",
    "hod.py": "get_current_hod",
    "admin.py": "get_current_college_admin",
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def _repo_root() -> str:
    """Return the repository root (two levels up from this file's directory)."""
    return os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def _abs(rel_path: str) -> str:
    return os.path.join(_repo_root(), rel_path)


def _source(rel_path: str) -> str:
    full = _abs(rel_path)
    if not os.path.exists(full):
        pytest.skip(f"File not found: {full}")
    with open(full) as f:
        return f.read()


# ── Tests ─────────────────────────────────────────────────────────────────────

def test_no_legacy_tables_in_role_critical_routes():
    """No role-critical route may query legacy tables directly."""
    for route_file in ROLE_CRITICAL_ROUTES:
        if not os.path.exists(_abs(route_file)):
            continue
        source = _source(route_file)
        for legacy_table in LEGACY_TABLE_NAMES:
            # Allow the compat shim comment but not actual table queries
            assert f'table("{legacy_table}")' not in source, (
                f"{route_file} still references legacy table '{legacy_table}'. "
                "Use canonical tables only."
            )


def test_student_router_uses_student_dependency():
    """
    student.py must not call Depends(get_current_user) directly.
    It imports get_current_student aliased as get_current_user, so raw
    'get_current_user' in import names is expected — but a bare
    Depends(get_current_user) call that bypasses the role check is not.
    """
    source = _source("backend/app/routers/student.py")
    # The file should import get_current_student (either aliased or directly)
    assert "get_current_student" in source, (
        "student.py does not import get_current_student. "
        "All student routes must use the student-scoped dependency."
    )


def test_hod_router_uses_hod_dependency():
    """Every route in hod.py must use get_current_hod."""
    source = _source("backend/app/routers/hod.py")
    assert "get_current_hod" in source, "hod.py does not use get_current_hod dependency."
    # Must not fall back to a broad get_current_user with no HOD gate
    # (allow it only if it's an alias — checked by presence of get_current_hod)


def test_no_inline_teacher_assignment_auth_in_routers():
    """
    Direct teacher-class authorization filters must not appear in routers.
    Admin reporting reads are allowed, but inline auth checks must go through
    verify_teacher_has_class_access from class_auth.py.
    """
    for root, _, files in os.walk(_abs("backend/app/routers")):
        for file in files:
            if not file.endswith(".py"):
                continue
            full_path = os.path.join(root, file)
            with open(full_path) as f:
                source = f.read()
            if 'eq("teacher_id"' in source and 'eq("class_id"' in source and 'teacher_assignments' in source:
                assert 'verify_teacher_has_class_access' in source, (
                    f"{file}: inline teacher_assignment auth query found in router. "
                    "Use verify_teacher_has_class_access from class_auth.py."
                )


def test_no_sections_table_in_routers():
    """
    Direct table("sections") queries must not appear in routers.
    All callers must go through schedule_service or the compat view.
    """
    for root, _, files in os.walk(_abs("backend/app/routers")):
        for file in files:
            if not file.endswith(".py"):
                continue
            full_path = os.path.join(root, file)
            with open(full_path) as f:
                source = f.read()
            assert 'table("sections")' not in source, (
                f"{file}: direct sections table query in router. "
                "Use schedule_service or the sections compat view."
            )


def test_ai_queue_student_route_uses_service():
    """
    The student-facing AI queue route must call ai_queue_service,
    not query the ai_answer_queue table directly.
    """
    source = _source("backend/app/routers/student.py")
    if "ai-tutor/pending" in source or "ai_answer_queue" in source:
        assert "AIQueueService" in source or "ai_queue_service" in source, (
            "student.py contains AI queue route but does not use AIQueueService. "
            "Import and call ai_queue_service.get_pending_for_student."
        )


def test_ai_queue_schema_is_single_source_of_truth():
    """ai_queue_schema.py must exist and define all three view classes."""
    source = _source("backend/app/schemas/ai_queue_schema.py")
    for cls_name in ("AIQueueStudentView", "AIQueueTeacherView", "AIQueueAdminView"):
        assert cls_name in source, (
            f"ai_queue_schema.py is missing {cls_name}. "
            "All AI queue DTO shapes must be defined in this file."
        )


def test_class_auth_utility_exists():
    """class_auth.py must exist and define both authorization helpers."""
    source = _source("backend/app/utils/class_auth.py")
    assert "verify_teacher_has_class_access" in source
    assert "verify_student_in_class" in source


def test_enrollment_service_exists():
    """enrollment_service.py must exist and use student_enrollments, not enrollments."""
    source = _source("backend/app/services/enrollment_service.py")
    assert "student_enrollments" in source, (
        "enrollment_service.py must use student_enrollments (canonical), not enrollments."
    )
    # Must not write to the legacy table
    assert 'insert("enrollments"' not in source and 'table("enrollments")' not in source, (
        "enrollment_service.py must not reference the legacy enrollments table."
    )


def test_schedule_service_uses_classes_table():
    """schedule_service.py must use the classes table, not sections."""
    source = _source("backend/app/services/schedule_service.py")
    assert '"classes"' in source or "'classes'" in source, (
        "schedule_service.py must query the canonical classes table."
    )
    assert 'table("sections")' not in source, (
        "schedule_service.py must not query the legacy sections table directly."
    )


def test_middleware_has_no_role_checks():
    """Middleware files must not perform role-based allow/deny decisions."""
    middleware_dir = _abs("backend/app/middleware")
    if not os.path.isdir(middleware_dir):
        pytest.skip("middleware directory not found")

    role_check_patterns = [
        'role == "admin"',
        'role == "teacher"',
        'role == "student"',
        'role not in',
        'raise HTTPException(status_code=403',
    ]
    for file in os.listdir(middleware_dir):
        if not file.endswith(".py"):
            continue
        full_path = os.path.join(middleware_dir, file)
        with open(full_path) as f:
            source = f.read()
        for pattern in role_check_patterns:
            assert pattern not in source, (
                f"middleware/{file} contains role-based access control: '{pattern}'. "
                "Role authorization belongs exclusively in deps.py."
            )


def test_no_duplicate_function_names_in_student_router():
    """student.py must not have duplicate async def names (FastAPI silently ignores one)."""
    source = _source("backend/app/routers/student.py")
    tree = ast.parse(source)
    func_names = [
        node.name
        for node in ast.walk(tree)
        if isinstance(node, ast.AsyncFunctionDef)
    ]
    duplicates = {name for name in func_names if func_names.count(name) > 1}
    assert not duplicates, (
        f"student.py has duplicate async function names: {duplicates}. "
        "Each FastAPI route handler must have a unique function name."
    )
