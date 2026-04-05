import logging
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

async def log_intervention(
    db,
    student_id: str,
    intervention_type: str,
    reason: str,
    payload: Dict[str, Any] = None
) -> Dict[str, Any]:
    """
    Log an adaptive intervention to the database.
    This allows us to track the efficacy of 'Intelligence Controller' decisions.
    """
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        
        entry = {
            "id": str(uuid.uuid4()),
            "student_id": student_id,
            "intervention_type": intervention_type,
            "trigger_reason": reason,
            "payload": payload or {},
            "created_at": now_iso
        }
        
        # Log to intervention_logs table
        await db.table("intervention_logs").insert(entry).execute()
        
        logger.info(f"Logged intervention {intervention_type} for student {student_id}")
        return entry
    except Exception as e:
        logger.error(f"Failed to log intervention for {student_id}: {str(e)}")
        # We don't want to crash the main learning loop if logging fails
        return {}

async def update_intervention_outcome(
    db,
    intervention_id: str,
    outcome_score: float
):
    """
    Update the success metric for an intervention.
    Used by the RL loop to reward/penalize decision policies.
    """
    try:
        await db.table("intervention_logs").update({
            "outcome_score": outcome_score
        }).eq("id", intervention_id).execute()
    except Exception as e:
        logger.error(f"Failed to update intervention outcome for {intervention_id}: {str(e)}")
