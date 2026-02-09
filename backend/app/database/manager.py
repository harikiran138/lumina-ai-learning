import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError
from app.core.config import settings


class DatabaseManager:
    """
    Robust MongoDB Database Manager.
    Handles connection pooling, retries, and clean shutdown.
    """

    client: AsyncIOMotorClient = None
    db = None

    @classmethod
    async def connect(cls):
        """
        Connect to MongoDB with retries and connection pooling.
        """
        if cls.client:
            return  # Already connected

        mongo_uri = settings.MONGODB_URI
        if not mongo_uri:
            print("❌ MONGODB_URI is not set. Database features will be disabled.")
            return

        print(f"🔄 Connecting to MongoDB... ({mongo_uri.split('@')[-1]})")  # Log safe part of URI

        retry_count = 0
        max_retries = 5

        while retry_count < max_retries:
            try:
                cls.client = AsyncIOMotorClient(
                    mongo_uri,
                    maxPoolSize=100,
                    minPoolSize=10,
                    maxIdleTimeMS=50000,
                    connectTimeoutMS=5000,
                    serverSelectionTimeoutMS=5000,
                )
                cls.db = cls.client.get_database("lumina_db")

                # Verify connection
                await cls.client.admin.command("ping")
                print("✅ Connected to MongoDB successfully!")

                # Setup Indexes
                await cls.setup_indexes()
                return
            except (ConnectionFailure, ServerSelectionTimeoutError) as e:
                retry_count += 1
                wait_time = 2**retry_count  # Exponential backoff
                print(f"⚠️ Failed to connect to MongoDB (Attempt {retry_count}/{max_retries}): {e}")
                print(f"   Retrying in {wait_time} seconds...")
                await asyncio.sleep(wait_time)
            except Exception as e:
                print(f"❌ Critical Error connecting to MongoDB: {e}")
                raise e

        print("❌ Could not connect to MongoDB after multiple attempts.")
        raise ConnectionFailure("Could not connect to MongoDB")

    @classmethod
    async def setup_indexes(cls):
        """
        Create necessary indexes for performance and constraints.
        """
        if cls.db is None:
            return

        print("⚡ Setting up MongoDB indexes...")
        try:
            # Users
            await cls.db.users.create_index("email", unique=True)

            # User Data
            await cls.db.user_data.create_index("user_id", unique=True)

            # Assessment Sessions
            await cls.db.assessment_sessions.create_index([("student_id", 1), ("timestamp", -1)])
            await cls.db.assessment_sessions.create_index("topic")

            # Courses
            await cls.db.courses.create_index("code", unique=True)

            # Assignments & Submissions
            await cls.db.assignments.create_index("course_id")
            await cls.db.submissions.create_index([("assignment_id", 1), ("student_id", 1)])

            # AI Conversations
            await cls.db.conversations.create_index([("user_id", 1), ("agent_id", 1)])

            print("✅ MongoDB indexes created successfully.")
        except Exception as e:
            print(f"⚠️ Error creating indexes: {e}")

    @classmethod
    async def close(cls):
        """
        Close the MongoDB connection.
        """
        if cls.client:
            cls.client.close()
            cls.client = None
            cls.db = None
            print("✅ Closed MongoDB connection")

    @classmethod
    def get_collection(cls, collection_name: str):
        """
        Get a specific collection from the database.
        """
        if cls.db is None:
            # Attempt prompt reconnection or raise error?
            # For now, simplistic check.
            # raise ConnectionFailure("Database not connected")
            # Return a dummy or None to fail gracefully in calling code if needed
            return None
        return cls.db[collection_name]

    @classmethod
    def get_db(cls):
        return cls.db


db = DatabaseManager()
