from datetime import datetime
from typing import Optional
import uuid
from .database import db
from app.core.security import get_password_hash, verify_password

class UserStore:
    """
    MongoDB store for Users.
    """
    def __init__(self):
        self._users_collection = None

    @property
    def users_collection(self):
        if self._users_collection is None:
            _db = db.get_db()
            if _db is not None:
                self._users_collection = _db["users"]
                # Create index on email if possible
                try:
                    self._users_collection.create_index("email", unique=True)
                except Exception as e:
                    print(f"Error creating index: {e}")
        return self._users_collection

    def verify_password(self, plain_password, hashed_password):
        return verify_password(plain_password, hashed_password)

    def get_password_hash(self, password):
        return get_password_hash(password)

    def create_user(self, email: str, password: str, full_name: str, role: str = "student") -> dict:
        collection = self.users_collection
        if collection is None:
            raise Exception("Database not connected")
            
        hashed_password = self.get_password_hash(password)
        # ... (rest is same, but I need to include it or rely on replace block matching)
        user = {
            "id": str(uuid.uuid4()),
            "email": email,
            "hashed_password": hashed_password,
            "full_name": full_name,
            "role": role,
            "created_at": datetime.now().isoformat()
        }
        try:
            collection.insert_one(user)
            user.pop("_id", None)
            user.pop("hashed_password", None)
            return user
        except Exception as e:
            # Handle duplicate email likely
            if "duplicate key error" in str(e):
                raise Exception("Email already registered")
            raise e

    def get_user_by_email(self, email: str) -> Optional[dict]:
        collection = self.users_collection
        if collection is None:
            return None
        doc = collection.find_one({"email": email})
        if doc:
            doc.pop("_id", None)
            return doc
        return None

    def get_user_by_id(self, user_id: str) -> Optional[dict]:
        collection = self.users_collection
        if collection is None:
            return None
        doc = collection.find_one({"id": user_id})
        if doc:
            doc.pop("_id", None)
            return doc
        return None
