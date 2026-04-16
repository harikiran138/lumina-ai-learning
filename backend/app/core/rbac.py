from enum import Enum
from typing import Any, Set


class Role(str, Enum):
    """
    Standardized core roles for Lumina AI LMS.
    Consolidated from 12+ roles to 6 core roles for simplicity and security.
    """
    SUPER_ADMIN = "super_admin"   # Platform-wide management
    ADMIN = "admin"               # Institutional management (Admins, HODs, Supervisors)
    TEACHER = "teacher"           # Instructional staff (Teachers, Mentors, Content Creators)
    STUDENT = "student"           # Learners (Students, Researchers, Peer Tutors)
    PARENT = "parent"             # Guardians
    AUDITOR = "auditor"           # Read-only oversight


# Role hierarchy: higher number = more authority
ROLE_HIERARCHY: dict[str, int] = {
    Role.SUPER_ADMIN: 100,
    Role.ADMIN: 80,
    Role.AUDITOR: 50,
    Role.TEACHER: 40,
    Role.STUDENT: 20,
    Role.PARENT: 15,
}

# Supervisor-specific permissions
SUPERVISOR_PERMISSIONS = frozenset([
    "grades:override",
    "templates:edit_master",
    "courses:view_all_sections",
    "verification_queue:manage",
    "teacher:grade_review",
])


# Canonical end-user roles used by auth and onboarding.
VALID_ROLES: Set[str] = {
    Role.STUDENT.value,
    Role.TEACHER.value,
    Role.ADMIN.value,
    Role.PARENT.value,
}

# Roles that require an admin invite
INVITE_ONLY_ROLES = {
    Role.ADMIN.value,
    Role.SUPER_ADMIN.value,
    Role.AUDITOR.value,
}

PLATFORM_ROLES: Set[str] = {
    Role.SUPER_ADMIN.value,
    Role.ADMIN.value,
    Role.AUDITOR.value,
}

# Roles that can self-register via /api/auth/register
SELF_SIGNUP_ROLES = {
    Role.STUDENT.value,
    Role.TEACHER.value,
    Role.PARENT.value,
}

# All valid role strings, including legacy aliases that are normalized later.
ALL_ROLES = VALID_ROLES | PLATFORM_ROLES


def normalize_role(role: Any) -> str:
    """Normalize a raw role string to a standard role string.

    Maps common aliases to canonical role names.
    Canonical teaching role is `teacher`.
    """
    if not role:
        return Role.STUDENT.value

    raw = str(role).strip().lower()

    if raw == "admin" or raw == "administrator":
        return Role.SUPER_ADMIN.value

    # Direct matches
    if raw in ALL_ROLES:
        return raw

    # Alias mappings (Mapping 12 legacy roles to 6 core roles)
    alias_map = {
        # Super Admins
        "super_admin": Role.SUPER_ADMIN.value,
        "superadmin": Role.SUPER_ADMIN.value,
        "system_admin": Role.SUPER_ADMIN.value,
        
        # Institutional Admins
        "admin": Role.ADMIN.value,
        "institution_admin": Role.ADMIN.value,
        "hod": Role.ADMIN.value,
        "supervisor": Role.ADMIN.value,
        "finance": Role.ADMIN.value,
        "college_admin": Role.ADMIN.value,

        # Teaching Staff
        "teacher": Role.TEACHER.value,
        "faculty": Role.TEACHER.value,
        "mentor": Role.TEACHER.value,
        "content_creator": Role.TEACHER.value,
        "counselor": Role.TEACHER.value,

        # Students
        "student": Role.STUDENT.value,
        "researcher": Role.STUDENT.value,
        "peer_tutor": Role.STUDENT.value,
        "alumni": Role.STUDENT.value,

        # Guardians & Oversight
        "parent": Role.PARENT.value,
        "auditor": Role.AUDITOR.value,
    }

    if raw in alias_map:
        return alias_map[raw]

    # Handle common prefixes
    if "admin" in raw: return Role.ADMIN.value
    if "student" in raw: return Role.STUDENT.value
    if "teacher" in raw or "prof" in raw: return Role.TEACHER.value

    return Role.STUDENT.value  # Default safe fallback


def to_db_role(role: Any) -> str:
    """
    Normalizes a role string to the database enum format.
    Standard Supabase/Postgres enums in Lumina usually expect lowercase or uppercase.
    """
    normalized = normalize_role(role)
    # Based on research, the database enum 'user_role' might be case-sensitive.
    # Defaulting to lowercase as per most common Postgres conventions if uppercase fails.
    return normalized.lower()

