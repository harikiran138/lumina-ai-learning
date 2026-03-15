"""
WS8: APScheduler-based scheduler for automation jobs.
Registers recurring jobs for development environments.
In production, use Celery Beat with the schedule defined below.
"""
import logging
from typing import Optional

log = logging.getLogger(__name__)

# Celery Beat schedule constants (for reference in production)
CELERY_BEAT_SCHEDULE = {
    "weekly-class-digest": {
        "task": "app.worker.task_run_weekly_digest",
        "schedule": 604800,  # every 7 days
    },
    "inactivity-alert-scan": {
        "task": "app.worker.task_run_inactivity_alert",
        "schedule": 86400,  # every 24 hours
    },
    "profile-refresh": {
        "task": "app.worker.task_run_profile_refresh",
        "schedule": 86400,  # every 24 hours
    },
}


def setup_scheduled_jobs(app=None):
    """
    Set up APScheduler for in-process scheduling in development.
    This is a no-op if APScheduler is not installed, so production
    remains unaffected.
    """
    try:
        from apscheduler.schedulers.background import BackgroundScheduler
        from app.automation.jobs import run_inactivity_alert_scan, run_profile_refresh, run_weekly_class_digest

        scheduler = BackgroundScheduler()

        # Weekly digest (for demo: runs every hour in dev)
        scheduler.add_job(
            func=lambda: run_weekly_class_digest("default"),
            trigger="interval",
            hours=168,
            id="weekly_class_digest",
            replace_existing=True,
        )

        # Inactivity scan (every 6 hours in dev)
        scheduler.add_job(
            func=lambda: run_inactivity_alert_scan(threshold_hours=48),
            trigger="interval",
            hours=6,
            id="inactivity_alert_scan",
            replace_existing=True,
        )

        # Profile refresh (daily in dev)
        scheduler.add_job(
            func=lambda: run_profile_refresh(),
            trigger="interval",
            hours=24,
            id="profile_refresh",
            replace_existing=True,
        )

        scheduler.start()
        log.info("[Scheduler] APScheduler started with recurring jobs.")
        return scheduler

    except ImportError:
        log.warning("[Scheduler] APScheduler not installed — recurring jobs disabled. Install with: pip install apscheduler")
        return None
    except Exception as e:
        log.error(f"[Scheduler] Failed to start: {e}")
        return None
