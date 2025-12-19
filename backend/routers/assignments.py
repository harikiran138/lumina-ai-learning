from fastapi import APIRouter, HTTPException, Form, File, UploadFile, Depends
from typing import List, Optional
from store.assignment_store import AssignmentStore
from pydantic import BaseModel
import shutil
import os
import uuid
from .auth import get_current_user

router = APIRouter()
store = AssignmentStore()

UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

class AssignmentCreate(BaseModel):
    title: str
    course_id: str
    description: str
    due_date: str # ISO
    created_by: str = "teacher"

@router.post("/create")
async def create_assignment(
    title: str = Form(...),
    course_id: str = Form(...),
    description: str = Form(...),
    due_date: str = Form(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Create a new assignment definition. Requires Teacher role.
    """
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create assignments")
        
    try:
        assignment = store.create_assignment(title, course_id, description, due_date, created_by=current_user["id"])
        return {"status": "success", "assignment": assignment}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/submit")
async def submit_assignment(
    assignment_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    """
    Submit an assignment.
    """
    try:
        # Save the file
        file_ext = file.filename.split(".")[-1]
        file_name = f"{uuid.uuid4()}.{file_ext}"
        file_path = os.path.join(UPLOAD_DIR, file_name)
        
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        # Create submission record
        submission = store.submit_assignment(assignment_id, current_user["id"], file_path)
        return {"status": "success", "submission": submission}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

from app.services.ocr_service import ocr_service
from services.grader_service import grader_service

# ... (existing imports)

@router.post("/{assignment_id}/submissions/{submission_id}/grade")
async def grade_submission(assignment_id: str, submission_id: str):
    """
    Grade a submission using AI.
    """
    # 1. Get Submission
    submissions = store.get_submissions(assignment_id)
    submission = next((s for s in submissions if s["id"] == submission_id), None)
    
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # 2. Get Assignment for Rubric/Description
    assignments_list = store.list_assignments()
    assignment = next((a for a in assignments_list if a["id"] == assignment_id), None)
    
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    description = assignment.get("description", "")

    # 3. Perform OCR
    file_path = submission["file_path"]
    full_path = os.path.abspath(file_path)
    
    print(f"Processing OCR for: {full_path}")
    
    # Use asyncio.to_thread to run optimized OCR without blocking
    import asyncio
    # Note: digitize_image expects raw bytes or path, here passing path
    extracted_text = await asyncio.to_thread(ocr_service.digitize_image, full_path)
    
    # 4. Grade
    print(f"Grading submission against description...")
    # Use asyncio.to_thread for grading as well
    result = await asyncio.to_thread(grader_service.grade_submission, extracted_text, description)
    
    # Add OCR text to result for reference
    result["ocr_text"] = extracted_text

    # 5. Save Grade to DB
    store.update_submission_grade(submission_id, result["score"], result["feedback"], extracted_text)
    
    return result

@router.put("/{assignment_id}/submissions/{submission_id}/score")
async def update_submission_score(
    assignment_id: str, 
    submission_id: str,
    data: dict
):
    """
    Manually update/edit a submission score and feedback.
    """
    try:
        score = data.get("score")
        feedback = data.get("feedback")
        store.update_submission_grade(submission_id, score, feedback)
        return {"status": "success", "score": score, "feedback": feedback}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/list")
async def list_assignments(course_id: Optional[str] = None, student_id: Optional[str] = None):
    """
    List assignment definitions with submission counts and student status.
    """
    assignments = store.list_assignments(course_id)
    # Add submission count to each assignment
    results = []
    for a in assignments:
        submissions = store.get_submissions(a["id"])
        a_copy = a.copy()
        a_copy["submission_count"] = len(submissions)
        
        # Check if specific student has submitted
        if student_id:
            user_submission = store.get_student_submission(a["id"], student_id)
            if user_submission:
                a_copy["user_submission"] = user_submission
                
        results.append(a_copy)
    return results

@router.get("/{assignment_id}/submissions")
async def get_assignment_submissions(assignment_id: str):
    """
    Get all submissions for a specific assignment.
    """
    return store.get_submissions(assignment_id)
