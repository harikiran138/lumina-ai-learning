from typing import Optional
from datetime import datetime
import uuid
from app.database.supabase_manager import supabase_db
from app.database.models import User
from app.core.security import get_password_hash, verify_password
from app.core.logging import structlog
from app.store.local_store import LocalJsonStore

log = structlog.get_logger()


class UserStore:
    """
    Supabase store for Users.
    """

    def __init__(self):
        self.client = supabase_db.get_client()
        self.local = LocalJsonStore()

    async def ensure_indexes(self):
        """
        Supabase handles indexes via PostgreSQL.
        """
        pass

    def verify_password(self, plain_password, hashed_password):
        return verify_password(plain_password, hashed_password)

    def get_password_hash(self, password):
        return get_password_hash(password)

    def _sanitize_user(self, user: dict) -> dict:
        safe_user = user.copy()
        safe_user.pop("password_hash", None)
        safe_user.pop("hashed_password", None)

        name = safe_user.get("name") or safe_user.get("full_name") or "Unnamed User"
        created_at = safe_user.get("created_at") or safe_user.get("createdAt")
        status = safe_user.get("status")
        if not status:
            status = "active" if safe_user.get("is_active", True) else "inactive"

        avatar = safe_user.get("avatar") or safe_user.get("profile_image")
        if not avatar:
            avatar = (
                "https://ui-avatars.com/api/?name="
                f"{name.replace(' ', '+')}&background=111827&color=F9FAFB"
            )

        safe_user["name"] = name
        safe_user["created_at"] = created_at
        safe_user["createdAt"] = created_at
        safe_user["status"] = status
        safe_user["is_active"] = status == "active"
        safe_user["avatar"] = avatar
        return safe_user

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

        if self.client is None:
            payload = self.local.read()
            existing = next((item for item in payload["users"] if item.get("email") == email), None)
            if existing:
                raise Exception("Email already registered")

            user_record = {
                "id": str(uuid.uuid4()),
                "email": email,
                "password_hash": hashed_password,
                "name": full_name,
                "role": role,
                "phone": phone or "N/A",
                "created_at": datetime.utcnow().isoformat(),
                "status": "active",
                "is_active": True,
            }
            payload["users"].append(user_record)
            self.local.write(payload)
            return self._sanitize_user(user_record)

        try:
            # Insert into 'users' table in Supabase
            response = self.client.table("users").insert(user_data).execute()
            
            if not response.data:
                raise Exception("Failed to create user")

            user_dict = response.data[0]
            
            # Return dict without internal fields for API response
            return self._sanitize_user(user_dict)

        except Exception as e:
            if "duplicate key" in str(e).lower():
                raise Exception("Email already registered")
            log.error("create_user_failed", error=str(e))
            raise e

    async def get_user_by_email(self, email: str) -> Optional[dict]:
        if self.client is None:
            payload = self.local.read()
            user = next((item.copy() for item in payload["users"] if item.get("email") == email), None)
            return user
        try:
            response = self.client.table("users").select("*").eq("email", email).execute()
            if response.data:
                return response.data[0]
        except Exception as e:
            log.error("get_user_by_email_failed", error=str(e))
        return None

    async def get_user_by_id(self, user_id: str) -> Optional[dict]:
        if self.client is None:
            payload = self.local.read()
            user = next((item.copy() for item in payload["users"] if item.get("id") == user_id), None)
            return user
        try:
            response = self.client.table("users").select("*").eq("id", user_id).execute()
            if response.data:
                return response.data[0]
        except Exception as e:
            log.error("get_user_by_id_failed", error=str(e))
        return None

    async def list_all_users(self) -> list:
        if self.client is None:
            payload = self.local.read()
            return [self._sanitize_user(item) for item in payload["users"]]
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
        if self.client is None:
            payload = self.local.read()
            original = len(payload["users"])
            payload["users"] = [item for item in payload["users"] if item.get("id") != user_id]
            payload["progress"] = [
                item for item in payload["progress"] if item.get("userId") != user_id
            ]
            payload["user_data"] = [
                item for item in payload["user_data"] if item.get("user_id") != user_id
            ]
            self.local.write(payload)
            return len(payload["users"]) != original
        try:
            response = self.client.table("users").delete().eq("id", user_id).execute()
            return len(response.data) > 0
        except Exception as e:
            log.error("delete_user_failed", error=str(e))
            return False

    async def update_user_role(self, user_id: str, role: str) -> bool:
        if self.client is None:
            payload = self.local.read()
            updated = False
            for item in payload["users"]:
                if item.get("id") == user_id:
                    item["role"] = role
                    updated = True
                    break
            if updated:
                self.local.write(payload)
            return updated
        try:
            response = self.client.table("users").update({"role": role}).eq("id", user_id).execute()
            return len(response.data) > 0
        except Exception as e:
            log.error("update_user_role_failed", error=str(e))
            return False

    async def update_user_status(self, user_id: str, status: str) -> bool:
        normalized_status = (status or "").strip().lower()
        if normalized_status not in {"active", "inactive", "suspended"}:
            return False

        updates = {
            "status": normalized_status,
            "is_active": normalized_status == "active",
        }

        if self.client is None:
            payload = self.local.read()
            updated = False
            for item in payload["users"]:
                if item.get("id") == user_id:
                    item.update(updates)
                    updated = True
                    break
            if updated:
                self.local.write(payload)
            return updated

        try:
            response = self.client.table("users").update(updates).eq("id", user_id).execute()
            return len(response.data) > 0
        except Exception as e:
            log.error("update_user_status_failed", error=str(e))
            return False

    async def update_user_fields(self, user_id: str, updates: dict) -> bool:
        if self.client is None:
            updates = updates.copy()
            updates.pop("id", None)
            updates.pop("password", None)
            updates.pop("password_hash", None)
            updates.pop("email", None)

            payload = self.local.read()
            updated = False
            for item in payload["users"]:
                if item.get("id") == user_id:
                    item.update(updates)
                    updated = True
                    break
            if updated:
                self.local.write(payload)
            return updated
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
