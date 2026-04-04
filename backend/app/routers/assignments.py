from fastapi import APIRouter, HTTPException, Form, File, UploadFile, Depends
from typing import Optional
from app.store.assignment_store import AssignmentStore
from app.store.course_store import CourseStore
from app.store.personalization_store import PersonalizationStore
from app.store.user_store import UserStore
from pydantic import BaseModel
import os
import uuid
from app.dependencies import get_assignment_store, get_course_store, get_personalization_store
from .auth import get_current_user

UPLOAD_DIR = "data/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

router = APIRouter()


class AssignmentCreate(BaseModel):
    title: str
    course_id: str
    description: str
    due_date: str  # ISO
    created_by: str = "teacher"


class GradeSubmissionRequest(BaseModel):
    grade: Optional[float] = None
    score: Optional[float] = None
    feedback: Optional[str] = None


@router.post("/create")
async def create_assignment(
    title: str = Form(...),
    course_id: str = Form(...),
    description: str = Form(...),
    due_date: str = Form(...),
    current_user: dict = Depends(get_current_user),
    store: AssignmentStore = Depends(get_assignment_store),
):
    """
    Create a new assignment definition. Requires Teacher role.
    """
    if current_user["role"] not in {"teacher", "faculty", "admin", "hod"}:
        raise HTTPException(status_code=403, detail="Only teachers can create assignments")

    try:
        assignment = await store.create_assignment(
            title,
            course_id,
            description,
            due_date,
            created_by=current_user["id"],
        )
        return {"status": "success", "assignment": assignment}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/submit")
async def submit_assignment(
    assignment_id: str = Form(...),
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user),
    store: AssignmentStore = Depends(get_assignment_store),
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
async def grade_submission(
    assignment_id: str, 
    submission_id: str,
    data: Optional[GradeSubmissionRequest] = None,
    current_user: dict = Depends(get_current_user),
    store: AssignmentStore = Depends(get_assignment_store),
    personalization_store: PersonalizationStore = Depends(get_personalization_store),
):
    """
    Grade a submission.

    Supports two modes:
    - Manual grading when `grade` or `score` is provided in the JSON body.
    - AI grading fallback when no manual score is supplied.
    """
    if current_user["role"] not in {"teacher", "faculty", "admin", "hod"}:
        raise HTTPException(status_code=403, detail="Only teachers can grade submissions")

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

    manual_score = None
    if data is not None:
        manual_score = data.score if data.score is not None else data.grade

    if manual_score is not None:
        feedback = data.feedback or "Graded by faculty"
        success = await store.update_submission_grade(submission_id, manual_score, feedback)
        if not success:
            raise HTTPException(status_code=500, detail="Failed to save submission grade")
        return {
            "status": "graded",
            "submission_id": submission_id,
            "score": manual_score,
            "feedback": feedback,
        }

    description = assignment.get("description", "")

    # 3. Dispatch Async Task
    # We prefer async grading, but fall back to synchronous execution if the
    # worker broker is unavailable in local/demo environments.
    from app.worker import task_grade_submission

    rubric = await personalization_store.get_rubric(assignment_id)
    rubric_payload = rubric.model_dump(mode="json") if rubric else None

    # Pass file_path (which is either local path or s3:// key)
    # The worker will handle downloading.
    print(f"Dispatching grading task for {submission['id']}")

    try:
        task = task_grade_submission.delay(
            assignment_id, submission_id, description, submission["file_path"], rubric_payload
        )

        return {
            "status": "accepted",
            "message": "Grading queued",
            "task_id": task.id,
            "submission_id": submission_id,
        }
    except Exception:
        result = task_grade_submission.run(
            assignment_id, submission_id, description, submission["file_path"], rubric_payload
        )
        if result.get("status") != "success":
            raise HTTPException(status_code=500, detail=result.get("error") or "Grading failed")
        return {
            "status": "graded",
            "submission_id": submission_id,
            "score": result.get("score"),
            "message": "Graded synchronously",
        }


@router.put("/{assignment_id}/submissions/{submission_id}/score")
async def update_submission_score(
    assignment_id: str, 
    submission_id: str, 
    data: dict,
    store: AssignmentStore = Depends(get_assignment_store),
):
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
async def list_assignments(
    course_id: Optional[str] = None, 
    student_id: Optional[str] = None,
    store: AssignmentStore = Depends(get_assignment_store),
    course_store: CourseStore = Depends(get_course_store),
):
    """
    List assignment definitions with submission counts and student status.
    """
    assignments = await store.list_assignments(course_id)
    course_lookup = {}
    for course in await course_store.list_courses():
        course_lookup[str(course.get("id"))] = course
        if course.get("code"):
            course_lookup[str(course.get("code"))] = course

    # Add submission count to each assignment
    results = []
    for a in assignments:
        submissions = await store.get_submissions(a["id"])
        a_copy = a.copy()
        a_copy["submission_count"] = len(submissions)
        course = course_lookup.get(str(a_copy.get("course_id")))
        if course:
            a_copy["course_name"] = course.get("title") or course.get("name")

        # Check if specific student has submitted
        if student_id:
            user_submission = await store.get_student_submission(a["id"], student_id)
            if user_submission:
                a_copy["user_submission"] = user_submission

        results.append(a_copy)
    return results


@router.get("/{assignment_id}/submissions")
async def get_assignment_submissions(
    assignment_id: str,
    store: AssignmentStore = Depends(get_assignment_store),
):
    """
    Get all submissions for a specific assignment.
    """
    submissions = await store.get_submissions(assignment_id)
    if not submissions:
        return []

    user_store = UserStore()
    student_lookup = {}

    for submission in submissions:
        student_id = submission.get("student_id")
        if not student_id or student_id in student_lookup:
            continue
        student_lookup[student_id] = await user_store.get_user_by_id(student_id)

    normalized = []
    for submission in submissions:
        student = student_lookup.get(submission.get("student_id")) or {}
        score = submission.get("marks")
        if score is None:
            score = submission.get("grade")
        if score is None:
            score = submission.get("score")

        normalized.append(
            {
                **submission,
                "content_url": submission.get("content_url") or submission.get("file_path"),
                "score": score,
                "student_name": student.get("full_name") or student.get("name") or student.get("email") or "Student",
            }
        )

    return normalized


@router.get("/{assignment_id}/analytics")
async def get_assignment_analytics(
    assignment_id: str,
    store: AssignmentStore = Depends(get_assignment_store),
):
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

    marks_list = [s.get("marks") for s in submissions if s.get("marks") is not None]
    graded_count = len(marks_list)
    ungraded_count = len(submissions) - graded_count

    if marks_list:
        avg_grade = sum(marks_list) / len(marks_list)
        min_grade = min(marks_list)
        max_grade = max(marks_list)
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
async def get_submission_report(
    assignment_id: str, 
    submission_id: str,
    store: AssignmentStore = Depends(get_assignment_store),
    personalization_store: PersonalizationStore = Depends(get_personalization_store),
):
    """Detailed report for a single submission (score, feedback, OCR text)."""
    # Get assignment and submission
    assignment = await store.get_assignment(assignment_id)
    if not assignment:
        raise HTTPException(status_code=404, detail="Assignment not found")

    submissions = await store.get_submissions(assignment_id)
    submission = next((s for s in submissions if s["id"] == submission_id), None)
    if not submission:
        raise HTTPException(status_code=404, detail="Submission not found")

    marks = submission.get("marks")
    feedback = submission.get("feedback")
    text_content = submission.get("text_content")
    scorecard = await personalization_store.get_scorecard(submission_id)
    confidence = scorecard.confidence if scorecard else None
    review_required = scorecard.review_required if scorecard else None

    # Derive simple level label from numeric grade if present (0–100 assumed)
    level = None
    if isinstance(marks, (int, float)):
        if marks < 40:
            level = "weak"
        elif marks < 70:
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
        "score": marks,
        "confidence": confidence,
        "review_required": review_required,
        "level": level,
        "feedback": feedback,
        "text_content": text_content,
    }
