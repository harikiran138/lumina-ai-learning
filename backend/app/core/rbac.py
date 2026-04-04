from enum import Enum
from typing import Any, Set


class Role(str, Enum):
    """
    Standard institutional roles in the Lumina platform.
    Self-signup:   student, teacher, faculty, parent, mentor, peer_tutor, researcher
    Invite-only:   hod, college_admin, super_admin, counselor, content_creator
    """
    SUPER_ADMIN = "super_admin"
    SYSTEM_ADMIN = "system_admin"
    COLLEGE_ADMIN = "college_admin"
    INSTITUTION_ADMIN = "institution_admin"
    HOD = "hod"
    FACULTY = "faculty"
    TEACHER = "teacher"
    STUDENT = "student"
    PARENT = "parent"
    GUEST = "guest"
    MENTOR = "mentor"
    PEER_TUTOR = "peer_tutor"
    RESEARCHER = "researcher"
    COUNSELOR = "counselor"
    CONTENT_CREATOR = "content_creator"


# Canonical end-user roles used by auth and onboarding.
VALID_ROLES: Set[str] = {
    Role.STUDENT.value,
    Role.TEACHER.value,
    "admin",
    Role.PARENT.value,
    Role.MENTOR.value,
    Role.PEER_TUTOR.value,
}

# Roles that require an admin invite
INVITE_ONLY_ROLES = {
    Role.HOD.value,
    Role.COLLEGE_ADMIN.value,
    Role.SUPER_ADMIN.value,
    Role.SYSTEM_ADMIN.value,
    Role.INSTITUTION_ADMIN.value,
    Role.COUNSELOR.value,
    Role.CONTENT_CREATOR.value,
}

PLATFORM_ROLES: Set[str] = {
    Role.HOD.value,
    Role.COLLEGE_ADMIN.value,
    Role.SUPER_ADMIN.value,
    Role.SYSTEM_ADMIN.value,
    Role.INSTITUTION_ADMIN.value,
    Role.COUNSELOR.value,
    Role.CONTENT_CREATOR.value,
    Role.RESEARCHER.value,
    Role.GUEST.value,
    "alumni",
}

# Roles that can self-register via /api/auth/register
SELF_SIGNUP_ROLES = {
    Role.STUDENT.value,
    Role.TEACHER.value,
    Role.FACULTY.value,
    Role.PARENT.value,
    Role.MENTOR.value,
    Role.PEER_TUTOR.value,
    Role.RESEARCHER.value,
}

# All valid role strings, including legacy aliases that are normalized later.
ALL_ROLES = VALID_ROLES | PLATFORM_ROLES | {"faculty"}


def normalize_role(role: Any) -> str:
    """Normalize a raw role string to a standard role string.

    Maps common aliases to canonical role names.
    Canonical teaching role is `teacher`; `faculty` remains a legacy alias only.
    """
    if not role:
        return Role.STUDENT.value

    raw = str(role).strip().lower()

    if raw == "admin" or raw == "administrator":
        return Role.SUPER_ADMIN.value

    # Direct matches
    if raw in ALL_ROLES:
        return raw

    # Alias mappings
    alias_map = {
        "stu": Role.STUDENT.value,
        "student": Role.STUDENT.value,
        "fac": Role.TEACHER.value,
        "faculty": Role.TEACHER.value,
        "tea": Role.TEACHER.value,
        "teacher": Role.TEACHER.value,
        "adm": "admin",
        "admin": "admin",
        "college_admin": Role.COLLEGE_ADMIN.value,
        "superadmin": Role.SUPER_ADMIN.value,
        "super admin": Role.SUPER_ADMIN.value,
        "system_admin": Role.SYSTEM_ADMIN.value,
        "systemadmin": Role.SYSTEM_ADMIN.value,
        "system admin": Role.SYSTEM_ADMIN.value,
        "institution_admin": Role.INSTITUTION_ADMIN.value,
        "institutionadmin": Role.INSTITUTION_ADMIN.value,
        "institution admin": Role.INSTITUTION_ADMIN.value,
        "collegeadmin": Role.COLLEGE_ADMIN.value,
        "college admin": Role.COLLEGE_ADMIN.value,
        "inst_admin": Role.INSTITUTION_ADMIN.value,
        "curriculum": Role.CONTENT_CREATOR.value,
        "peer tutor": Role.PEER_TUTOR.value,
        "peertutor": Role.PEER_TUTOR.value,
        "peer-tutor": Role.PEER_TUTOR.value,
        "parent": Role.PARENT.value,
        "mentor": Role.MENTOR.value,
        "researcher": Role.RESEARCHER.value,
        "counselor": Role.COUNSELOR.value,
        "hod": Role.HOD.value,
    }

    if raw in alias_map:
        return alias_map[raw]

    # Handle common prefixes
    if "admin" in raw: return Role.SUPER_ADMIN.value
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
