from fastapi import HTTPException, Request, Depends
from typing import List, Optional, Callable
from app.routers.auth import get_current_user
from app.database.supabase_manager import supabase_db

async def get_resource_college_id(table: str, resource_id: str) -> Optional[str]:
    """Helper to fetch the college_id associated with a database resource."""
    try:
        res = await supabase_db.fetch_one(table, {"id": resource_id})
        # Check both naming conventions (institution_id and college_id)
        return res.get("college_id") or res.get("institution_id") if res else None
    except Exception:
        return None

async def get_resource_dept_id(table: str, resource_id: str) -> Optional[str]:
    """Helper to fetch the department_id associated with a database resource."""
    try:
        res = await supabase_db.fetch_one(table, {"id": resource_id})
        # Check both naming conventions (department_id and dept_id)
        return res.get("department_id") or res.get("dept_id") if res else None
    except Exception:
        return None

def check_college_scope(resource_table: Optional[str] = None, id_param: Optional[str] = "id"):
    """
    Dependency that ensures the current user has access to the requested resource
    based on their college_id scope.
    """
    async def scope_checker(
        request: Request, 
        current_user: dict = Depends(get_current_user)
    ):
        user_role = current_user.get("role")
        user_college_id = current_user.get("institution_id") or current_user.get("college_id")

        # Super-admins bypass all scope checks
        if user_role == "super_admin":
            return current_user

        if not user_college_id:
            raise HTTPException(status_code=403, detail="User has no assigned college scope")

        # If a specific resource is being accessed, verify its college_id
        if resource_table:
            resource_id = request.path_params.get(id_param)
            if resource_id:
                res_college_id = await get_resource_college_id(resource_table, resource_id)
                if res_college_id and str(res_college_id) != str(user_college_id):
                    raise HTTPException(
                        status_code=403, 
                        detail=f"Resource {resource_id} in {resource_table} is outside of your college scope"
                    )

        return current_user
    
    return scope_checker

def check_dept_scope(resource_table: Optional[str] = None, id_param: Optional[str] = "id"):
    """
    Dependency that ensures the current HOD/Faculty has access to the requested resource
    based on their department scope.
    """
    async def scope_checker(
        request: Request, 
        current_user: dict = Depends(get_current_user)
    ):
        user_role = current_user.get("role")
        user_dept_id = current_user.get("department_id") or current_user.get("dept_id")

        # Roles above HOD bypass department scope checks (but should be college scoped)
        if user_role in {"super_admin", "college_admin", "admin"}:
            return current_user

        if not user_dept_id:
            raise HTTPException(status_code=403, detail="User has no assigned department scope")

        # If a specific resource is being accessed, verify its department_id
        if resource_table:
            resource_id = request.path_params.get(id_param)
            if resource_id:
                res_dept_id = await get_resource_dept_id(resource_table, resource_id)
                if res_dept_id and str(res_dept_id) != str(user_dept_id):
                    raise HTTPException(
                        status_code=403, 
                        detail=f"Resource {resource_id} in {resource_table} is outside of your department scope"
                    )

        return current_user
    
    return scope_checker

def require_roles(allowed_roles: List[str]):
    """
    Dependency to enforce specific role memberships.
    """
    async def role_checker(current_user: dict = Depends(get_current_user)):
        user_role = current_user.get("role")
        # Map legacy role names for compatibility
        normalized_role = user_role
        if user_role == "admin": normalized_role = "super_admin"
        if user_role == "teacher": normalized_role = "faculty"

        if normalized_role not in allowed_roles and normalized_role != "super_admin":
            raise HTTPException(
                status_code=403, 
                detail=f"Role(s) {allowed_roles} required. Current: {user_role}"
            )
        return current_user
    return role_checker
