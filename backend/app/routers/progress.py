from fastapi import APIRouter, Depends, HTTPException
from app.api.deps import get_current_user
from app.database.supabase_manager import supabase_db

router = APIRouter(tags=["progress"])


def _check_student_access(current_user: dict, student_id: str):
    if current_user.get("role") not in {"teacher", "admin", "hod"} and current_user.get("id") != student_id:
        raise HTTPException(status_code=403, detail="Forbidden: access denied")


@router.get("/student/{student_id}/calibration")
async def get_calibration_data(
    student_id: str,
    current_user: dict = Depends(get_current_user),
):
    """
    Return per-concept calibration data: self-reported confidence vs actual accuracy.
    Used to plot a calibration scatter chart on the student dashboard.
    """
    _check_student_access(current_user, student_id)
    try:
        client = supabase_db.get_client()
        result = (
            client.table("answers")
            .select(
                "concept_id, confidence_self_report, is_correct, concepts(name, subject)"
            )
            .eq("student_id", student_id)
            .execute()
        )

        rows = result.data or []
        if not rows:
            return {"concepts": []}

        # Aggregate per concept
        agg: dict = {}
        for row in rows:
            cid = row.get("concept_id") or "unknown"
            if cid not in agg:
                concept_meta = row.get("concepts") or {}
                agg[cid] = {
                    "concept_id": cid,
                    "concept_name": concept_meta.get("name", cid),
                    "subject": concept_meta.get("subject", ""),
                    "confidence_sum": 0.0,
                    "correct_sum": 0,
                    "attempts": 0,
                }
            entry = agg[cid]
            entry["attempts"] += 1
            conf = row.get("confidence_self_report")
            if conf is not None:
                entry["confidence_sum"] += float(conf)
            if row.get("is_correct"):
                entry["correct_sum"] += 1

        concepts = []
        for entry in agg.values():
            attempts = entry["attempts"]
            concepts.append({
                "concept_id": entry["concept_id"],
                "concept_name": entry["concept_name"],
                "subject": entry["subject"],
                "confidence": round(entry["confidence_sum"] / attempts, 4) if attempts else 0.0,
                "accuracy": round(entry["correct_sum"] / attempts, 4) if attempts else 0.0,
                "attempts": attempts,
            })

        return {"concepts": concepts}

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load calibration data: {str(e)}")
