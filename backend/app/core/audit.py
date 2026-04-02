import structlog
from datetime import datetime
from typing import Any, Dict, Optional

logger = structlog.get_logger("audit")


class AuditLogger:
    """
    Structured Audit Logger for tracking security and administrative events.
    """

    @staticmethod
    def _persist_event(
        action: str,
        user_id: Optional[str],
        resource_id: Optional[str],
        status: str,
        created_at: str,
        details: Optional[Dict[str, Any]] = None,
    ) -> None:
        try:
            from app.database.supabase_manager import supabase_db

            client = supabase_db.get_client()
            payload_variants = [
                {
                    "user_id": user_id,
                    "action": action,
                    "resource_id": resource_id,
                    "status": status,
                    "details": details or {},
                    "created_at": created_at,
                },
                {
                    "user_id": user_id,
                    "action": action,
                    "resource_id": resource_id,
                    "status": status,
                    "metadata": details or {},
                    "timestamp": created_at,
                },
            ]
            for payload in payload_variants:
                try:
                    client.table("audit_logs").insert(payload).execute()
                    return
                except Exception:
                    continue
        except Exception:
            return

    @staticmethod
    def log_security_event(
        action: str,
        user_id: Optional[str],
        severity: str = "medium",  # low, medium, high, critical
        metadata: Optional[Dict[str, Any]] = None,
        ip_address: Optional[str] = None
    ):
        """
        Log a security-sensitive event with elevated visibility.
        """
        timestamp = datetime.utcnow().isoformat()
        event_data = {
            "audit_type": "security_log",
            "action": action,
            "user_id": user_id,
            "severity": severity,
            "ip_address": ip_address,
            "timestamp": timestamp,
            **(metadata or {}),
        }

        AuditLogger._persist_event(
            action=action,
            user_id=user_id,
            resource_id=None,
            status=severity,
            created_at=timestamp,
            details={
                "audit_type": "security_log",
                "severity": severity,
                "ip_address": ip_address,
                **(metadata or {}),
            },
        )

        if severity in ["high", "critical"]:
            logger.critical(f"SENTINEL_SECURITY_ALERT: {action}", **event_data)
        elif severity == "medium":
            logger.warning(f"SENTINEL_SECURITY_EVENT: {action}", **event_data)
        else:
            logger.info(action, **event_data)

    @staticmethod
    def log(
        action: str,
        user_id: str,
        resource_id: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None,
        status: str = "success",
    ):
        """
        Log a structured audit event.
        """
        timestamp = datetime.utcnow().isoformat()
        event_data = {
            "audit_type": "audit_log",
            "action": action,
            "user_id": user_id,
            "resource_id": resource_id,
            "status": status,
            "timestamp": timestamp,
            **(metadata or {}),
        }

        AuditLogger._persist_event(
            action=action,
            user_id=user_id,
            resource_id=resource_id,
            status=status,
            created_at=timestamp,
            details={"audit_type": "audit_log", **(metadata or {})},
        )

        if status == "failure":
            logger.warning(action, **event_data)
        else:
            logger.info(action, **event_data)


audit_logger = AuditLogger()
