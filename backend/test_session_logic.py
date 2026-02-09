import asyncio
import sys
import os
from unittest.mock import MagicMock

sys.path.append(os.getcwd())

# Mock DB before importing dependent modules
from app.database.manager import DatabaseManager  # noqa: E402

DatabaseManager.get_collection = MagicMock(return_value=None)

from app.assessment.engine.session_manager import SessionManager  # noqa: E402


async def test_logic():
    print("Testing SessionManager logic...")
    sm = SessionManager()

    # Test create_session
    print("Call create_session...")
    try:
        session = await sm.create_session(student_id="s1", topic="math", num_questions=3)
        print(f"create_session returned: {type(session)}")
    except Exception as e:
        print(f"create_session failed: {e}")

    # Test get_session (in memory fallback)
    print("Call get_session...")
    try:
        # We assume create_session stored it in memory because mocked collection is None
        s2 = await sm.get_session(session.id)
        print(f"get_session returned: {type(s2)}")
    except Exception as e:
        print(f"get_session failed: {e}")

    # Test get_session with None
    try:
        # Check return type for non-existent session
        s3 = await sm.get_session("nonexistent")
        print(f"get_session(nonexistent) returned: {s3}")
        if s3 is None:
            print("Awaiting get_session returning None is OK.")
    except Exception as e:
        print(f"get_session(nonexistent) failed: {e}")


if __name__ == "__main__":
    asyncio.run(test_logic())
