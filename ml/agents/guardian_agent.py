import structlog
from typing import List, Dict, Any
from datetime import datetime
from app.database.supabase_manager import supabase_db

log = structlog.get_logger(__name__)

class GuardianService:
    """
    Service for monitoring AI safety, hallucination detection, and prompt performance.
    """
    
    def __init__(self):
        self.db = supabase_db

    async def get_active_signals(self) -> List[Dict[str, Any]]:
        """
        Fetch current active safety signals and flags.
        """
        guardian_logs = await self.db.fetch_all("guardian_log", limit=50)
        if guardian_logs:
            return guardian_logs

        recommendations = await self.db.fetch_all("intervention_recommendations", {"status": "pending"}, limit=10)
        fallback_signals: List[Dict[str, Any]] = []
        for index, recommendation in enumerate(recommendations):
            fallback_signals.append({
                "id": recommendation.get("id") or f"guardian-{index}",
                "type": recommendation.get("recommendation_type") or "intervention_recommendation",
                "severity": recommendation.get("priority") or "medium",
                "source": "teacher-verified-ai",
                "message": recommendation.get("summary") or recommendation.get("recommended_action") or "Intervention requires review.",
                "timestamp": recommendation.get("updated_at") or recommendation.get("created_at") or datetime.utcnow().isoformat(),
                "status": recommendation.get("status") or "pending",
            })
        return fallback_signals

    async def register_violation(self, user_id: str, session_id: str, violation_type: str, details: Dict[str, Any]):
        """
        Register a new safety violation.
        """
        log.warning("guardian_violation_registered", 
                    user_id=user_id, 
                    session_id=session_id, 
                    type=violation_type,
                    **details)
        await self.db.insert(
            "guardian_log",
            {
                "user_id": user_id,
                "session_id": session_id,
                "signal_type": violation_type,
                "details": details,
                "status": "pending",
                "created_at": datetime.utcnow().isoformat(),
            },
        )
        return True

def get_guardian_service():
    return GuardianService()
