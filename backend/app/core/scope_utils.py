from typing import Any, Dict, Optional
from fastapi import HTTPException
from app.database.supabase_manager import supabase_db

class ScopeManager:
    """
    Utility to apply institution and department filters to Supabase queries
    based on the current user's session.
    """
    
    @staticmethod
    def apply_college_scope(query: Any, current_user: dict) -> Any:
        role = current_user.get("role")
        if role == "super_admin":
            return query
            
        institution_id = current_user.get("institution_id") or current_user.get("college_id")
        if not institution_id:
            raise HTTPException(status_code=403, detail="No institution scope found for user")
            
        return query.eq("institution_id", institution_id)

    @staticmethod
    def apply_dept_scope(query: Any, current_user: dict) -> Any:
        role = current_user.get("role")
        # Admins see everything in the institution
        if role in {"super_admin", "college_admin", "admin"}:
            return ScopeManager.apply_college_scope(query, current_user)
            
        dept_id = current_user.get("department_id") or current_user.get("dept_id")
        if not dept_id:
            raise HTTPException(status_code=403, detail="No department scope found for user")
            
        # First ensure it's at least institution scoped
        query = ScopeManager.apply_college_scope(query, current_user)
        return query.eq("department_id", dept_id)

    @staticmethod
    def get_user_scope_filter(current_user: dict) -> Dict[str, Any]:
        """Returns a filter dict for manual query building."""
        role = current_user.get("role")
        if role == "super_admin":
            return {}
            
        institution_id = current_user.get("institution_id") or current_user.get("college_id")
        dept_id = current_user.get("department_id") or current_user.get("dept_id")
        
        filters = {}
        if institution_id:
            filters["institution_id"] = institution_id
        
        if role not in {"college_admin", "admin"} and dept_id:
            filters["department_id"] = dept_id
            
        return filters
