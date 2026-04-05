"""
Notification Service
--------------------
Dispatches in-app, email, and (optionally) push notifications.

In-app queue  — stored in Redis (list per user_id), polled by the frontend
               via GET /api/notifications.
Email         — sent asynchronously via a Celery task when SMTP is configured.
Push (FCM)    — placeholder; wire up by setting FIREBASE_SERVER_KEY in env.
"""

from __future__ import annotations

import json
import logging
import uuid
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

import structlog

from app.core.config import settings

log = structlog.get_logger(__name__)
logger = logging.getLogger(__name__)

# Redis key pattern:  "notifications:<user_id>"  (Redis list, newest first)
_NOTIF_KEY = "notifications:{user_id}"
_MAX_PER_USER = 50  # keep last N notifications per user

# Priority levels
PRIORITY_LOW = "low"
PRIORITY_NORMAL = "normal"
PRIORITY_HIGH = "high"
PRIORITY_CRITICAL = "critical"


def _get_redis():
    """Return a sync Redis client or None when Redis is unavailable."""
    try:
        import redis as _redis
        client = _redis.from_url(settings.REDIS_URL, decode_responses=True, socket_connect_timeout=2)
        client.ping()
        return client
    except Exception as exc:
        log.warning("notification_redis_unavailable", error=str(exc))
        return None


class NotificationService:
    """
    Service for dispatching in-app, email, and push notifications.

    Usage::

        svc = NotificationService()
        svc.send(
            user_id="abc-123",
            title="Assignment graded",
            body="Your submission for CS101 received a score of 88/100.",
            notification_type="assignment_grade",
            priority=PRIORITY_NORMAL,
        )
    """

    # ------------------------------------------------------------------
    # Public API
    # ------------------------------------------------------------------

    def send(
        self,
        user_id: str,
        title: str,
        body: str,
        notification_type: str = "general",
        priority: str = PRIORITY_NORMAL,
        metadata: Optional[Dict[str, Any]] = None,
        send_email: bool = False,
        email_address: Optional[str] = None,
        user_role: Optional[str] = None, # ITEM 3: Role-based capping
    ) -> str:
        """
        Dispatch a notification to *user_id*.
        Enforces Item 3: Parent notification capping (max 3/day).
        """
        # ITEM 3: Check for parent notification capping
        if user_role == "parent":
            today = datetime.now(timezone.utc).strftime("%Y-%m-%d")
            cap_key = f"notif_cap:{user_id}:{today}"
            redis = _get_redis()
            if redis:
                current_count = int(redis.get(cap_key) or 0)
                
                # Priority mapping (Item 3)
                # 1. teacher_urgent, 2. assignment_overdue, 3. grade_low, 4. streak_risk, 5. goal_achieved
                is_high_priority = priority in [PRIORITY_HIGH, PRIORITY_CRITICAL] or \
                                  notification_type in ["teacher_urgent", "assignment_overdue"]
                
                if current_count >= 3 and not is_high_priority:
                    log.info("notification_capped_for_parent", user_id=user_id, count=current_count, type=notification_type)
                    return "CAPPED" # Return special ID or handle gracefully
                
                # Increment count
                redis.incr(cap_key)
                redis.expire(cap_key, 86400) # 24 hours

        notif_id = str(uuid.uuid4())
        payload: Dict[str, Any] = {
            "id": notif_id,
            "user_id": user_id,
            "title": title,
            "body": body,
            "type": notification_type,
            "priority": priority,
            "read": False,
            "created_at": datetime.now(timezone.utc).isoformat(),
            **(metadata or {}),
        }

        self._push_in_app(user_id, payload)

        if send_email and email_address:
            self._enqueue_email(email_address, title, body)

        log.info(
            "notification_sent",
            notif_id=notif_id,
            user_id=user_id,
            type=notification_type,
            priority=priority,
        )
        return notif_id

    # Convenience alias kept for backwards compatibility
    def send_notification(self, user_id: str, message: str) -> str:
        return self.send(user_id=user_id, title="Notification", body=message)

    def get_unread(self, user_id: str, limit: int = 20) -> List[Dict[str, Any]]:
        """Return up to *limit* unread in-app notifications for *user_id*."""
        redis = _get_redis()
        if not redis:
            return []
        try:
            key = _NOTIF_KEY.format(user_id=user_id)
            raw_items = redis.lrange(key, 0, _MAX_PER_USER - 1)
            notifications = []
            for raw in raw_items:
                try:
                    notif = json.loads(raw)
                    if not notif.get("read"):
                        notifications.append(notif)
                    if len(notifications) >= limit:
                        break
                except json.JSONDecodeError:
                    continue
            return notifications
        except Exception as exc:
            log.error("notification_get_unread_failed", user_id=user_id, error=str(exc))
            return []

    def mark_read(self, user_id: str, notif_id: str) -> bool:
        """Mark a single notification as read."""
        redis = _get_redis()
        if not redis:
            return False
        try:
            key = _NOTIF_KEY.format(user_id=user_id)
            raw_items = redis.lrange(key, 0, _MAX_PER_USER - 1)
            for i, raw in enumerate(raw_items):
                try:
                    notif = json.loads(raw)
                    if notif.get("id") == notif_id:
                        notif["read"] = True
                        redis.lset(key, i, json.dumps(notif))
                        return True
                except json.JSONDecodeError:
                    continue
            return False
        except Exception as exc:
            log.error("notification_mark_read_failed", user_id=user_id, notif_id=notif_id, error=str(exc))
            return False

    def mark_all_read(self, user_id: str) -> int:
        """Mark all in-app notifications as read. Returns count updated."""
        redis = _get_redis()
        if not redis:
            return 0
        try:
            key = _NOTIF_KEY.format(user_id=user_id)
            raw_items = redis.lrange(key, 0, _MAX_PER_USER - 1)
            updated = 0
            for i, raw in enumerate(raw_items):
                try:
                    notif = json.loads(raw)
                    if not notif.get("read"):
                        notif["read"] = True
                        redis.lset(key, i, json.dumps(notif))
                        updated += 1
                except json.JSONDecodeError:
                    continue
            return updated
        except Exception as exc:
            log.error("notification_mark_all_read_failed", user_id=user_id, error=str(exc))
            return 0

    # ------------------------------------------------------------------
    # Internal helpers
    # ------------------------------------------------------------------

    def _push_in_app(self, user_id: str, payload: Dict[str, Any]) -> None:
        """Prepend notification to the user's Redis list and trim to max size."""
        redis = _get_redis()
        if not redis:
            # Graceful degradation: log and continue when Redis is down.
            log.warning("in_app_notification_skipped_no_redis", user_id=user_id, title=payload.get("title"))
            return
        try:
            key = _NOTIF_KEY.format(user_id=user_id)
            redis.lpush(key, json.dumps(payload))
            redis.ltrim(key, 0, _MAX_PER_USER - 1)
        except Exception as exc:
            log.error("in_app_notification_push_failed", user_id=user_id, error=str(exc))

    def _enqueue_email(self, email_address: str, subject: str, body: str) -> None:
        """
        Enqueue an email via Celery when SMTP is configured.
        Falls back to a structured log entry when the worker is unavailable.
        """
        smtp_host = getattr(settings, "SMTP_HOST", None)
        if not smtp_host:
            log.info(
                "email_notification_skipped_no_smtp",
                recipient=email_address,
                subject=subject,
            )
            return

        try:
            from app.worker.celery_app import celery_app
            celery_app.send_task(
                "app.worker.tasks.send_email",
                kwargs={
                    "to": email_address,
                    "subject": subject,
                    "body": body,
                },
            )
        except Exception as exc:
            log.error("email_enqueue_failed", recipient=email_address, error=str(exc))
