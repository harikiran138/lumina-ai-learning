from typing import Optional
from app.database.manager import db
from app.database.models import User
from app.core.security import get_password_hash, verify_password
from app.core.logging import structlog

log = structlog.get_logger()


class UserStore:
    """
    MongoDB store for Users using Pydantic models.
    """

    def __init__(self):
        pass

    @property
    def users_collection(self):
        collection = db.get_collection("users")
        if collection is None:
            # Log only once or handle gracefully?
            # We'll log error but return None, caller must handle.
            log.error("mongodb_connection_missing", collection="users")
            return None
        return collection

    async def ensure_indexes(self):
        """
        Create necessary indexes.
        Should be called on startup or lazily.
        """
        collection = self.users_collection
        if collection:
            await collection.create_index("email", unique=True)

    def verify_password(self, plain_password, hashed_password):
        return verify_password(plain_password, hashed_password)

    def get_password_hash(self, password):
        return get_password_hash(password)

    async def create_user(
        self, email: str, password: str, full_name: str, role: str = "student"
    ) -> dict:
        collection = self.users_collection
        if collection is None:
            raise Exception("Database not connected")

        hashed_password = self.get_password_hash(password)

        # Create Pydantic Model
        user_model = User(
            email=email, hashed_password=hashed_password, full_name=full_name, role=role
        )

        user_dict = user_model.model_dump(by_alias=True)

        try:
            await collection.insert_one(user_dict)

            # Return dict without internal fields for API response
            user_response = user_dict.copy()
            user_response["id"] = user_response.pop("_id")  # Map _id to id
            user_response.pop("hashed_password", None)
            return user_response

        except Exception as e:
            if "duplicate key error" in str(e):
                raise Exception("Email already registered")
            log.error("create_user_failed", error=str(e))
            raise e

    async def get_user_by_email(self, email: str) -> Optional[dict]:
        collection = self.users_collection
        if collection is None:
            return None

        doc = await collection.find_one({"email": email})
        if doc:
            doc["id"] = doc.pop("_id")
            return doc
        return None

    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        collection = self.users_collection
        if collection is None:
            return None

        doc = await collection.find_one({"_id": user_id})
        if doc:
            doc["id"] = doc.pop("_id")
            return doc
        return None

    async def list_all_users(self) -> list:
        collection = self.users_collection
        if collection is None:
            return []
        cursor = collection.find({})
        users = await cursor.to_list(length=500)
        for u in users:
            u["id"] = str(u.pop("_id"))
            u.pop("hashed_password", None)
        return users

    async def delete_user(self, user_id: str) -> bool:
        collection = self.users_collection
        if collection is None:
            return False
        result = await collection.delete_one({"_id": user_id})
        return result.deleted_count > 0

    async def update_user_role(self, user_id: str, role: str) -> bool:
        collection = self.users_collection
        if collection is None:
            return False
        result = await collection.update_one({"_id": user_id}, {"$set": {"role": role}})
        return result.modified_count > 0
