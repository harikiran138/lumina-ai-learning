from enum import Enum
from typing import List, Optional, Any

class Role(str, Enum):
    STUDENT = "student"
    FACULTY = "faculty"
    HOD = "hod"
    COLLEGE_ADMIN = "college_admin"
    SUPER_ADMIN = "super_admin"
    PARENT = "parent"

def normalize_role(role: Any) -> str:
    """Normalize a raw role string to a standard role string.
    Ensures 'admin' -> 'super_admin' and 'teacher' -> 'faculty' for global consistency.
    """
    if not role:
        return Role.STUDENT.value
    
    # Handle non-string types if any
    raw = str(role).strip().lower()
    
    if raw in {"student", "stu"}:
        return Role.STUDENT.value
    if raw in {"teacher", "fac", "faculty"}:
        return Role.FACULTY.value
    if raw == "hod":
        return Role.HOD.value
    if raw in {"admin", "adm", "super_admin", "superadmin"}:
        return Role.SUPER_ADMIN.value
    if raw in {"college_admin", "collegeadmin", "inst_admin"}:
        return Role.COLLEGE_ADMIN.value
    if raw == "parent":
        return Role.PARENT.value
    
    return Role.STUDENT.value # Default safe fallback
