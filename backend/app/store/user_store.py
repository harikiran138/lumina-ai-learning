from typing import Optional
from app.database.supabase_manager import supabase_db
from app.database.models import User
from app.core.security import get_password_hash, verify_password
from app.core.logging import structlog

log = structlog.get_logger()


class UserStore:
    """
    Supabase store for Users.
    """

    def __init__(self):
        self.client = supabase_db.get_client()

    async def ensure_indexes(self):
        """
        Supabase handles indexes via PostgreSQL.
        """
        pass

    def verify_password(self, plain_password, hashed_password):
        return verify_password(plain_password, hashed_password)

    def get_password_hash(self, password):
        return get_password_hash(password)

    async def create_user(
        self, email: str, password: str, full_name: str, role: str = "student", phone: str = ""
    ) -> dict:
        hashed_password = self.get_password_hash(password)

        # Create user data
        user_data = {
            "email": email,
            "password_hash": hashed_password,
            "name": full_name,
            "role": role,
            "phone": phone or "N/A",
        }

        try:
            # Insert into 'users' table in Supabase
            response = self.client.table("users").insert(user_data).execute()
            
            if not response.data:
                raise Exception("Failed to create user")

            user_dict = response.data[0]
            
            # Return dict without internal fields for API response
            user_response = user_dict.copy()
            user_response.pop("password_hash", None)
            return user_response

        except Exception as e:
            if "duplicate key" in str(e).lower():
                raise Exception("Email already registered")
            log.error("create_user_failed", error=str(e))
            raise e

    async def get_user_by_email(self, email: str) -> Optional[dict]:
        try:
            response = self.client.table("users").select("*").eq("email", email).execute()
            if response.data:
                return response.data[0]
        except Exception as e:
            log.error("get_user_by_email_failed", error=str(e))
        return None

    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        try:
            response = self.client.table("users").select("*").eq("id", user_id).execute()
            if response.data:
                return response.data[0]
        except Exception as e:
            log.error("get_user_by_id_failed", error=str(e))
        return None

    async def list_all_users(self) -> list:
        try:
            response = self.client.table("users").select("*").limit(500).execute()
            users = response.data
            for u in users:
                u.pop("password_hash", None)
            return users
        except Exception as e:
            log.error("list_all_users_failed", error=str(e))
            return []

    async def delete_user(self, user_id: str) -> bool:
        try:
            response = self.client.table("users").delete().eq("id", user_id).execute()
            return len(response.data) > 0
        except Exception as e:
            log.error("delete_user_failed", error=str(e))
            return False

    async def update_user_role(self, user_id: str, role: str) -> bool:
        try:
            response = self.client.table("users").update({"role": role}).eq("id", user_id).execute()
            return len(response.data) > 0
        except Exception as e:
            log.error("update_user_role_failed", error=str(e))
            return False

    async def update_user_fields(self, user_id: str, updates: dict) -> bool:
        try:
            updates.pop("id", None)
            updates.pop("password", None)
            updates.pop("password_hash", None)
            updates.pop("email", None) # Do not allow email update via generic dict
            
            response = self.client.table("users").update(updates).eq("id", user_id).execute()
            return len(response.data) > 0
        except Exception as e:
            log.error("update_user_fields_failed", error=str(e))
            return False
