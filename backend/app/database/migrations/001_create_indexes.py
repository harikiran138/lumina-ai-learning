from pymongo import ASCENDING


def up(db):
    """
    Setup initial indexes for performance and uniqueness.
    """
    print("    Index: users.email (unique)")
    db.users.create_index([("email", ASCENDING)], unique=True)

    print("    Index: courses.code (unique)")
    db.courses.create_index([("code", ASCENDING)], unique=True)

    print("    Index: courses.teacher_id")
    db.courses.create_index([("teacher_id", ASCENDING)])

    print("    Index: user_data.user_id (if using Mongo later)")
    # Even if currently in JSON, we can prepare for the move to Mongo
    db.user_data.create_index([("user_id", ASCENDING)], unique=True)
