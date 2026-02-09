from fastapi import APIRouter, HTTPException, Form, File, UploadFile, Depends
from typing import Optional
from app.store.assignment_store import AssignmentStore
from pydantic import BaseModel
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
    due_date: str  # ISO
    created_by: str = "teacher"


@router.post("/create")
async def create_assignment(
    title: str = Form(...),
    course_id: str = Form(...),
    description: str = Form(...),
    due_date: str = Form(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Create a new assignment definition. Requires Teacher role.
    """
    if current_user["role"] != "teacher":
        raise HTTPException(status_code=403, detail="Only teachers can create assignments")

    try:
        assignment = await store.create_assignment(
            title, course_id, description, due_date, created_by=current_user["id"]
        )
        return {"status": "success", "assignment": assignment}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/submit")
async def submit_assignment(
    assignment_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
):
    """
    Submit an assignment.
    """
    try:
        # Save the file using Storage Service (S3 or Local)
        from app.services.storage import storage_service

        file_ext = file.filename.split(".")[-1]
        file_name = f"{uuid.uuid4()}.{file_ext}"

        # Returns either local path or s3:// key
        file_path = storage_service.upload_file(file, file_name)

        # Create submission record
        submission = await store.submit_assignment(assignment_id, current_user["id"], file_path)
        return {"status": "success", "submission": submission}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


# ... (existing imports)


@router.post("/{assignment_id}/submissions/{submission_id}/grade")
async def grade_submission(assignment_id: str, submission_id: str):
    """
    Grade a submission using AI.
    """
    # 1. Get Submission
    submissions = await store.get_submissions(assignment_id)
    submission = next((s for s in submissions if s["id"] == submission_id), None)

    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    # 2. Get Assignment for Rubric/Description
    assignments_list = await store.list_assignments()
    assignment = next((a for a in assignments_list if a["id"] == assignment_id), None)

    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    description = assignment.get("description", "")

    # 3. Dispatch Async Task
    # We no longer wait for OCR/Grading here. We return "Accepted" immediately.
    from app.worker import task_grade_submission

    # Pass file_path (which is either local path or s3:// key)
    # The worker will handle downloading.
    print(f"Dispatching grading task for {submission['id']}")

    task = task_grade_submission.delay(
        assignment_id, submission_id, description, submission["file_path"]
    )

    return {
        "status": "accepted",
        "message": "Grading queued",
        "task_id": task.id,
        "submission_id": submission_id,
    }


@router.put("/{assignment_id}/submissions/{submission_id}/score")
async def update_submission_score(assignment_id: str, submission_id: str, data: dict):
    """
    Manually update/edit a submission score and feedback.
    """
    try:
        score = data.get("score")
        feedback = data.get("feedback")
        await store.update_submission_grade(submission_id, score, feedback)
        return {"status": "success", "score": score, "feedback": feedback}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/list")
async def list_assignments(course_id: Optional[str] = None, student_id: Optional[str] = None):
    """
    List assignment definitions with submission counts and student status.
    """
    assignments = await store.list_assignments(course_id)
    # Add submission count to each assignment
    results = []
    for a in assignments:
        submissions = await store.get_submissions(a["id"])
        a_copy = a.copy()
        a_copy["submission_count"] = len(submissions)

        # Check if specific student has submitted
        if student_id:
            user_submission = await store.get_student_submission(a["id"], student_id)
            if user_submission:
                a_copy["user_submission"] = user_submission

        results.append(a_copy)
    return results


@router.get("/{assignment_id}/submissions")
async def get_assignment_submissions(assignment_id: str):
    """
    Get all submissions for a specific assignment.
    """
    return await store.get_submissions(assignment_id)


@router.get("/{assignment_id}/analytics")
async def get_assignment_analytics(assignment_id: str):
    """Return basic analytics for an assignment (scores, counts, averages)."""
    submissions = await store.get_submissions(assignment_id)
    if not submissions:
        return {
            "assignment_id": assignment_id,
            "submission_count": 0,
            "graded_count": 0,
            "ungraded_count": 0,
            "avg_grade": None,
            "min_grade": None,
            "max_grade": None,
        }

    grades = [s.get("grade") for s in submissions if s.get("grade") is not None]
    graded_count = len(grades)
    ungraded_count = len(submissions) - graded_count

    if grades:
        avg_grade = sum(grades) / len(grades)
        min_grade = min(grades)
        max_grade = max(grades)
    else:
        avg_grade = min_grade = max_grade = None

    return {
        "assignment_id": assignment_id,
        "submission_count": len(submissions),
        "graded_count": graded_count,
        "ungraded_count": ungraded_count,
        "avg_grade": avg_grade,
        "min_grade": min_grade,
        "max_grade": max_grade,
    }


@router.get("/{assignment_id}/submissions/{submission_id}/report")
async def get_submission_report(assignment_id: str, submission_id: str):
    """Detailed report for a single submission (score, feedback, OCR text)."""
    # Get assignment and submission
    assignment = await store.get_assignment(assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    submissions = await store.get_submissions(assignment_id)
    submission = next((s for s in submissions if s["id"] == submission_id), None)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    grade = submission.get("grade")
    feedback = submission.get("feedback")
    ocr_text = submission.get("ocr_text")

    # Derive simple level label from numeric grade if present (0–100 assumed)
    level = None
    if isinstance(grade, (int, float)):
        if grade < 40:
            level = "weak"
        elif grade < 70:
            level = "developing"
        else:
            level = "strong"

    return {
        "assignment": {
            "id": assignment.get("id"),
            "title": assignment.get("title"),
            "course_id": assignment.get("course_id"),
            "description": assignment.get("description"),
            "due_date": assignment.get("due_date"),
        },
        "submission": {
            "id": submission.get("id"),
            "student_id": submission.get("student_id"),
            "submitted_at": submission.get("submitted_at"),
            "status": submission.get("status"),
        },
        "score": grade,
        "level": level,
        "feedback": feedback,
        "ocr_text": ocr_text,
    }
