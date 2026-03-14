"""
WS8: Automation Layer REST API
Provides endpoints to list automation job history and manually trigger jobs.
Job logs are now persisted to `automation_job_logs` table in Supabase.
"""
import time
from datetime import datetime, timezone
from typing import List, Optional

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from app.automation.jobs import (
    run_inactivity_alert_scan,
    run_post_assessment_remediation,
    run_student_progress_digest,
    run_weekly_class_digest,
)
from app.automation.schemas import (
    AutomationJobStatus,
    AutomationJobType,
    ClassDigest,
    InactivityAlert,
    RemediationPlan,
    StudentProgressDigest,
)
from app.database.supabase_manager import supabase_db

router = APIRouter(prefix="/api/automation", tags=["automation"])


# ─────────────────────────────────────────────────────────────────────────────
# Helper: persist job log to DB
# ─────────────────────────────────────────────────────────────────────────────

def _persist_job_log(
    job_type: AutomationJobType,
    result: dict,
    status: AutomationJobStatus = AutomationJobStatus.SUCCESS,
    trigger: str = "manual",
    duration_ms: Optional[int] = None,
    error_message: Optional[str] = None,
):
    """Persists an automation job log entry to the automation_job_logs table."""
    client = supabase_db.get_client()
    if not client:
        return  # Graceful fallback if DB not available
    try:
        client.table("automation_job_logs").insert({
            "job_type": job_type.value if hasattr(job_type, "value") else str(job_type),
            "status": status.value if hasattr(status, "value") else str(status),
            "trigger": trigger,
            "result": result,
            "error_message": error_message,
            "completed_at": datetime.now(timezone.utc).isoformat(),
            "duration_ms": duration_ms,
        }).execute()
    except Exception:
        pass  # Never let a logging failure break the API response


# ─────────────────────────────────────────────────────────────────────────────
# GET /api/automation/jobs — list recent job logs from DB
# ─────────────────────────────────────────────────────────────────────────────

@router.get("/jobs")
def list_jobs(limit: int = 20):
    """Returns recent automation job logs from the database (newest first)."""
    client = supabase_db.get_client()
    if not client:
        return {"jobs": [], "source": "db_unavailable"}
    try:
        rows = (
            client.table("automation_job_logs")
            .select("*")
            .order("started_at", desc=True)
            .limit(limit)
            .execute()
            .data
        )
        return {"jobs": rows, "total": len(rows)}
    except Exception as e:
        return {"jobs": [], "error": str(e)}


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/automation/run/weekly-digest
# ─────────────────────────────────────────────────────────────────────────────

class WeeklyDigestRequest(BaseModel):
    course_id: str


@router.post("/run/weekly-digest", response_model=ClassDigest)
def trigger_weekly_digest(req: WeeklyDigestRequest):
    """Manually trigger a weekly class digest for a course."""
    t0 = time.time()
    try:
        result = run_weekly_class_digest(req.course_id)
        duration = int((time.time() - t0) * 1000)
        _persist_job_log(
            AutomationJobType.WEEKLY_DIGEST,
            result.model_dump(mode="json"),
            duration_ms=duration,
        )
        return result
    except Exception as e:
        _persist_job_log(
            AutomationJobType.WEEKLY_DIGEST,
            {},
            status=AutomationJobStatus.FAILED,
            error_message=str(e),
        )
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/automation/run/remediation
# ─────────────────────────────────────────────────────────────────────────────

class RemediationRequest(BaseModel):
    user_id: str
    score: float
    course_id: Optional[str] = None


@router.post("/run/remediation")
def trigger_remediation(req: RemediationRequest):
    """Manually trigger a post-assessment remediation plan for a student."""
    t0 = time.time()
    try:
        result = run_post_assessment_remediation(req.user_id, req.score, req.course_id)
        if result is None:
            return {"message": "No remediation needed — score above threshold."}
        duration = int((time.time() - t0) * 1000)
        result_dict = result.model_dump(mode="json")
        _persist_job_log(
            AutomationJobType.POST_ASSESSMENT_REMEDIATION,
            result_dict,
            duration_ms=duration,
        )
        # Also persist to remediation_plans table
        client = supabase_db.get_client()
        if client:
            try:
                client.table("remediation_plans").insert({
                    "user_id": req.user_id,
                    "triggered_by_score": req.score,
                    "course_id": req.course_id,
                    "weak_concepts": result.weak_concepts,
                    "recommended_concepts": result.recommended_concepts,
                }).execute()
            except Exception:
                pass
        return result
    except Exception as e:
        _persist_job_log(
            AutomationJobType.POST_ASSESSMENT_REMEDIATION,
            {},
            status=AutomationJobStatus.FAILED,
            error_message=str(e),
        )
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/automation/run/inactivity-alert
# ─────────────────────────────────────────────────────────────────────────────

class InactivityAlertRequest(BaseModel):
    threshold_hours: float = 48.0


@router.post("/run/inactivity-alert", response_model=List[InactivityAlert])
def trigger_inactivity_alert(req: InactivityAlertRequest):
    """Manually trigger a scan for inactive learners."""
    t0 = time.time()
    try:
        alerts = run_inactivity_alert_scan(req.threshold_hours)
        duration = int((time.time() - t0) * 1000)
        _persist_job_log(
            AutomationJobType.INACTIVITY_ALERT,
            {"alert_count": len(alerts), "threshold_hours": req.threshold_hours},
            duration_ms=duration,
        )
        # Persist individual alerts to inactivity_alerts table
        client = supabase_db.get_client()
        if client and alerts:
            rows = [
                {
                    "user_id": str(a.user_id),
                    "last_activity_at": a.last_activity_at.isoformat() if a.last_activity_at else None,
                    "hours_inactive": a.hours_inactive,
                    "risk_level": a.risk_level,
                    "nudge_message": a.nudge_message,
                }
                for a in alerts
            ]
            try:
                client.table("inactivity_alerts").insert(rows).execute()
            except Exception:
                pass
        return alerts
    except Exception as e:
        _persist_job_log(
            AutomationJobType.INACTIVITY_ALERT,
            {},
            status=AutomationJobStatus.FAILED,
            error_message=str(e),
        )
        raise HTTPException(status_code=500, detail=str(e))


# ─────────────────────────────────────────────────────────────────────────────
# POST /api/automation/run/progress-digest
# ─────────────────────────────────────────────────────────────────────────────

class ProgressDigestRequest(BaseModel):
    user_id: str
    course_id: Optional[str] = None


@router.post("/run/progress-digest")
def trigger_progress_digest(req: ProgressDigestRequest):
    """Manually trigger a weekly progress digest for a student."""
    t0 = time.time()
    try:
        result = run_student_progress_digest(req.user_id, req.course_id)
        if result is None:
            raise HTTPException(status_code=404, detail="Learner profile not found.")
        duration = int((time.time() - t0) * 1000)
        _persist_job_log(
            AutomationJobType.PROGRESS_DIGEST,
            result.model_dump(mode="json"),
            duration_ms=duration,
        )
        return result
    except HTTPException:
        raise
    except Exception as e:
        _persist_job_log(
            AutomationJobType.PROGRESS_DIGEST,
            {},
            status=AutomationJobStatus.FAILED,
            error_message=str(e),
        )
        raise HTTPException(status_code=500, detail=str(e))
