"""
Lumina Streak Microservice
FastAPI service for managing learning streaks and gamification
"""

from fastapi import FastAPI, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional
import redis
import json
import logging
from datetime import datetime, timedelta
import uvicorn
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="Lumina Streak Service",
    description="Microservice for learning streaks and gamification",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis connection
redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
redis_client = redis.from_url(redis_url)

# Pydantic models
class ActivityRequest(BaseModel):
    student_id: str
    activity_type: str
    metadata: Optional[Dict] = None

class StreakResponse(BaseModel):
    student_id: str
    current_streak: int
    longest_streak: int
    last_activity_date: Optional[str]
    start_date: Optional[str]
    is_active: bool

class LeaderboardEntry(BaseModel):
    student_id: str
    current_streak: int
    longest_streak: int
    rank: int

# Streak Service Class
class StreakService:
    def __init__(self, redis_client):
        self.redis = redis_client
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

    def get_streak_info(self, student_id: str, activity_type: str = "learning") -> Dict:
        """Get streak information for a student and activity type"""
        try:
            streak_key = f"{self.streak_key_prefix}{student_id}:{activity_type}"
            streak_data = self.redis.get(streak_key)

            if streak_data:
                streak_info = json.loads(streak_data)
                # Check if streak is still active (within 1 day)
                is_active = self._is_streak_active(streak_info)
                streak_info["is_active"] = is_active
                return streak_info
            else:
                return {
                    "current_streak": 0,
                    "longest_streak": 0,
                    "last_activity_date": None,
                    "start_date": None,
                    "is_active": False
                }
        except Exception as e:
            logger.error(f"Error getting streak info: {str(e)}")
            return {"current_streak": 0, "longest_streak": 0, "is_active": False}

    def _is_streak_active(self, streak_info: Dict) -> bool:
        """Check if streak is still active (within 1 day gap)"""
        last_date = streak_info.get("last_activity_date")
        if not last_date:
            return False

        last_date = datetime.fromisoformat(last_date).date()
        today = datetime.now().date()

        # Streak is active if last activity was today or yesterday
        return (today - last_date).days <= 1

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

    def get_leaderboard(self, activity_type: str = "learning", limit: int = 10) -> List[Dict]:
        """Get leaderboard for a specific activity type"""
        try:
            pattern = f"{self.streak_key_prefix}*:{activity_type}"
            keys = self.redis.keys(pattern)

            leaderboard = []
            for key in keys:
                student_id = key.decode().split(":")[1]
                streak_info = self.get_streak_info(student_id, activity_type)
                if streak_info["current_streak"] > 0:
                    leaderboard.append({
                        "student_id": student_id,
                        "current_streak": streak_info["current_streak"],
                        "longest_streak": streak_info["longest_streak"],
                        "is_active": streak_info["is_active"]
                    })

            # Sort by current streak descending, then by longest streak
            leaderboard.sort(key=lambda x: (x["current_streak"], x["longest_streak"]), reverse=True)

            # Add rank
            for i, entry in enumerate(leaderboard[:limit], 1):
                entry["rank"] = i

            return leaderboard[:limit]
        except Exception as e:
            logger.error(f"Error getting leaderboard: {str(e)}")
            return []

    def reset_streak(self, student_id: str, activity_type: str = "learning"):
        """Reset streak for a student (admin function)"""
        try:
            streak_key = f"{self.streak_key_prefix}{student_id}:{activity_type}"
            self.redis.delete(streak_key)
            logger.info(f"Reset streak for {student_id}:{activity_type}")
        except Exception as e:
            logger.error(f"Error resetting streak: {str(e)}")

# Initialize streak service
streak_service = StreakService(redis_client)

# API Endpoints
@app.post("/streaks/update")
async def update_streak(request: ActivityRequest):
    """Record student activity and update streak"""
    try:
        success = streak_service.record_activity(
            request.student_id,
            request.activity_type,
            request.metadata
        )

        if not success:
            return {"message": "Activity already recorded today", "recorded": False}

        # Get updated streak info
        streak_info = streak_service.get_streak_info(request.student_id, request.activity_type)

        return {
            "message": "Activity recorded successfully",
            "recorded": True,
            "streak_info": streak_info
        }
    except Exception as e:
        logger.error(f"Update streak error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/streaks/view/{student_id}")
async def get_student_streak(student_id: str, activity_type: str = "learning"):
    """Get streak information for a student"""
    try:
        streak_info = streak_service.get_streak_info(student_id, activity_type)
        return StreakResponse(
            student_id=student_id,
            current_streak=streak_info["current_streak"],
            longest_streak=streak_info["longest_streak"],
            last_activity_date=streak_info.get("last_activity_date"),
            start_date=streak_info.get("start_date"),
            is_active=streak_info["is_active"]
        )
    except Exception as e:
        logger.error(f"Get streak error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/streaks/all/{student_id}")
async def get_all_student_streaks(student_id: str):
    """Get all streak information for a student"""
    try:
        streaks = streak_service.get_all_streaks(student_id)
        return {"student_id": student_id, "streaks": streaks}
    except Exception as e:
        logger.error(f"Get all streaks error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/leaderboard")
async def get_leaderboard(activity_type: str = "learning", limit: int = 10):
    """Get leaderboard for activity type"""
    try:
        leaderboard = streak_service.get_leaderboard(activity_type, limit)
        return {"activity_type": activity_type, "leaderboard": leaderboard}
    except Exception as e:
        logger.error(f"Get leaderboard error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/streaks/reset/{student_id}")
async def reset_student_streak(student_id: str, activity_type: str = "learning"):
    """Reset streak for a student (admin endpoint)"""
    try:
        streak_service.reset_streak(student_id, activity_type)
        return {"message": f"Streak reset for {student_id}:{activity_type}"}
    except Exception as e:
        logger.error(f"Reset streak error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test Redis connection
        redis_client.ping()
        return {
            "status": "healthy",
            "timestamp": datetime.now().isoformat(),
            "service": "streak-service",
            "redis": "connected"
        }
    except Exception as e:
        return {
            "status": "unhealthy",
            "timestamp": datetime.now().isoformat(),
            "service": "streak-service",
            "redis": "disconnected",
            "error": str(e)
        }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=int(os.getenv("PORT", 8001)),
        reload=True,
        log_level="info"
    )
