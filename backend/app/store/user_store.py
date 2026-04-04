from typing import Optional, List, Any
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

    def __init__(self, db: Optional[Any] = None):
        # Allow injecting a scoped database, otherwise fall back to global supabase_db
        self.db = db or supabase_db

    def verify_password(self, plain_password, hashed_password):
        return verify_password(plain_password, hashed_password)

    def get_password_hash(self, password):
        return get_password_hash(password)

    def normalize_role(self, role: Optional[str]) -> str:
        from app.core.rbac import normalize_role as _normalize
        return _normalize(role)

    def _sanitize_user(self, user: dict, include_sensitive: bool = False) -> dict:
        """Normalizes a user object while only retaining secrets for internal auth flows."""
        if not user:
            return {}
        
        safe_user = user.copy()
        
        # Ensure ID is always present (critical for mocks and RLS fallbacks)
        if not safe_user.get("id"):
            safe_user["id"] = str(uuid.uuid4())
            log.debug("user_id_generated_fallback", email=safe_user.get("email"))

        password_hash = safe_user.get("password_hash") or safe_user.get("hashed_password")
        if not include_sensitive:
            safe_user.pop("password_hash", None)
            safe_user.pop("hashed_password", None)
        
        # Consistent naming for frontend (name, avatar, status)
        name = safe_user.get("name") or safe_user.get("full_name") or "Unnamed User"
        avatar = safe_user.get("profile_photo_url") or safe_user.get("avatar_url") or safe_user.get("avatar") or safe_user.get("profile_image")
        
        if not avatar:
            avatar = f"https://ui-avatars.com/api/?name={name.replace(' ', '+')}&background=111827&color=F9FAFB"
        
        # Date normalization
        created_at = safe_user.get("created_at") or safe_user.get("createdAt") or safe_user.get("updated_at")
        
        # Merge fields for consistency
        safe_user["name"] = name
        safe_user["full_name"] = name
        safe_user["avatar_url"] = avatar
        safe_user["profile_photo_url"] = avatar
        safe_user["status"] = safe_user.get("status", "active")
        
        # Role Resolution
        roles_data = safe_user.get("user_roles")
        primary_role = None
        if roles_data and isinstance(roles_data, list) and len(roles_data) > 0:
            role_entry = roles_data[0]
            if isinstance(role_entry, dict):
                # Handle both direct "roles" dict and flat "role_name" structure
                nested_roles = role_entry.get("roles")
                if isinstance(nested_roles, dict):
                    primary_role = nested_roles.get("name")
                elif "role_name" in role_entry:
                    primary_role = role_entry["role_name"]

        # Final role mapping fallback
        canonical_role = self.normalize_role(primary_role or safe_user.get("role"))
        safe_user["role"] = canonical_role
        safe_user["created_at"] = created_at
        safe_user["createdAt"] = created_at
        
        # Ensure institutional fields are present
        safe_user["college_id"] = safe_user.get("college_id")
        safe_user["dept_id"] = safe_user.get("dept_id") or safe_user.get("department_id")
        safe_user["batch_id"] = safe_user.get("batch_id")
        safe_user["onboarding_step"] = safe_user.get("onboarding_step", 0)
        safe_user["must_change_password"] = safe_user.get("must_change_password", False)
        
        if include_sensitive and password_hash:
            safe_user["password_hash"] = password_hash
        
        return safe_user

    async def create_user(
        self, email: str, password: str, full_name: str, role: str = "student", 
        phone: str = "", college_id: str = None, dept_id: str = None, 
        batch_id: str = None, roll_number: str = None, employee_id: str = None
    ) -> dict:
        existing_user = await self.get_user_by_email(email)
        if existing_user:
            raise ValueError("Email already registered")

        hashed_password = self.get_password_hash(password)

        user_data = {
            "id": str(uuid.uuid4()),
            "email": email,
            "password_hash": hashed_password,
            "name": full_name,
            "full_name": full_name,
            "role": self.normalize_role(role),
            "phone": phone or "N/A",
            "is_active": True,
            "college_id": college_id,
            "dept_id": dept_id,
            "batch_id": batch_id,
            "roll_number": roll_number,
            "employee_id": employee_id,
            "onboarding_step": 0
        }

        try:
            insert_result = await self.db.table("users").insert(user_data).async_execute()
            
            # Fallback: If RLS prevents returning the row on insert, fetch it explicitly
            result = insert_result.data[0] if insert_result.data else await self.get_user_by_email(email)
            
            if not result:
                log.warning("insert_result_empty_trying_retry", email=email)
                result = await self.get_user_by_email(email)
                
            if not result:
                raise Exception("Failed to create or retrieve user record")
            
            return self._sanitize_user(result)

        except Exception as e:
            err_str = str(e)
            if "duplicate key" in err_str.lower():
                raise ValueError("Email already registered")
            
            # PGRST204: Missing column error (e.g. batch_id missing in DB)
            if "Could not find the" in err_str and "column" in err_str:
                import re as _re
                col_match = _re.search(r"Could not find the '([^']+)' column", err_str)
                if col_match:
                    missing_col = col_match.group(1)
                    log.warning("create_user_column_missing_retrying", missing_column=missing_col, email=email)
                    # Remove the missing column and retry once
                    del user_data[missing_col]
                    return await self.create_user_from_dict(user_data)

            log.error("create_user_failed", error=err_str, email=email)
            raise e

    async def create_user_from_dict(self, user_data: dict) -> dict:
        """Internal helper for resilient user creation."""
        try:
            insert_result = await self.db.table("users").insert(user_data).async_execute()
            result = insert_result.data[0] if insert_result.data else await self.get_user_by_email(user_data["email"])
            if not result:
                result = await self.get_user_by_email(user_data["email"])
            if not result:
                raise Exception("Failed to create user record on retry")
            return self._sanitize_user(result)
        except Exception as e:
            err_str = str(e)
            # Second failure: maybe another column is missing? Apply same logic once more.
            if "Could not find the" in err_str and "column" in err_str:
                import re as _re
                col_match = _re.search(r"Could not find the '([^']+)' column", err_str)
                if col_match:
                    missing_col = col_match.group(1)
                    log.warning("create_user_second_column_missing", missing_column=missing_col)
                    data_copy = user_data.copy()
                    if missing_col in data_copy:
                        del data_copy[missing_col]
                        # Final recursive attempt
                        return await self.create_user_from_dict(data_copy)
            raise e

    async def get_user_by_email(self, email: str, include_sensitive: bool = False) -> Optional[dict]:
        try:
            response = await self.db.table("users").select("*").eq("email", email).async_execute()
            if response.data:
                return self._sanitize_user(response.data[0], include_sensitive=include_sensitive)
        except Exception as e:
            log.error("get_user_by_email_failed", error=str(e), email=email)
        return None

    def get_user_by_email_sync(self, email: str, include_sensitive: bool = False) -> Optional[dict]:
        try:
            response = self.db.table("users").select("*").eq("email", email).execute()
            if response.data:
                return self._sanitize_user(response.data[0], include_sensitive=include_sensitive)
        except Exception as e:
            log.error("get_user_by_email_failed_sync", error=str(e), email=email)
        return None

    async def get_user_by_id(self, user_id: str, include_sensitive: bool = False) -> Optional[dict]:
        response = await self.db.table("users").select("*").eq("id", user_id).async_execute()
        if response.data:
            return self._sanitize_user(response.data[0], include_sensitive=include_sensitive)
        return None

    async def list_all_users(self) -> List[dict]:
        try:
            users = await self.db.fetch_all("users", limit=500)
            return [self._sanitize_user(u) for u in users]
        except Exception as e:
            log.error("list_all_users_failed", error=str(e))
            return []

    async def delete_user(self, user_id: str) -> bool:
        """
        Deletes a user and manually cascades to related tables to prevent orphan records.
        """
        try:
            client = self.db.get_client() if hasattr(self.db, "get_client") else self.db
            
            # 1. Clean up user_data
            await client.table("user_data").delete().eq("id", user_id).async_execute()
            await client.table("user_data").delete().eq("user_id", user_id).async_execute()

            # 2. Clean up enrollments / progress
            await client.table("enrollments").delete().eq("student_id", user_id).async_execute()
            await client.table("student_enrollments").delete().eq("student_id", user_id).async_execute()
            await client.table("student_progress").delete().eq("student_id", user_id).async_execute()

            # 3. Clean up sessions
            await client.table("assessment_sessions").delete().eq("student_id", user_id).async_execute()

            # 4. Clean up stakeholders/connections
            await client.table("stakeholders").delete().eq("user_id", user_id).async_execute()

            # 5. Final user deletion
            result = await client.table("users").delete().eq("id", user_id).async_execute()
            return len(result.data) > 0
        except Exception as e:
            log.error("delete_user_cascade_failed", error=str(e), user_id=user_id)
            try:
                # Fallback to basic delete
                return await self.db.delete("users", {"id": user_id})
            except Exception:
                return False

    async def update_user_role(self, user_id: str, role: str) -> bool:
        try:
            response = await self.db.table("users").update({"role": self.normalize_role(role)}).eq("id", user_id).async_execute()
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
            response = await self.db.table("users").update(updates).eq("id", user_id).async_execute()
            return len(response.data) > 0
        except Exception as e:
            log.error("update_user_status_failed", error=str(e), user_id=user_id)
            return False

    async def update_user_fields(self, user_id: str, updates: dict) -> bool:
        from datetime import datetime
        restricted = {"id", "password", "password_hash", "email"}
        valid_columns = {
            "name",
            "full_name",
            "first_name",
            "last_name",
            "role",
            "phone",
            "is_active",
            "status",
            "college_id",
            "dept_id",
            "department_id",
            "batch_id",
            "section",
            "roll_number",
            "student_roll",
            "employee_id",
            "onboarding_step",
            "must_change_password",
            "updated_at",
            "created_at",
            "profile_photo_url",
            "avatar_url",
            "dob",
            "gender",
            "emergency_contact",
            "parent_email",
        }
        clean_updates = {k: v for k, v in updates.items() if k not in restricted and k in valid_columns}
        clean_updates.setdefault("updated_at", datetime.utcnow().isoformat())

        try:
            response = await self.db.table("users").update(clean_updates).eq("id", user_id).async_execute()
            updated = len(response.data) > 0
            if not updated:
                # PostgREST may return empty data when Prefer: return=representation
                # header is absent; treat as success unless we can verify otherwise.
                log.debug("update_user_fields_no_rows_returned", user_id=user_id, fields=list(clean_updates.keys()))
            return True
        except Exception as e:
            err_str = str(e)
            if "Could not find the" in err_str and "column" in err_str:
                import re as _re
                col_match = _re.search(r"Could not find the '([^']+)' column", err_str)
                if col_match:
                    missing_col = col_match.group(1)
                    log.warning("update_user_fields_column_missing_retrying", missing_column=missing_col, user_id=user_id)
                    # Create a copy and remove problematic field
                    safe_updates = clean_updates.copy()
                    if missing_col in safe_updates:
                        del safe_updates[missing_col]
                        # Retry once without the missing column
                        if safe_updates:
                            return await self.update_user_fields(user_id, safe_updates)
                        return True # Nothing left to update, but we didn't crash
            
            log.error("update_user_fields_failed", error=err_str, user_id=user_id)
            return False

    def update_user_fields_sync(self, user_id: str, updates: dict) -> bool:
        from datetime import datetime
        restricted = {"id", "password", "password_hash", "email"}
        valid_columns = {
            "name",
            "full_name",
            "first_name",
            "last_name",
            "role",
            "phone",
            "is_active",
            "status",
            "college_id",
            "dept_id",
            "department_id",
            "batch_id",
            "section",
            "roll_number",
            "student_roll",
            "employee_id",
            "onboarding_step",
            "must_change_password",
            "updated_at",
            "created_at",
            "profile_photo_url",
            "avatar_url",
            "dob",
            "gender",
            "emergency_contact",
            "parent_email",
        }
        clean_updates = {k: v for k, v in updates.items() if k not in restricted and k in valid_columns}
        clean_updates.setdefault("updated_at", datetime.utcnow().isoformat())

        try:
            response = self.db.table("users").update(clean_updates).eq("id", user_id).execute()
            return True
        except Exception as e:
            err_str = str(e)
            if "Could not find the" in err_str and "column" in err_str:
                import re as _re
                col_match = _re.search(r"Could not find the '([^']+)' column", err_str)
                if col_match:
                    missing_col = col_match.group(1)
                    log.warning("update_user_fields_sync_column_missing_retrying", missing_column=missing_col, user_id=user_id)
                    safe_updates = clean_updates.copy()
                    if missing_col in safe_updates:
                        del safe_updates[missing_col]
                        if safe_updates:
                            return self.update_user_fields_sync(user_id, safe_updates)
                        return True
            log.error("update_user_fields_failed_sync", error=err_str, user_id=user_id)
            return False
