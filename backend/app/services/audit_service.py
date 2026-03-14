import structlog
from datetime import datetime
from typing import Any, Dict, Optional
from app.database.supabase_manager import supabase_db

log = structlog.get_logger()

class AuditService:
    """
    Service for persisting high-impact AI decisions and administrative actions.
    Ensures governance by maintaining an immutable record of choices made by the Swarm.
    """

    def __init__(self):
        self.client = supabase_db.get_client()

    async def log_decision(
        self,
        user_id: str,
        decision_id: str,
        action: str,
        target: Optional[str] = None,
        reasoning: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        status: str = "success"
    ) -> bool:
        """
        Logs a pathway or tutor decision to the database.
        """
        payload = {
            "user_id": user_id,
            "decision_id": decision_id,
            "action": action,
            "resource_id": target,
            "reasoning": reasoning,
            "details": metadata or {},
            "status": status,
            "created_at": datetime.utcnow().isoformat()
        }

        # Log to structured log first
        log.info("ai_decision_audit", **payload)

        if self.client is None:
            return True

        try:
            # We assume an 'audit_logs' table exists or should be created
            self.client.table("audit_logs").insert(payload).execute()
            return True
        except Exception as e:
            log.error("audit_persistence_failed", error=str(e), decision_id=decision_id)
            return False

_audit_service = None

def get_audit_service():
    global _audit_service
    if _audit_service is None:
        _audit_service = AuditService()
    return _audit_service
