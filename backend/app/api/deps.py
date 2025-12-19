from typing import Generator

def get_db() -> Generator:
    """
    Dependency to get DB session.
    STUB: Yields None.
    """
    yield None

def get_current_user():
    """
    Dependency to get current authenticated user.
    STUB: Returns a dummy user dict.
    """
    return {"username": "admin", "role": "admin"}
