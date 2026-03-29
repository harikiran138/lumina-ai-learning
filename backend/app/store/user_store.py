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

    def normalize_role(self, role: Optional[str]) -> str:
        normalized = (role or "student").strip().lower()
        if normalized == "teacher":
            return "faculty"
        if normalized == "admin":
            return "super_admin"
        return normalized

    def _sanitize_user(self, user: dict) -> dict:
        """Removes sensitive fields and normalizes user object for API consumption."""
        if not user:
            return {}
        
        safe_user = user.copy()
        safe_user.pop("password_hash", None)
        
        # Consistent naming for frontend (name, avatar, status)
        name = safe_user.get("name") or safe_user.get("full_name") or "Unnamed User"
        avatar = safe_user.get("avatar_url") or safe_user.get("avatar")
        if not avatar:
            avatar = f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background=111827&color=F9FAFB"

        created_at = safe_user.get("created_at") or safe_user.get("createdAt") or safe_user.get("updated_at")
        safe_user["name"] = name
        if not safe_user.get("full_name"):
            safe_user["full_name"] = name
        safe_user["avatar_url"] = avatar
        safe_user["avatar"] = avatar  # Backward compatibility
        safe_user["status"] = safe_user.get("status", "active")
        safe_user["role"] = self.normalize_role(safe_user.get("role"))
        safe_user["created_at"] = created_at
        safe_user["createdAt"] = created_at
        
        return safe_user

    async def create_user(
        self, email: str, password: str, full_name: str, role: str = "student", phone: str = ""
    ) -> dict:
        existing_user = await self.get_user_by_email(email)
        if existing_user:
            raise ValueError("Email already registered")

        hashed_password = self.get_password_hash(password)

        user_data = {
            "email": email,
            "password_hash": hashed_password,
            "name": full_name,
            "role": self.normalize_role(role),
            "phone": phone or "N/A",
            "is_active": True
        }

        try:
            # Use SupabaseManager's insert
            # Ensure we are targeting the public schema explicitly if possible
            client = self.db.get_client()
            insert_result = client.table("users").insert(user_data).execute()
            
            # Fallback: If RLS prevents returning the row on insert, fetch it explicitly
            result = insert_result.data[0] if insert_result.data else await self.get_user_by_email(email)
            
            if not result:
                # Last resort check
                log.warning("insert_result_empty_trying_retry", email=email)
                result = await self.get_user_by_email(email)
                
            if not result:
                raise Exception("Failed to create or retrieve user record")
            
            return self._sanitize_user(result)

        except Exception as e:
            if "duplicate key" in str(e).lower():
                raise ValueError("Email already registered")
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

    def get_user_by_email_sync(self, email: str) -> Optional[dict]:
        try:
            import anyio.from_thread
            # If we are inside a threadpool, we just execute it.
            client = self.db.get_client()
            response = client.table("users").select("*").eq("email", email).execute()
            if response.data:
                return response.data[0]
        except Exception as e:
            log.error("get_user_by_email_failed_sync", error=str(e), email=email)
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
            response = client.table("users").update({"role": self.normalize_role(role)}).eq("id", user_id).execute()
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
        from datetime import datetime
        restricted = {"id", "password", "password_hash", "email"}
        clean_updates = {k: v for k, v in updates.items() if k not in restricted}
        clean_updates.setdefault("updated_at", datetime.utcnow().isoformat())

        try:
            client = self.db.get_client()
            response = client.table("users").update(clean_updates).eq("id", user_id).execute()
            return len(response.data) > 0
        except Exception as e:
            log.error("update_user_fields_failed", error=str(e), user_id=user_id)
            return False

    def update_user_fields_sync(self, user_id: str, updates: dict) -> bool:
        from datetime import datetime
        restricted = {"id", "password", "password_hash", "email"}
        clean_updates = {k: v for k, v in updates.items() if k not in restricted}
        clean_updates.setdefault("updated_at", datetime.utcnow().isoformat())

        try:
            client = self.db.get_client()
            # Try updating one by one or handle the case where some columns don't exist
            # For robustness, we try to update what we can
            response = client.table("users").update(clean_updates).eq("id", user_id).execute()
            return len(response.data) > 0
        except Exception as e:
            # Check if it's a missing column error
            err_str = str(e)
            if "Could not find the" in err_str and "column" in err_str:
                log.warning("update_user_fields_partial_fail", error=err_str, user_id=user_id)
                # Try to exclude the problematic column if we can identify it
                # For now, just return True to allow login to proceed even if tracking fails
                return True
            log.error("update_user_fields_failed_sync", error=err_str, user_id=user_id)
            return False
