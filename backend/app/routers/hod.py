from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from .auth import get_current_user
from app.store.academic_store import AcademicStore
from app.store.teacher_store import TeacherStore

router = APIRouter()
academic_store = AcademicStore()
teacher_store = TeacherStore()

def check_hod_role(user: dict):
    if user.get("role") not in {"hod", "admin"}:
        raise HTTPException(status_code=403, detail="HOD access required")

@router.get("/department")
async def get_hod_department(current_user: dict = Depends(get_current_user)):
    check_hod_role(current_user)
    dept_id = current_user.get("department_id")
    if not dept_id:
        # Try to find by HOD ID if not in token
        dept = await academic_store.get_department_by_hod(str(current_user["id"]))
        if not dept:
            raise HTTPException(status_code=404, detail="Department not found for this HOD")
        return dept
    
    dept = await academic_store.get_department_by_id(dept_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept

@router.get("/teachers")
async def get_department_teachers(current_user: dict = Depends(get_current_user)):
    check_hod_role(current_user)
    dept = await get_hod_department(current_user)
    return await academic_store.get_department_teachers(dept["id"])

@router.get("/programs")
async def get_department_programs(current_user: dict = Depends(get_current_user)):
    check_hod_role(current_user)
    dept = await get_hod_department(current_user)
    return await academic_store.get_department_programs(dept["id"])

@router.get("/requests")
async def get_department_teacher_requests(current_user: dict = Depends(get_current_user)):
    check_hod_role(current_user)
    dept = await get_hod_department(current_user)
    return await teacher_store.get_pending_requests_by_department(dept["id"])

@router.patch("/requests/{request_id}")
async def update_teacher_request(
    request_id: str,
    payload: Dict[str, str],
    current_user: dict = Depends(get_current_user)
):
    check_hod_role(current_user)
    dept = await get_hod_department(current_user)
    
    status = payload.get("status")
    if status not in {"APPROVED", "REJECTED"}:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    # Verify request belongs to this department
    request = await teacher_store.db.fetch_one("teacher_requests", {"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
        
    teacher = await teacher_store.db.fetch_one("users", {"id": request["teacher_id"]})
    if not teacher or teacher.get("department_id") != dept["id"]:
        raise HTTPException(status_code=403, detail="Not authorized to act on this request")
    
    if request.get("status") != "PENDING_HOD":
        raise HTTPException(status_code=400, detail="Request is not pending HOD approval")

    if status == "APPROVED":
        success = await teacher_store.approve_request_by_hod(request_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to approve request")
        return {"status": "PENDING_ADMIN"}
    else:
        success = await teacher_store.reject_request_by_hod(request_id)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to reject request")
        return {"status": "REJECTED"}
