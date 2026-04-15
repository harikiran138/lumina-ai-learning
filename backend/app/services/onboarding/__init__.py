"""
Role-based onboarding service module.

Provides unified onboarding flows for all Lumina platform roles.
Each role has a dedicated onboarding service with role-specific validation,
step progression, and data persistence.
"""

from .base_service import BaseOnboardingService
from .student_service import StudentOnboardingService
from .teacher_service import TeacherOnboardingService
from .parent_service import ParentOnboardingService
from .peer_tutor_service import PeerTutorOnboardingService
from .mentor_service import MentorOnboardingService
from .counselor_service import CounselorOnboardingService
from .content_creator_service import ContentCreatorOnboardingService
from .researcher_service import ResearcherOnboardingService
from .admin_service import AdminOnboardingService

__all__ = [
    "BaseOnboardingService",
    "StudentOnboardingService",
    "TeacherOnboardingService",
    "ParentOnboardingService",
    "PeerTutorOnboardingService",
    "MentorOnboardingService",
    "CounselorOnboardingService",
    "ContentCreatorOnboardingService",
    "ResearcherOnboardingService",
    "AdminOnboardingService",
]
