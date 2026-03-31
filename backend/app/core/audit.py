import structlog
from datetime import datetime
from typing import Any, Dict, Optional

logger = structlog.get_logger("audit")


class AuditLogger:
    """
    Structured Audit Logger for tracking security and administrative events.
    """

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
        event_data = {
            "audit_type": "security_log",
            "action": action,
            "user_id": user_id,
            "severity": severity,
            "ip_address": ip_address,
            "timestamp": datetime.utcnow().isoformat(),
            **(metadata or {}),
        }

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
        event_data = {
            "audit_type": "audit_log",
            "action": action,
            "user_id": user_id,
            "resource_id": resource_id,
            "status": status,
            "timestamp": datetime.utcnow().isoformat(),
            **(metadata or {}),
        }

        if status == "failure":
            logger.warning(action, **event_data)
        else:
            logger.info(action, **event_data)


audit_logger = AuditLogger()
