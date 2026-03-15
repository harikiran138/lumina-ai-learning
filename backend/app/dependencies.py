from functools import lru_cache
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


@lru_cache()
def get_user_store() -> UserStore:
    return UserStore()


@lru_cache()
def get_course_store() -> CourseStore:
    return CourseStore()


@lru_cache()
def get_user_data_store() -> UserDataStore:
    return UserDataStore()


@lru_cache()
def get_student_store() -> StudentStore:
    return StudentStore()


@lru_cache()
def get_assignment_store() -> AssignmentStore:
    return AssignmentStore()


@lru_cache()
def get_agent_store() -> AgentStore:
    return AgentStore()


@lru_cache()
def get_personalization_store() -> PersonalizationStore:
    return PersonalizationStore()


@lru_cache()
def get_analytics_store() -> AnalyticsStore:
    return AnalyticsStore()


@lru_cache()
def get_community_store() -> CommunityStore:
    return CommunityStore()


@lru_cache()
def get_generation_store() -> GenerationStore:
    return GenerationStore()


@lru_cache()
def get_institution_store() -> InstitutionStore:
    return InstitutionStore()


@lru_cache()
def get_tutor_memory_store() -> TutorMemoryStore:
    return TutorMemoryStore()
