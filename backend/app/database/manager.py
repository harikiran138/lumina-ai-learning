from motor.motor_asyncio import AsyncIOMotorClient
from app.core.config import settings


class DatabaseManager:
    client: AsyncIOMotorClient = None
    db = None

    @classmethod
    async def connect(cls):
        if not cls.client:
            # Configure connection pooling for better performance
            cls.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                maxPoolSize=50,  # Maximum number of connections in the pool
                minPoolSize=10,  # Minimum number of connections to maintain
                maxIdleTimeMS=45000,  # Close connections idle for 45 seconds
                serverSelectionTimeoutMS=5000,  # Timeout for server selection
                connectTimeoutMS=10000,  # Timeout for initial connection
                socketTimeoutMS=20000,  # Timeout for socket operations
            )
            cls.db = cls.client.get_database("lumina_db")
            print("Connected to MongoDB with connection pooling")

    @classmethod
    async def close(cls):
        if cls.client:
            cls.client.close()
            print("Closed MongoDB connection")

    @classmethod
    def get_collection(cls, collection_name: str):
        return cls.db[collection_name]


db = DatabaseManager()
