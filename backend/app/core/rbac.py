from enum import Enum
from typing import Any


class Role(str, Enum):
    """
    All 11 institutional roles in the Lumina platform.
    Self-signup:   student, teacher, faculty, parent, mentor, peer_tutor, researcher
    Invite-only:   hod, admin, college_admin, super_admin, counselor
    """
    STUDENT = "student"
    TEACHER = "teacher"
    FACULTY = "faculty"
    HOD = "hod"
    ADMIN = "admin"
    COLLEGE_ADMIN = "college_admin"
    SUPER_ADMIN = "super_admin"
    PARENT = "parent"
    MENTOR = "mentor"
    PEER_TUTOR = "peer_tutor"
    COUNSELOR = "counselor"
    RESEARCHER = "researcher"


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

# Roles that require an admin invite
INVITE_ONLY_ROLES = {
    Role.HOD.value,
    Role.ADMIN.value,
    Role.COLLEGE_ADMIN.value,
    Role.SUPER_ADMIN.value,
    Role.COUNSELOR.value,
}

# All valid role strings
ALL_ROLES = SELF_SIGNUP_ROLES | INVITE_ONLY_ROLES


def normalize_role(role: Any) -> str:
    """Normalize a raw role string to a standard role string.

    Maps common aliases to canonical role names.
    Does NOT collapse teacher → faculty (they are distinct roles in Lumina).
    """
    if not role:
        return Role.STUDENT.value

    raw = str(role).strip().lower()

    # Direct matches
    if raw in ALL_ROLES:
        return raw

    # Alias mappings
    alias_map = {
        "stu": Role.STUDENT.value,
        "fac": Role.FACULTY.value,
        "adm": Role.ADMIN.value,
        "superadmin": Role.SUPER_ADMIN.value,
        "super admin": Role.SUPER_ADMIN.value,
        "collegeadmin": Role.COLLEGE_ADMIN.value,
        "college admin": Role.COLLEGE_ADMIN.value,
        "inst_admin": Role.COLLEGE_ADMIN.value,
        "peer tutor": Role.PEER_TUTOR.value,
        "peertutor": Role.PEER_TUTOR.value,
        "peer-tutor": Role.PEER_TUTOR.value,
    }

    if raw in alias_map:
        return alias_map[raw]

    return Role.STUDENT.value  # Default safe fallback
