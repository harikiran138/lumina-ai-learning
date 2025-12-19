from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings

class DatabaseManager:
    client: AsyncIOMotorClient = None
    db = None

    @classmethod
    async def connect(cls):
        if not cls.client:
            cls.client = AsyncIOMotorClient(settings.MONGODB_URI)
            cls.db = cls.client.get_database("lumina_db")
            print("Connected to MongoDB")

    @classmethod
    async def close(cls):
        if cls.client:
            cls.client.close()
            print("Closed MongoDB connection")

    @classmethod
    def get_collection(cls, collection_name: str):
        return cls.db[collection_name]

db = DatabaseManager()
