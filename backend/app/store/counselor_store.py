from typing import List, Dict, Any, Optional
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog
from datetime import datetime, timezone, timedelta

log = structlog.get_logger()

class CounselorStore:
    def __init__(self, db_manager=None):
        self.db = db_manager or supabase_db

    async def get_risk_alerts(self, filter_suppressed: bool = True) -> List[Dict[str, Any]]:
        """Fetch anonymized risk alerts for the counselor dashboard."""
        try:
            client = self.db.get_client()
            query = client.table("risk_alerts").select("*")
            
            if filter_suppressed:
                # Only show active alerts or suppressed alerts that have expired
                # Postgrest doesn't support complex OR filters easily without RPC, 
                # but we can filter suppressed=active
                query = query.eq("suppression_status", "active")
            
            res = await query.async_execute()
            alerts = res.data or []
            
            # Anonymize student names/IDs in memory for the UI report
            for alert in alerts:
                student_id = alert["student_id"]
                # Create a stable but anonymized identifier (e.g., last 4 chars of UUID)
                anonymized_id = f"Student-{student_id[-4:]}"
                alert["anonymized_name"] = anonymized_id
            
            return alerts
        except Exception as e:
            log.error("get_risk_alerts_failed", error=str(e))
            return []

    async def reveal_student_identity(self, counselor_id: str, alert_id: str, reason: str) -> Optional[Dict[str, Any]]:
        """Log the reveal action and return student identification."""
        try:
            client = self.db.get_client()
            
            # 1. Fetch the alert to get the student_id
            alert_res = await client.table("risk_alerts").select("student_id").eq("id", alert_id).single().async_execute()
            if not alert_res.data:
                return None
            
            student_id = alert_res.data["student_id"]
            
            # 2. Log the reveal action
            reveal_log = {
                "counselor_id": counselor_id,
                "student_id": student_id,
                "reason": reason
            }
            await client.table("risk_reveal_logs").insert(reveal_log).execute()
            
            # 3. Fetch full student identity
            student_res = await client.table("users").select("id, full_name, email").eq("id", student_id).single().async_execute()
            return student_res.data
        except Exception as e:
            log.error("reveal_student_identity_failed", alert_id=alert_id, error=str(e))
            return None

    async def add_encrypted_note(self, counselor_id: str, student_id: str, note_data: Dict[str, str]) -> Optional[Dict[str, Any]]:
        """Store client-side encrypted note."""
        try:
            payload = {
                "counselor_id": counselor_id,
                "student_id": student_id,
                "encrypted_blob": note_data["encrypted_blob"],
                "iv": note_data["iv"],
                "auth_tag": note_data["auth_tag"]
            }
            res = await self.db.insert("counselor_notes", payload)
            return res
        except Exception as e:
            log.error("add_encrypted_note_failed", counselor_id=counselor_id, error=str(e))
            return None

    async def get_encrypted_notes(self, counselor_id: str, student_id: str) -> List[Dict[str, Any]]:
        """Fetch encrypted notes for a student, accessible only by the counselor."""
        try:
            client = self.db.get_client()
            res = await client.table("counselor_notes") \
                .select("*") \
                .eq("counselor_id", counselor_id) \
                .eq("student_id", student_id) \
                .order("created_at", desc=True) \
                .async_execute()
            return res.data or []
        except Exception as e:
            log.error("get_encrypted_notes_failed", counselor_id=counselor_id, error=str(e))
            return []

    async def manage_follow_up(self, task_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Update follow-up task status/acknowledgment."""
        try:
            update_data["updated_at"] = datetime.now(timezone.utc).isoformat()
            res = await self.db.update("follow_up_tasks", update_data, {"id": task_id})
            return res
        except Exception as e:
            log.error("manage_follow_up_failed", task_id=task_id, error=str(e))
            return None

    async def suppress_alert(self, alert_id: str, expiry_hours: int) -> bool:
        """Temporarily suppress a risk alert."""
        try:
            from datetime import timedelta
            expiry = (datetime.now(timezone.utc) + timedelta(hours=expiry_hours)).isoformat()
            update_data = {
                "suppression_status": "suppressed",
                "suppression_expiry": expiry,
                "updated_at": datetime.now(timezone.utc).isoformat()
            }
            await self.db.update("risk_alerts", update_data, {"id": alert_id})
            return True
        except Exception as e:
            log.error("suppress_alert_failed", alert_id=alert_id, error=str(e))
            return False
