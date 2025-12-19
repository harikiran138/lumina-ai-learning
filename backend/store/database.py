from pymongo import MongoClient
import os
from app.core.config import settings

class Database:
    client: MongoClient = None
    db = None

    def connect(self):
        if hasattr(settings, "MONGODB_URI") and settings.MONGODB_URI:
            mongo_url = settings.MONGODB_URI
        else:
            mongo_url = os.getenv("MONGODB_URI")
            
        if not mongo_url:
            print("Warning: MONGODB_URI not found in settings or environment, falling back to localhost")
            mongo_url = "mongodb://localhost:27017"
            
        try:
            self.client = MongoClient(mongo_url, serverSelectionTimeoutMS=5000)
            self.db = self.client["lumina_db"]
            # Test connection
            self.client.server_info()
            print(f"Connected to MongoDB at {mongo_url.split('@')[-1] if '@' in mongo_url else 'localhost'}")
        except Exception as e:
            print(f"Failed to connect to MongoDB: {e}")
            self.db = None

    def get_db(self):
        if self.db is None:
            self.connect()
        return self.db

db = Database()
