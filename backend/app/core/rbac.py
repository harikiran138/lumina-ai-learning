from enum import Enum
from typing import Any, Set


class Role(str, Enum):
    """
    Standardized core roles for Lumina AI LMS (B.Tech Edition).
    """
    STUDENT = "student"
    FACULTY = "faculty"
    HOD = "hod"
    ADMIN = "admin"
    PARENT = "parent"
    COUNSELOR = "counselor"
    MENTOR = "mentor"
    PEER_TUTOR = "peer_tutor"
    RESEARCHER = "researcher"
    ALUMNI = "alumni"
    CONTENT_CREATOR = "content_creator"
    PEER_MENTOR = "peer_mentor"
    SUPER_ADMIN = "super_admin"


# Role hierarchy: higher number = more authority
ROLE_HIERARCHY: dict[str, int] = {
    Role.SUPER_ADMIN: 100,
    Role.ADMIN: 80,
    Role.HOD: 60,
    Role.FACULTY: 50,
    Role.RESEARCHER: 45,
    Role.COUNSELOR: 40,
    Role.CONTENT_CREATOR: 35,
    Role.MENTOR: 30,
    Role.PEER_MENTOR: 28,
    Role.PEER_TUTOR: 25,
    Role.STUDENT: 20,
    Role.ALUMNI: 15,
    Role.PARENT: 10,
}

# Supervisor-specific permissions
SUPERVISOR_PERMISSIONS = frozenset([
    "grades:override",
    "templates:edit_master",
    "courses:view_all_sections",
    "verification_queue:manage",
    "teacher:grade_review",
])


# Canonical end-user roles
VALID_ROLES: Set[str] = {r.value for r in Role}

# Roles that require an admin invite
INVITE_ONLY_ROLES = {
    Role.ADMIN.value,
    Role.SUPER_ADMIN.value,
    Role.HOD.value,
    Role.FACULTY.value,
}

# Roles that can self-register
SELF_SIGNUP_ROLES = {
    Role.STUDENT.value,
    Role.PARENT.value,
    Role.ALUMNI.value,
    Role.PEER_TUTOR.value,
    Role.MENTOR.value,
    Role.RESEARCHER.value,
    Role.CONTENT_CREATOR.value,
    Role.COUNSELOR.value,
}

ALL_ROLES = VALID_ROLES


def normalize_role(role: Any) -> str:
    """Normalize a raw role string to one of the 9 core roles."""
    if not role:
        return Role.STUDENT.value

    raw = str(role).strip().lower().replace("-", "_")

    # Map legacy/alias strings to core roles
    alias_map = {
        "teacher": Role.FACULTY.value,
        "prof": Role.FACULTY.value,
        "mentor": Role.PEER_MENTOR.value,
        "peer tutor": Role.PEER_MENTOR.value,
        "peer_tutor": Role.PEER_MENTOR.value,
        "system_admin": Role.SUPER_ADMIN.value,
        "institution_admin": Role.ADMIN.value,
        "college_admin": Role.ADMIN.value,
        "auditor": Role.ADMIN.value,
    }

    if raw in alias_map:
        return alias_map[raw]

    # Pre-verified roles
    for r in Role:
        if raw == r.value:
            return raw

    return Role.STUDENT.value  # Default safe fallback


def get_permission_role(role: Any) -> str:
    """Collapse a granular role to the permission-level core role."""
    return normalize_role(role)


def to_db_role(role: Any) -> str:
    """
    Normalizes a role string to the database enum format.
    Standard Supabase/Postgres enums in Lumina usually expect lowercase or uppercase.
    """
    normalized = normalize_role(role)
    # Based on research, the database enum 'user_role' might be case-sensitive.
    # Defaulting to lowercase as per most common Postgres conventions if uppercase fails.
    return normalized.lower()

