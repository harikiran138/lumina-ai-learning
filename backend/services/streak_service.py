import redis
import json
from datetime import datetime, timedelta
from typing import Dict, List
import logging

logger = logging.getLogger(__name__)

class StreakService:
    def __init__(self, redis_url: str = "redis://localhost:6379"):
        self.redis = redis.from_url(redis_url)
        self.streak_key_prefix = "streak:"
        self.activity_key_prefix = "activity:"

    def record_activity(self, student_id: str, activity_type: str, metadata: Dict = None) -> bool:
        """Record a student activity and update streaks"""
        try:
            today = datetime.now().date().isoformat()
            activity_key = f"{self.activity_key_prefix}{student_id}:{activity_type}:{today}"

            # Check if activity already recorded today
            if self.redis.exists(activity_key):
                return False

            # Record the activity
            activity_data = {
                "student_id": student_id,
                "activity_type": activity_type,
                "date": today,
                "timestamp": datetime.now().isoformat(),
                "metadata": metadata or {}
            }

            self.redis.setex(activity_key, 86400 * 30, json.dumps(activity_data))  # 30 days expiry

            # Update streak
            self._update_streak(student_id, activity_type)

            return True
        except Exception as e:
            logger.error(f"Error recording activity: {str(e)}")
            return False

    def _update_streak(self, student_id: str, activity_type: str):
        """Update streak for a specific activity type"""
        try:
            streak_key = f"{self.streak_key_prefix}{student_id}:{activity_type}"
            today = datetime.now().date()

            # Get current streak data
            streak_data = self.redis.get(streak_key)
            if streak_data:
                streak_info = json.loads(streak_data)
            else:
                streak_info = {
                    "current_streak": 0,
                    "longest_streak": 0,
                    "last_activity_date": None,
                    "start_date": today.isoformat()
                }

            last_date = streak_info.get("last_activity_date")
            if last_date:
                last_date = datetime.fromisoformat(last_date).date()

                if last_date == today - timedelta(days=1):
                    # Consecutive day - increment streak
                    streak_info["current_streak"] += 1
                elif last_date == today:
                    # Already recorded today - no change
                    return
                else:
                    # Streak broken
                    streak_info["current_streak"] = 1
                    streak_info["start_date"] = today.isoformat()
            else:
                # First activity
                streak_info["current_streak"] = 1
                streak_info["start_date"] = today.isoformat()

            # Update longest streak
            if streak_info["current_streak"] > streak_info["longest_streak"]:
                streak_info["longest_streak"] = streak_info["current_streak"]

            streak_info["last_activity_date"] = today.isoformat()

            # Store updated streak (30 days expiry)
            self.redis.setex(streak_key, 86400 * 30, json.dumps(streak_info))

        except Exception as e:
            logger.error(f"Error updating streak: {str(e)}")

    def get_streak_info(self, student_id: str, activity_type: str) -> Dict:
        """Get streak information for a student and activity type"""
        try:
            streak_key = f"{self.streak_key_prefix}{student_id}:{activity_type}"
            streak_data = self.redis.get(streak_key)

            if streak_data:
                return json.loads(streak_data)
            else:
                return {
                    "current_streak": 0,
                    "longest_streak": 0,
                    "last_activity_date": None,
                    "start_date": None
                }
        except Exception as e:
            logger.error(f"Error getting streak info: {str(e)}")
            return {"current_streak": 0, "longest_streak": 0}

    def get_all_streaks(self, student_id: str) -> Dict[str, Dict]:
        """Get all streak information for a student"""
        try:
            pattern = f"{self.streak_key_prefix}{student_id}:*"
            keys = self.redis.keys(pattern)

            streaks = {}
            for key in keys:
                activity_type = key.decode().split(":")[-1]
                streaks[activity_type] = self.get_streak_info(student_id, activity_type)

            return streaks
        except Exception as e:
            logger.error(f"Error getting all streaks: {str(e)}")
            return {}

    def check_streak_maintenance(self, student_id: str, activity_type: str) -> bool:
        """Check if streak is still active (within 1 day gap)"""
        try:
            streak_info = self.get_streak_info(student_id, activity_type)
            last_date = streak_info.get("last_activity_date")

            if not last_date:
                return False

            last_date = datetime.fromisoformat(last_date).date()
            today = datetime.now().date()

            # Streak is active if last activity was today or yesterday
            return (today - last_date).days <= 1
        except Exception as e:
            logger.error(f"Error checking streak maintenance: {str(e)}")
            return False

    def get_leaderboard(self, activity_type: str, limit: int = 10) -> List[Dict]:
        """Get leaderboard for a specific activity type"""
        try:
            pattern = f"{self.streak_key_prefix}*:{activity_type}"
            keys = self.redis.keys(pattern)

            leaderboard = []
            for key in keys:
                student_id = key.decode().split(":")[1]
                streak_info = self.get_streak_info(student_id, activity_type)
                leaderboard.append({
                    "student_id": student_id,
                    "current_streak": streak_info["current_streak"],
                    "longest_streak": streak_info["longest_streak"]
                })

            # Sort by current streak descending
            leaderboard.sort(key=lambda x: x["current_streak"], reverse=True)
            return leaderboard[:limit]
        except Exception as e:
            logger.error(f"Error getting leaderboard: {str(e)}")
            return []

    def reset_streak(self, student_id: str, activity_type: str):
        """Reset streak for a student (admin function)"""
        try:
            streak_key = f"{self.streak_key_prefix}{student_id}:{activity_type}"
            self.redis.delete(streak_key)
            logger.info(f"Reset streak for {student_id}:{activity_type}")
        except Exception as e:
            logger.error(f"Error resetting streak: {str(e)}")
