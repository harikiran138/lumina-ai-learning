from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from app.api.deps import get_current_hod
from app.dependencies import get_academic_store, get_teacher_store
from app.store.academic_store import AcademicStore
from app.store.teacher_store import TeacherStore

router = APIRouter()
@router.get("/dashboard")
async def get_hod_dashboard(
    current_user: dict = Depends(get_current_hod),
    academic_store: AcademicStore = Depends(get_academic_store),
    teacher_store: TeacherStore = Depends(get_teacher_store)
):
    department_id = current_user["resolved_department_id"]
    dept = await academic_store.get_department_by_id(department_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")

    # Aggregate dashboard data
    teachers = await academic_store.get_department_teachers(department_id)
    programs = await academic_store.get_department_programs(department_id)
    students = await academic_store.get_department_students(department_id)
    requests = await teacher_store.get_pending_requests_by_department(department_id)

    # Standardized structure
    return {
        "stats": [
            {"label": "Total Students", "value": str(len(students)), "trend": "Stable", "icon": "Users"},
            {"label": "Dep. Teachers", "value": str(len(teachers)), "trend": "Consistent", "icon": "GraduationCap"},
            {"label": "Programs", "value": str(len(programs)), "trend": "Active", "icon": "BookOpen"},
            {"label": "Pending Requests", "value": str(len(requests)), "trend": "Action Required", "icon": "ClipboardCheck"},
        ],
        "alerts": [
            {
                "id": str(r.get("id")),
                "type": "request",
                "title": f"Approval Needed: {r.get('teacher_name', 'Teacher Request')}",
                "description": f"Request for {r.get('program_name', 'Teaching Program')}",
                "priority": "high",
            }
            for r in requests[:5]
        ],
        "charts": {
            "departmentPerformance": [
                {"program": p.get("name"), "mastery": 75} # Example data
                for p in programs[:5]
            ]
        },
        "feed": [
            {
                "id": str(r.get("id")),
                "type": "request_update",
                "title": "New Teacher Request",
                "time": r.get("created_at"),
                "meta": {"teacher_id": r.get("teacher_id")}
            }
            for r in requests[:5]
        ],
        "meta": {
            "department": dept,
            "teachers": teachers,
            "programs": programs,
        }
    }

@router.get("/department")
async def get_hod_department(
    current_user: dict = Depends(get_current_hod),
    academic_store: AcademicStore = Depends(get_academic_store)
):
    department_id = current_user["resolved_department_id"]
    dept = await academic_store.get_department_by_id(department_id)
    if not dept:
        raise HTTPException(status_code=404, detail="Department not found")
    return dept

@router.get("/teachers")
async def get_department_teachers(
    current_user: dict = Depends(get_current_hod),
    academic_store: AcademicStore = Depends(get_academic_store)
):
    department_id = current_user["resolved_department_id"]
    return await academic_store.get_department_teachers(department_id)

@router.get("/programs")
async def get_department_programs(
    current_user: dict = Depends(get_current_hod),
    academic_store: AcademicStore = Depends(get_academic_store)
):
    department_id = current_user["resolved_department_id"]
    return await academic_store.get_department_programs(department_id)

@router.get("/requests")
async def get_department_teacher_requests(
    current_user: dict = Depends(get_current_hod),
    teacher_store: TeacherStore = Depends(get_teacher_store)
):
    department_id = current_user["resolved_department_id"]
    return await teacher_store.get_pending_requests_by_department(department_id)

@router.patch("/requests/{request_id}")
async def update_teacher_request(
    request_id: str,
    payload: Dict[str, str],
    current_user: dict = Depends(get_current_hod),
    teacher_store: TeacherStore = Depends(get_teacher_store)
):
    department_id = current_user["resolved_department_id"]
    
    status = payload.get("status")
    if status not in {"APPROVED", "REJECTED"}:
        raise HTTPException(status_code=400, detail="Invalid status")
    
    # Verify request belongs to this department
    request = await teacher_store.db.fetch_one("teacher_requests", {"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Request not found")
        
    teacher = await teacher_store.db.fetch_one("users", {"id": request["teacher_id"]})
    if not teacher or teacher.get("department_id") != department_id:
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
