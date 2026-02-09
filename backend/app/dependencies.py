from functools import lru_cache
from app.store.user_store import UserStore
from app.store.course_store import CourseStore
from app.store.user_data_store import UserDataStore
from app.store.student_store import StudentStore


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
