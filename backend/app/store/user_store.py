from typing import Optional, List
from datetime import datetime
import uuid
from app.database.supabase_manager import supabase_db
from app.core.security import get_password_hash, verify_password
from app.core.logging import structlog

log = structlog.get_logger()


class UserStore:
    """
    Supabase store for Users.
    """

    def __init__(self):
        # supabase_db is the production-ready manager instance
        self.db = supabase_db

    def verify_password(self, plain_password, hashed_password):
        return verify_password(plain_password, hashed_password)

    def get_password_hash(self, password):
        return get_password_hash(password)

    def _sanitize_user(self, user: dict) -> dict:
        """Removes sensitive fields and normalizes user object for API consumption."""
        if not user:
            return {}
        
        safe_user = user.copy()
        safe_user.pop("password_hash", None)
        
        # Consistent naming for frontend (name, avatar, status)
        name = safe_user.get("name") or "Unnamed User"
        avatar = safe_user.get("avatar")
        if not avatar:
            avatar = f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background=111827&color=F9FAFB"
        
        safe_user["name"] = name
        safe_user["avatar"] = avatar
        safe_user["status"] = safe_user.get("status", "active")
        safe_user["is_active"] = safe_user["status"] == "active"
        
        return safe_user

    async def create_user(
        self, email: str, password: str, full_name: str, role: str = "student", phone: str = ""
    ) -> dict:
        hashed_password = self.get_password_hash(password)

        user_data = {
            "email": email,
            "password_hash": hashed_password,
            "name": full_name,
            "role": role,
            "phone": phone or "N/A",
            "status": "active",
            "is_active": True
        }

        try:
            # Use SupabaseManager's upsert (acts as insert here)
            result = await self.db.upsert("users", user_data)
            if not result:
                raise Exception("Failed to create user record")
            
            return self._sanitize_user(result[0])

        except Exception as e:
            if "duplicate key" in str(e).lower():
                raise Exception("Email already registered")
            log.error("create_user_failed", error=str(e), email=email)
            raise e

    async def get_user_by_email(self, email: str) -> Optional[dict]:
        try:
            client = self.db.get_client()
            response = client.table("users").select("*").eq("email", email).execute()
            if response.data:
                return response.data[0]
        except Exception as e:
            log.error("get_user_by_email_failed", error=str(e), email=email)
        return None

    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        return await self.db.fetch_one("users", {"id": user_id})

    async def list_all_users(self) -> List[dict]:
        try:
            users = await self.db.fetch_all("users", limit=500)
            return [self._sanitize_user(u) for u in users]
        except Exception as e:
            log.error("list_all_users_failed", error=str(e))
            return []

    async def delete_user(self, user_id: str) -> bool:
        return await self.db.delete("users", {"id": user_id})

    async def update_user_role(self, user_id: str, role: str) -> bool:
        try:
            client = self.db.get_client()
            response = client.table("users").update({"role": role}).eq("id", user_id).execute()
            return len(response.data) > 0
        except Exception as e:
            log.error("update_user_role_failed", error=str(e), user_id=user_id)
            return False

    async def update_user_status(self, user_id: str, status: str) -> bool:
        normalized_status = (status or "").strip().lower()
        if normalized_status not in {"active", "inactive", "suspended"}:
            return False

        updates = {
            "status": normalized_status,
            "is_active": normalized_status == "active",
        }

        try:
            client = self.db.get_client()
            response = client.table("users").update(updates).eq("id", user_id).execute()
            return len(response.data) > 0
        except Exception as e:
            log.error("update_user_status_failed", error=str(e), user_id=user_id)
            return False

    async def update_user_fields(self, user_id: str, updates: dict) -> bool:
        restricted = {"id", "password", "password_hash", "email"}
        clean_updates = {k: v for k, v in updates.items() if k not in restricted}
        
        try:
            client = self.db.get_client()
            response = client.table("users").update(clean_updates).eq("id", user_id).execute()
            return len(response.data) > 0
        except Exception as e:
            log.error("update_user_fields_failed", error=str(e), user_id=user_id)
            return False
