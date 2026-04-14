from typing import Any, Optional
from fastapi import Depends
from app.database.scoped_db import get_scoped_db, ScopedSupabase

from app.store.user_store import UserStore
from app.store.course_store import CourseStore
from app.store.user_data_store import UserDataStore
from app.store.student_store import StudentStore
from app.store.assignment_store import AssignmentStore
from app.store.agent_store import AgentStore
from app.store.personalization_store import PersonalizationStore
from app.store.analytics_store import AnalyticsStore
from app.store.community_store import CommunityStore
from app.store.generation_store import GenerationStore
from app.store.institution_store import InstitutionStore
from app.store.tutor_memory_store import TutorMemoryStore
from app.store.parent_store import ParentStore
from app.store.mentor_store import MentorStore
from app.store.peer_tutor_store import PeerTutorStore
from app.store.counselor_store import CounselorStore
from app.store.content_creator_store import ContentCreatorStore
from app.store.researcher_store import ResearcherStore
from app.store.alumni_store import AlumniStore
from app.store.content_store import ContentStore
from app.store.attendance_store import AttendanceStore
from app.store.teacher_store import TeacherStore
from app.store.academic_store import AcademicStore
from app.store.config_store import ConfigStore


# ── Store Providers ────────────────────────────────────────────────────────────

def get_user_store(db: ScopedSupabase = Depends(get_scoped_db)) -> UserStore:
    return UserStore(db=db)

def get_attendance_store(db: ScopedSupabase = Depends(get_scoped_db)) -> AttendanceStore:
    return AttendanceStore(db=db)

def get_course_store(db: ScopedSupabase = Depends(get_scoped_db)) -> CourseStore:
    return CourseStore(db=db)

def get_user_data_store(db: ScopedSupabase = Depends(get_scoped_db)) -> UserDataStore:
    return UserDataStore(db=db)

def get_student_store(db: ScopedSupabase = Depends(get_scoped_db)) -> StudentStore:
    return StudentStore(db=db)

def get_assignment_store(db: ScopedSupabase = Depends(get_scoped_db)) -> AssignmentStore:
    return AssignmentStore(db=db)

def get_agent_store(db: ScopedSupabase = Depends(get_scoped_db)) -> AgentStore:
    return AgentStore(db=db)

def get_personalization_store(db: ScopedSupabase = Depends(get_scoped_db)) -> PersonalizationStore:
    return PersonalizationStore(db=db)

def get_analytics_store(db: ScopedSupabase = Depends(get_scoped_db)) -> AnalyticsStore:
    return AnalyticsStore(db=db)

def get_community_store(db: ScopedSupabase = Depends(get_scoped_db)) -> CommunityStore:
    return CommunityStore(db=db)

def get_generation_store(db: ScopedSupabase = Depends(get_scoped_db)) -> GenerationStore:
    return GenerationStore(db=db)

def get_institution_store(db: ScopedSupabase = Depends(get_scoped_db)) -> InstitutionStore:
    return InstitutionStore(db=db)

def get_tutor_memory_store(db: ScopedSupabase = Depends(get_scoped_db)) -> TutorMemoryStore:
    return TutorMemoryStore(db=db)

def get_parent_store(db: ScopedSupabase = Depends(get_scoped_db)) -> ParentStore:
    return ParentStore(db=db)

def get_mentor_store(db: ScopedSupabase = Depends(get_scoped_db)) -> MentorStore:
    return MentorStore(db=db)

def get_peer_tutor_store(db: ScopedSupabase = Depends(get_scoped_db)) -> PeerTutorStore:
    return PeerTutorStore(db=db)

def get_counselor_store(db: ScopedSupabase = Depends(get_scoped_db)) -> CounselorStore:
    return CounselorStore(db=db)

def get_content_creator_store(db: ScopedSupabase = Depends(get_scoped_db)) -> ContentCreatorStore:
    return ContentCreatorStore(db=db)

def get_researcher_store(db: ScopedSupabase = Depends(get_scoped_db)) -> ResearcherStore:
    return ResearcherStore(db=db)

def get_alumni_store(db: ScopedSupabase = Depends(get_scoped_db)) -> AlumniStore:
    return AlumniStore(db=db)

def get_teacher_store(db: ScopedSupabase = Depends(get_scoped_db)) -> TeacherStore:
    return TeacherStore(db=db)

def get_content_store(db: ScopedSupabase = Depends(get_scoped_db)) -> ContentStore:
    return ContentStore(db=db)

def get_academic_store(db: ScopedSupabase = Depends(get_scoped_db)) -> AcademicStore:
    return AcademicStore(db=db)

def get_config_store(db: ScopedSupabase = Depends(get_scoped_db)) -> ConfigStore:
    return ConfigStore(db=db)

# ── Service Providers ──────────────────────────────────────────────────────────

def get_personalization_service(db: ScopedSupabase = Depends(get_scoped_db)):
    from app.services.personalization_service import PersonalizationService
    return PersonalizationService(db=db)

def get_ocr_service(db: ScopedSupabase = Depends(get_scoped_db)):
    from app.services.ocr_service import OCRService
    return OCRService(db=db)

def get_grader_service(db: ScopedSupabase = Depends(get_scoped_db)):
    from app.services.grader_service import GraderService
    return GraderService(db=db)

def get_onboarding_service(db: ScopedSupabase = Depends(get_scoped_db)):
    from app.services.onboarding_service import OnboardingService
    return OnboardingService(db=db)

def get_risk_analysis_service(db: ScopedSupabase = Depends(get_scoped_db)):
    from app.services.risk_service import RiskAnalysisService
    return RiskAnalysisService(db=db)

def get_compliance_service(db: ScopedSupabase = Depends(get_scoped_db)):
    from app.services.compliance_service import ComplianceService
    return ComplianceService(db=db)

def get_guardian_service(db: ScopedSupabase = Depends(get_scoped_db)):
    from app.services.guardian_service import GuardianService
    return GuardianService(db=db)
