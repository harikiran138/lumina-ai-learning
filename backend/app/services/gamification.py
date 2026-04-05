"""
Gamification service — XP, streaks, levels, badges.
XP rules:
  correct_answer: 10
  streak_day: 20
  concept_mastered: 50   (mastery crosses 0.80)
  teach_back_passed: 30
  perfect_session: 100   (all answers correct)
  lag_zone_cleared: 40   (lag zone concept mastered)

3.6× multiplier applied when engagement score E > 0.8
"""

from __future__ import annotations

import logging
from datetime import datetime, date, timezone, timedelta
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

# ─── Constants ────────────────────────────────────────────────────────────────

XP_RULES: Dict[str, int] = {
    "correct_answer":    10,
    "streak_day":        20,
    "concept_mastered":  50,
    "teach_back_passed": 30,
    "perfect_session":   100,
    "lag_zone_cleared":  40,
}

LEVEL_THRESHOLDS: List[int] = [0, 100, 250, 500, 900, 1400, 2000, 3000]

LEVEL_TITLES: Dict[int, str] = {
    1: "Curious Learner",
    2: "Knowledge Seeker",
    3: "Science Explorer",
    4: "Critical Thinker",
    5: "Master Scholar",
    6: "Expert",
    7: "Luminary",
}

ENGAGEMENT_MULTIPLIER = 3.6
ENGAGEMENT_THRESHOLD  = 0.8

# ─── Helpers ──────────────────────────────────────────────────────────────────

def get_level(xp_total: int) -> Tuple[int, str]:
    """Returns (level_number, level_title) based on total XP."""
    level = 1
    for i, threshold in enumerate(LEVEL_THRESHOLDS):
        if xp_total >= threshold:
            level = i + 1
        else:
            break
    level = min(level, len(LEVEL_TITLES))
    return level, LEVEL_TITLES.get(level, "Luminary")


# ─── Core service functions ───────────────────────────────────────────────────

async def award_xp(
    db,
    student_id: str,
    event: str,
    engagement_score: float = 0.0,
) -> int:
    """
    Award XP for a given event.
    Applies 3.6× multiplier when engagement_score > 0.8.
    Inserts into xp_events; updates student_gamification.
    Returns the actual XP awarded.
    """
    try:
        base_xp = XP_RULES.get(event, 0)
        if base_xp == 0:
            logger.warning("award_xp: unknown event '%s' for student %s", event, student_id)
            return 0

        xp_awarded = int(base_xp * ENGAGEMENT_MULTIPLIER) if engagement_score > ENGAGEMENT_THRESHOLD else base_xp

        now_iso = datetime.now(timezone.utc).isoformat()

        # Insert XP event record
        await (
            db.table("xp_events")
            .insert({
                "student_id":       student_id,
                "event_type":       event,
                "xp_awarded":       xp_awarded,
                "base_xp":          base_xp,
                "engagement_score": engagement_score,
                "multiplier_applied": engagement_score > ENGAGEMENT_THRESHOLD,
                "created_at":       now_iso,
            })
            .execute()
        )

        # Fetch current gamification row
        result = (
            await db.table("student_gamification")
            .select("xp_total")
            .eq("student_id", student_id)
            .maybe_single()
            .execute()
        )
        current_xp = result.data.get("xp_total", 0) if result and result.data else 0
        new_xp = current_xp + xp_awarded
        new_level, new_title = get_level(new_xp)

        await (
            db.table("student_gamification")
            .upsert(
                {
                    "student_id":  student_id,
                    "xp_total":    new_xp,
                    "level":       new_level,
                    "level_title": new_title,
                    "updated_at":  now_iso,
                },
                on_conflict="student_id",
            )
            .execute()
        )

        logger.info("award_xp: student=%s event=%s xp=%d total=%d", student_id, event, xp_awarded, new_xp)
        return xp_awarded

    except Exception as exc:
        logger.error("award_xp failed: student=%s event=%s error=%s", student_id, event, str(exc))
        return 0


async def update_streak(db, student_id: str) -> dict:
    """
    Increment streak if last_active_date != today.
    Reset if gap > 24 h.
    Awards streak_day XP if streak was incremented.
    Returns updated streak dict.
    """
    try:
        today = date.today()
        now_iso = datetime.now(timezone.utc).isoformat()

        result = (
            await db.table("student_gamification")
            .select("streak_days, last_active_date")
            .eq("student_id", student_id)
            .maybe_single()
            .execute()
        )

        if result and result.data:
            streak_days       = result.data.get("streak_days", 0)
            last_active_str   = result.data.get("last_active_date")
        else:
            streak_days     = 0
            last_active_str = None

        xp_awarded = 0
        if last_active_str:
            try:
                last_active = date.fromisoformat(str(last_active_str)[:10])
            except ValueError:
                last_active = None

            if last_active:
                delta = (today - last_active).days
                if delta == 0:
                    # Already counted today — return current streak unchanged
                    return {"streak_days": streak_days, "xp_awarded": 0, "already_counted": True}
                elif delta == 1:
                    streak_days += 1
                    xp_awarded = await award_xp(db, student_id, "streak_day")
                else:
                    # Gap > 1 day → reset streak
                    streak_days = 1
            else:
                streak_days = 1
                xp_awarded = await award_xp(db, student_id, "streak_day")
        else:
            streak_days = 1
            xp_awarded = await award_xp(db, student_id, "streak_day")

        await (
            db.table("student_gamification")
            .upsert(
                {
                    "student_id":       student_id,
                    "streak_days":      streak_days,
                    "last_active_date": today.isoformat(),
                    "updated_at":       now_iso,
                },
                on_conflict="student_id",
            )
            .execute()
        )

        logger.info("update_streak: student=%s streak=%d", student_id, streak_days)
        return {"streak_days": streak_days, "xp_awarded": xp_awarded, "already_counted": False}

    except Exception as exc:
        logger.error("update_streak failed: student=%s error=%s", student_id, str(exc))
        return {"streak_days": 0, "xp_awarded": 0, "error": str(exc)}


async def get_dashboard(db, student_id: str) -> dict:
    """
    Return gamification dashboard:
      streak_days, xp_total, level, level_title, xp_to_next_level,
      badges (list), weekly_xp (7-day array).
    """
    try:
        result = (
            await db.table("student_gamification")
            .select("streak_days, xp_total, level, level_title, last_active_date")
            .eq("student_id", student_id)
            .maybe_single()
            .execute()
        )
        data = result.data if result and result.data else {}

        xp_total    = data.get("xp_total", 0)
        level, title = get_level(xp_total)

        # XP to next level
        if level < len(LEVEL_THRESHOLDS):
            xp_to_next = LEVEL_THRESHOLDS[level] - xp_total
        else:
            xp_to_next = 0  # max level

        # Badges
        badges_result = (
            await db.table("student_badges")
            .select("badge_id, badge_name, awarded_at")
            .eq("student_id", student_id)
            .execute()
        )
        badges = badges_result.data if badges_result and badges_result.data else []

        # Weekly XP (last 7 days)
        seven_days_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
        xp_result = (
            await db.table("xp_events")
            .select("xp_awarded, created_at")
            .eq("student_id", student_id)
            .gte("created_at", seven_days_ago)
            .execute()
        )
        xp_events = xp_result.data if xp_result and xp_result.data else []

        # Bucket by day offset (index 0 = 6 days ago … index 6 = today)
        weekly_xp = [0] * 7
        today = date.today()
        for ev in xp_events:
            try:
                ev_date = date.fromisoformat(str(ev["created_at"])[:10])
                offset = (today - ev_date).days
                if 0 <= offset < 7:
                    weekly_xp[6 - offset] += ev.get("xp_awarded", 0)
            except Exception:
                pass

        return {
            "streak_days":    data.get("streak_days", 0),
            "xp_total":       xp_total,
            "level":          level,
            "level_title":    title,
            "xp_to_next_level": max(0, xp_to_next),
            "badges":         badges,
            "weekly_xp":      weekly_xp,
        }

    except Exception as exc:
        logger.error("get_dashboard failed: student=%s error=%s", student_id, str(exc))
        return {
            "streak_days": 0, "xp_total": 0, "level": 1,
            "level_title": "Curious Learner", "xp_to_next_level": 100,
            "badges": [], "weekly_xp": [0] * 7,
        }


async def check_badge_unlock(db, student_id: str) -> list:
    """
    Check badge unlock conditions; insert newly unlocked badges into student_badges.
    Returns list of newly unlocked badge dicts.
    """
    BADGE_CONDITIONS = [
        {"badge_id": "first_correct",     "badge_name": "First Steps",       "check": "xp_events_count", "threshold": 1},
        {"badge_id": "streak_3",          "badge_name": "3-Day Streak",       "check": "streak_days",     "threshold": 3},
        {"badge_id": "streak_7",          "badge_name": "7-Day Streak",       "check": "streak_days",     "threshold": 7},
        {"badge_id": "streak_30",         "badge_name": "30-Day Streak",      "check": "streak_days",     "threshold": 30},
        {"badge_id": "xp_500",            "badge_name": "XP 500",             "check": "xp_total",        "threshold": 500},
        {"badge_id": "xp_1000",           "badge_name": "XP 1000",            "check": "xp_total",        "threshold": 1000},
        {"badge_id": "level_3",           "badge_name": "Science Explorer",   "check": "level",           "threshold": 3},
        {"badge_id": "level_5",           "badge_name": "Master Scholar",     "check": "level",           "threshold": 5},
        {"badge_id": "mastery_5",         "badge_name": "Concept Master",     "check": "mastered_count",  "threshold": 5},
        {"badge_id": "perfect_session",   "badge_name": "Perfectionist",      "check": "event_type",      "event": "perfect_session"},
    ]

    newly_unlocked: List[dict] = []
    try:
        # Fetch current gamification state
        gam_result = (
            await db.table("student_gamification")
            .select("xp_total, streak_days, level")
            .eq("student_id", student_id)
            .maybe_single()
            .execute()
        )
        gam = gam_result.data if gam_result and gam_result.data else {}
        xp_total    = gam.get("xp_total", 0)
        streak_days = gam.get("streak_days", 0)
        level       = gam.get("level", 1)

        # Fetch already-unlocked badges
        existing_result = (
            await db.table("student_badges")
            .select("badge_id")
            .eq("student_id", student_id)
            .execute()
        )
        existing_ids = {row["badge_id"] for row in (existing_result.data or [])}

        # Count events
        events_result = (
            await db.table("xp_events")
            .select("event_type")
            .eq("student_id", student_id)
            .execute()
        )
        events_data = events_result.data or []
        events_count = len(events_data)
        event_types  = {e["event_type"] for e in events_data}

        # Count mastered concepts from dkt_states
        mastered_count = 0
        try:
            dkt_result = (
                await db.table("dkt_states")
                .select("state_data")
                .eq("user_id", student_id)
                .maybe_single()
                .execute()
            )
            if dkt_result and dkt_result.data:
                state_data = dkt_result.data.get("state_data", {})
                state_map  = state_data.get("state", {})
                mastered_count = sum(1 for v in state_map.values() if v >= 0.80)
        except Exception:
            pass

        now_iso = datetime.now(timezone.utc).isoformat()
        for badge in BADGE_CONDITIONS:
            if badge["badge_id"] in existing_ids:
                continue

            unlocked = False
            check = badge["check"]
            if check == "xp_total" and xp_total >= badge["threshold"]:
                unlocked = True
            elif check == "streak_days" and streak_days >= badge["threshold"]:
                unlocked = True
            elif check == "level" and level >= badge["threshold"]:
                unlocked = True
            elif check == "xp_events_count" and events_count >= badge["threshold"]:
                unlocked = True
            elif check == "mastered_count" and mastered_count >= badge["threshold"]:
                unlocked = True
            elif check == "event_type" and badge.get("event") in event_types:
                unlocked = True

            if unlocked:
                try:
                    await (
                        db.table("student_badges")
                        .insert({
                            "student_id":  student_id,
                            "badge_id":    badge["badge_id"],
                            "badge_name":  badge["badge_name"],
                            "awarded_at":  now_iso,
                        })
                        .execute()
                    )
                    newly_unlocked.append(badge)
                    logger.info("badge_unlocked: student=%s badge=%s", student_id, badge["badge_id"])
                except Exception as ins_exc:
                    logger.warning("badge_insert_failed: %s", str(ins_exc))

    except Exception as exc:
        logger.error("check_badge_unlock failed: student=%s error=%s", student_id, str(exc))

    return newly_unlocked
