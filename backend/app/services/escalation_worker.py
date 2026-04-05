"""
escalation_worker.py — Follow-Up Task Escalation Engine

Implements the 3-stage counselor follow-up chain:
  T+0   → Task created in follow_up_tasks
  T+2h  → Reminder re-sent if still pending (reminder_sent_at set)
  T+24h → Escalated to admin if not acknowledged (status=escalated, escalated_at set)

Run via:
  asyncio.create_task(run_escalation_sweep())

Or schedule via APScheduler / Celery beat every 15 minutes.
"""

from datetime import datetime, timezone, timedelta
from typing import List, Dict, Any, Optional
import logging

log = logging.getLogger(__name__)

REMINDER_THRESHOLD_HOURS = 2    # T+2h: send reminder
ESCALATION_THRESHOLD_HOURS = 24  # T+24h: escalate to admin


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def get_or_create_admin_id(db) -> Optional[str]:
    """
    Return the id of the first admin user found in the users table.
    Returns None if no admin exists or the query fails.
    """
    try:
        client = db.get_client()
        res = await client.table("users").select("id").eq("role", "admin").limit(1).async_execute()
        if res.data:
            return res.data[0]["id"]
        log.warning("escalation_worker.get_or_create_admin_id: no admin user found in users table")
        return None
    except Exception as exc:
        log.error("escalation_worker.get_or_create_admin_id failed", exc_info=exc)
        return None


def _parse_iso(ts: Optional[str]) -> Optional[datetime]:
    """Parse an ISO 8601 timestamp string into a timezone-aware datetime."""
    if not ts:
        return None
    try:
        dt = datetime.fromisoformat(ts)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt
    except (ValueError, TypeError):
        return None


# ---------------------------------------------------------------------------
# Core escalation logic
# ---------------------------------------------------------------------------

async def _send_reminder(db, task: Dict[str, Any]) -> bool:
    """
    Send reminder to counselor for a task that has been pending > 2 hours.
    Updates reminder_sent_at timestamp in follow_up_tasks.
    """
    task_id = task.get("id")
    student_id = task.get("student_id", "")
    anonymized = f"Student-{student_id[-4:]}" if len(student_id) >= 4 else f"Student-{student_id}"
    counselor_id = task.get("counselor_id")

    try:
        client = db.get_client()
        now_iso = datetime.now(timezone.utc).isoformat()
        await (
            client.table("follow_up_tasks")
            .update({"reminder_sent_at": now_iso, "updated_at": now_iso})
            .eq("id", task_id)
            .async_execute()
        )
        log.info(
            "escalation_worker.reminder_sent",
            task_id=task_id,
            counselor_id=counselor_id,
            anonymized_student=anonymized,
        )
        return True
    except Exception as exc:
        log.error(
            "escalation_worker._send_reminder failed",
            task_id=task_id,
            exc_info=exc,
        )
        return False


async def _escalate_to_admin(db, task: Dict[str, Any]) -> bool:
    """
    Escalate overdue task to admin.
    - Updates task status to 'escalated' and sets escalated_at.
    - Creates a notification record for the admin.
    """
    task_id = task.get("id")
    student_id = task.get("student_id", "")
    anonymized = f"Student-{student_id[-4:]}" if len(student_id) >= 4 else f"Student-{student_id}"

    try:
        client = db.get_client()
        now_iso = datetime.now(timezone.utc).isoformat()

        # 1. Mark task as escalated
        await (
            client.table("follow_up_tasks")
            .update({
                "status": "escalated",
                "escalated_at": now_iso,
                "updated_at": now_iso,
            })
            .eq("id", task_id)
            .async_execute()
        )

        # 2. Resolve admin user id
        admin_id = await get_or_create_admin_id(db)

        # 3. Insert admin notification (best-effort; table may not exist in all envs)
        notification_payload = {
            "user_id": admin_id,
            "type": "counselor_escalation",
            "title": "Follow-up escalated: Counselor unresponsive",
            "body": (
                f"Task #{task_id} for {anonymized} has exceeded 24h without acknowledgment. "
                "Please assign a substitute counselor."
            ),
            "priority": "high",
            "created_at": now_iso,
        }
        try:
            await client.table("notifications").insert(notification_payload).async_execute()
        except Exception as notif_exc:
            # Notifications table may not exist yet; log and continue
            log.warning(
                "escalation_worker._escalate_to_admin: could not insert notification (table may be missing)",
                task_id=task_id,
                exc_info=notif_exc,
            )

        log.info(
            "escalation_worker.escalated_to_admin",
            task_id=task_id,
            admin_id=admin_id,
            anonymized_student=anonymized,
        )
        return True
    except Exception as exc:
        log.error(
            "escalation_worker._escalate_to_admin failed",
            task_id=task_id,
            exc_info=exc,
        )
        return False


# ---------------------------------------------------------------------------
# Main sweep
# ---------------------------------------------------------------------------

async def sweep_pending_tasks(db) -> Dict[str, int]:
    """
    Sweep follow_up_tasks for overdue items and apply escalation logic.

    Returns:
        {
            "reminders_sent": int,
            "escalations_triggered": int,
            "checked": int,
        }
    """
    reminders_sent = 0
    escalations_triggered = 0
    checked = 0
    now = datetime.now(timezone.utc)

    reminder_cutoff = now - timedelta(hours=REMINDER_THRESHOLD_HOURS)
    escalation_cutoff = now - timedelta(hours=ESCALATION_THRESHOLD_HOURS)

    try:
        client = db.get_client()
        # Fetch all pending/acknowledged tasks whose due_at has passed
        res = await (
            client.table("follow_up_tasks")
            .select("*")
            .in_("status", ["pending", "acknowledged"])
            .order("due_at", desc=False)
            .async_execute()
        )
        tasks: List[Dict[str, Any]] = res.data or []
    except Exception as exc:
        log.error("escalation_worker.sweep_pending_tasks: failed to query follow_up_tasks", exc_info=exc)
        return {"reminders_sent": 0, "escalations_triggered": 0, "checked": 0}

    for task in tasks:
        due_at = _parse_iso(task.get("due_at"))

        # Only process tasks that are due or overdue
        if due_at is None or due_at > now:
            continue

        checked += 1
        created_at = _parse_iso(task.get("created_at")) or now
        reminder_sent_at = _parse_iso(task.get("reminder_sent_at"))
        escalation_sent_at = _parse_iso(task.get("escalation_sent_at"))
        status = task.get("status", "pending")

        # Stage 2 — Escalation check (T+24h past due_at, not yet completed)
        if (
            escalation_sent_at is None
            and due_at <= escalation_cutoff
            and status != "completed"
        ):
            success = await _escalate_to_admin(db, task)
            if success:
                escalations_triggered += 1
            continue  # skip reminder stage if already escalating

        # Stage 1 — Reminder check (task created > 2h ago, reminder not yet sent)
        if reminder_sent_at is None and created_at <= reminder_cutoff:
            success = await _send_reminder(db, task)
            if success:
                reminders_sent += 1

    log.info(
        "escalation_worker.sweep_complete",
        checked=checked,
        reminders_sent=reminders_sent,
        escalations_triggered=escalations_triggered,
    )
    return {
        "reminders_sent": reminders_sent,
        "escalations_triggered": escalations_triggered,
        "checked": checked,
    }


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------

async def run_escalation_sweep(db=None) -> Dict[str, int]:
    """
    Entry point for the escalation worker.
    Call this on a schedule (every 15 minutes).

    If `db` is not provided, the global supabase_db manager is used.
    """
    if db is None:
        from app.database.supabase_manager import supabase_db
        db = supabase_db

    log.info("escalation_worker.run_escalation_sweep: starting sweep")
    try:
        result = await sweep_pending_tasks(db)
    except Exception as exc:
        log.error("escalation_worker.run_escalation_sweep: unhandled error", exc_info=exc)
        result = {"reminders_sent": 0, "escalations_triggered": 0, "checked": 0}

    log.info("escalation_worker.run_escalation_sweep: done", **result)
    return result
