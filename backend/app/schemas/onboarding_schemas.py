"""
Pydantic models for onboarding system validation.
"""

from pydantic import BaseModel, Field, validator
from typing import Dict, List, Any, Optional
from datetime import datetime


# ═══════════════════════════════════════════════════════════════════════════
# COMMON MODELS
# ═══════════════════════════════════════════════════════════════════════════

class OnboardingResponseSchema(BaseModel):
    """Generic onboarding API response."""
    success: bool
    data: Dict[str, Any] = {}
    error: Optional[str] = None
    
    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {
                    "role": "student",
                    "step": 1,
                    "total_steps": 7,
                    "progress_percent": 14.3
                }
            }
        }


# ═══════════════════════════════════════════════════════════════════════════
# STUDENT MODELS
# ═══════════════════════════════════════════════════════════════════════════

class StudentStep1(BaseModel):
    """Student step 1: Personal information."""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    date_of_birth: Optional[str] = None
    contact_phone: Optional[str] = None


class StudentStep2(BaseModel):
    """Student step 2: Educational background."""
    current_level: str
    school_name: Optional[str] = None
    board_name: Optional[str] = None
    gpa: Optional[float] = Field(None, ge=0, le=4.0)


class StudentStep3(BaseModel):
    """Student step 3: Learning style."""
    learning_style: str = Field(..., pattern="^(visual|auditory|kinesthetic|reading_writing)$")


class StudentStep4(BaseModel):
    """Student step 4: Profile picture."""
    profile_photo_url: Optional[str] = None


class StudentStep5(BaseModel):
    """Student step 5: Learning goals."""
    primary_goal: str
    learning_duration_hours_per_week: Optional[float] = Field(None, ge=0, le=168)


class StudentStep6(BaseModel):
    """Student step 6: Subject selection."""
    selected_subjects: List[str] = Field(..., min_items=1, max_items=8)


class StudentStep7(BaseModel):
    """Student step 7: Adaptive quiz."""
    quiz_completed: bool
    quiz_score: float = Field(..., ge=0, le=100)
    quiz_responses: Optional[Dict[str, Any]] = None


# ═══════════════════════════════════════════════════════════════════════════
# TEACHER MODELS
# ═══════════════════════════════════════════════════════════════════════════

class TeacherStep1(BaseModel):
    """Teacher step 1: Personal information."""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    contact_phone: Optional[str] = None
    employment_type: str


class TeacherStep2(BaseModel):
    """Teacher step 2: Subject expertise."""
    subjects: List[str] = Field(..., min_items=1, max_items=5)
    qualifications: Optional[List[str]] = None
    years_of_experience: Optional[int] = Field(None, ge=0, le=60)


class TeacherStep3(BaseModel):
    """Teacher step 3: Teaching experience."""
    teaching_methodology_preference: str
    previous_institutions: Optional[List[str]] = None
    certifications: Optional[List[str]] = None


class TeacherStep4(BaseModel):
    """Teacher step 4: Classroom setup."""
    institution_name: str
    department: Optional[str] = None
    grade_levels: List[str] = Field(..., min_items=1)
    class_sections: Optional[List[str]] = None


class TeacherStep5(BaseModel):
    """Teacher step 5: Preferences."""
    profile_photo_url: Optional[str] = None
    ai_assistant_preference: str
    notification_settings: Optional[Dict[str, Any]] = None


# ═══════════════════════════════════════════════════════════════════════════
# PEER TUTOR MODELS
# ═══════════════════════════════════════════════════════════════════════════

class PeerTutorStep1(BaseModel):
    """Peer tutor step 1: Personal information."""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    contact_phone: Optional[str] = None
    bio: Optional[str] = Field(None, max_length=500)


class PeerTutorStep2(BaseModel):
    """Peer tutor step 2: Subject expertise."""
    tutor_subjects: List[str] = Field(..., min_items=1, max_items=6)
    expertise_levels: Dict[str, float]  # {subject: mastery_score}
    certifications: Optional[List[str]] = None
    
    @validator('expertise_levels')
    def validate_mastery_scores(cls, v):
        for subject, score in v.items():
            try:
                mastery = float(score)
                if mastery < 0.80:
                    raise ValueError(f"Mastery for {subject} must be at least 0.80 (80%)")
            except (ValueError, TypeError):
                raise ValueError(f"Invalid mastery score for {subject}")
        return v


class PeerTutorStep3(BaseModel):
    """Peer tutor step 3: Availability."""
    availability: Dict[str, Any]  # e.g., {mon: {start: "09:00", end: "17:00"}}
    timezone: str = Field(..., pattern="^(IST|EST|PST|GMT|UTC)$")


class PeerTutorStep4(BaseModel):
    """Peer tutor step 4: Rates and tutoring style."""
    rate_per_hour: float = Field(..., gt=0, le=10000)
    currency: str = Field(..., pattern="^(INR|USD|EUR|GBP)$")
    tutoring_style: str = Field(..., pattern="^(One-on-one|Small groups|Flexible)$")
    max_students_per_week: Optional[int] = Field(None, ge=1, le=50)


# ═══════════════════════════════════════════════════════════════════════════
# PARENT MODELS
# ═══════════════════════════════════════════════════════════════════════════

class ParentStep1(BaseModel):
    """Parent step 1: Personal information."""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    contact_phone: Optional[str] = None
    relationship_to_student: Optional[str] = None


class ParentStep2(BaseModel):
    """Parent step 2: Link children."""
    children: List[str] = Field(..., min_items=1)  # List of child user IDs or emails


class ParentStep3(BaseModel):
    """Parent step 3: Communication preferences."""
    preferred_language: str = Field(..., pattern="^(English|Hindi|Tamil|Bengali|Marathi)$")
    communication_channels: Optional[List[str]] = None


class ParentStep4(BaseModel):
    """Parent step 4: Privacy and safety."""
    accept_privacy_policy: bool = Field(..., const=True)
    accept_data_usage: Optional[bool] = False


class ParentStep5(BaseModel):
    """Parent step 5: Notification preferences."""
    notification_frequency: str = Field(..., pattern="^(Real-time|Daily digest|Weekly digest|Disabled)$")
    notification_types: Optional[List[str]] = None


# ═══════════════════════════════════════════════════════════════════════════
# MENTOR MODELS
# ═══════════════════════════════════════════════════════════════════════════

class MentorStep1(BaseModel):
    """Mentor step 1: Professional background."""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    current_title: str = Field(..., min_length=2, max_length=200)
    company_name: Optional[str] = None
    years_of_experience: Optional[int] = Field(None, ge=0, le=70)


class MentorStep2(BaseModel):
    """Mentor step 2: Expertise domain."""
    expertise_areas: List[str] = Field(..., min_items=1)
    certifications: Optional[List[str]] = None
    specializations: Optional[List[str]] = None


class MentorStep3(BaseModel):
    """Mentor step 3: Availability and rates."""
    availability_hours_per_month: int = Field(..., ge=1, le=730)
    rate_per_session: Optional[float] = Field(None, gt=0)
    currency: Optional[str] = None
    session_duration_minutes: Optional[int] = Field(None, ge=15, le=480)


class MentorStep4(BaseModel):
    """Mentor step 4: Matching preferences."""
    mentee_background: Optional[List[str]] = None
    mentee_goals: List[str] = Field(..., min_items=1)
    max_mentees: Optional[int] = Field(None, ge=1, le=50)


class MentorStep5(BaseModel):
    """Mentor step 5: Portfolio and confirmation."""
    portfolio_url: Optional[str] = None
    achievements: Optional[List[str]] = None
    accept_terms: bool = Field(..., const=True)


# ═══════════════════════════════════════════════════════════════════════════
# COUNSELOR MODELS
# ═══════════════════════════════════════════════════════════════════════════

class CounselorStep1(BaseModel):
    """Counselor step 1: Personal information."""
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    contact_phone: Optional[str] = None
    license_number: str = Field(..., min_length=5, max_length=50)


class CounselorStep2(BaseModel):
    """Counselor step 2: Certifications."""
    certification_document: str  # URL or file path
    specialization: str = Field(..., pattern="^(Academic Counseling|Career Counseling|Mental Health|Personal Development)$")
    years_of_experience: Optional[int] = Field(None, ge=0, le=70)


class CounselorStep3(BaseModel):
    """Counselor step 3: Institution assignment."""
    assigned_institution: str
    assigned_department: Optional[str] = None
    student_groups: Optional[List[str]] = None


class CounselorStep4(BaseModel):
    """Counselor step 4: Availability."""
    available_hours: Dict[str, Any]
    session_duration_minutes: Optional[int] = Field(None, ge=15, le=120)


class CounselorStep5(BaseModel):
    """Counselor step 5: Privacy agreement."""
    accept_confidentiality_agreement: bool = Field(..., const=True)
    legal_name_verification: bool = False


# ═══════════════════════════════════════════════════════════════════════════
# ADMIN MODELS
# ═══════════════════════════════════════════════════════════════════════════

class AdminStep1(BaseModel):
    """Admin step 1: Role confirmation."""
    admin_role: str = Field(..., pattern="^(college_admin|super_admin|system_admin|institution_admin|hod)$")
    department_or_system: Optional[str] = None


class AdminStep2(BaseModel):
    """Admin step 2: Institution mapping."""
    institution_id: str
    system_region: Optional[str] = None
    parent_organization: Optional[str] = None


class AdminStep3(BaseModel):
    """Admin step 3: Department setup."""
    department_name: str = Field(..., min_length=2, max_length=255)
    department_code: Optional[str] = None
    reporting_structure: Optional[Dict[str, Any]] = None


class AdminStep4(BaseModel):
    """Admin step 4: Permissions."""
    permission_groups: List[str] = Field(..., min_items=1)
    user_management: Optional[bool] = False
    content_moderation: Optional[bool] = False
    analytics_access: Optional[bool] = False


class AdminStep5(BaseModel):
    """Admin step 5: Integrations."""
    ldap_integration: Optional[bool] = False
    sso_enabled: Optional[bool] = False
    api_key_generated: Optional[bool] = False


class AdminStep6(BaseModel):
    """Admin step 6: Security."""
    two_factor_enabled: bool = True
    audit_logging_enabled: bool = True
    accept_security_policy: bool = Field(..., const=True)
