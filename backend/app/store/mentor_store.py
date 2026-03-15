from typing import List, Dict, Any, Optional
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog
from datetime import datetime

log = structlog.get_logger()

class MentorStore:
    """
    Store for mentor-specific operations.
    Operates on mentor_matches, mentor_sessions, portfolio_reviews, and mentor_availability.
    """
    def __init__(self):
        self.db = supabase_db

    async def get_matches(self, mentor_id: str) -> List[Dict[str, Any]]:
        try:
            client = self.db.get_client()
            response = client.table("mentor_matches").select("*").eq("mentor_id", mentor_id).execute()
            return response.data
        except Exception as e:
            log.error("get_mentor_matches_failed", mentor_id=mentor_id, error=str(e))
            return []

    async def get_mentee_profile(self, mentee_id: str) -> Optional[Dict[str, Any]]:
        """
        Returns a filtered profile for mentors (no grades).
        """
        try:
            client = self.db.get_client()
            # Note: RLS already filters, but we specify columns for clarity
            response = client.table("learner_profiles").select("goals, preferences, strengths, weaknesses, metadata").eq("user_id", mentee_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            log.error("get_mentee_profile_failed", mentee_id=mentee_id, error=str(e))
            return None

    async def schedule_session(self, mentor_id: str, mentee_id: str, scheduled_at: str, notes: str) -> Optional[Dict[str, Any]]:
        try:
            session_data = {
                "mentor_id": mentor_id,
                "mentee_id": mentee_id,
                "scheduled_at": scheduled_at,
                "notes": notes,
                "status": "scheduled"
            }
            return await self.db.insert("mentor_sessions", session_data)
        except Exception as e:
            log.error("schedule_session_failed", mentor_id=mentor_id, mentee_id=mentee_id, error=str(e))
            return None

    async def create_portfolio_review(self, mentor_id: str, mentee_id: str, portfolio_data: Dict[str, Any], feedback: str) -> Optional[Dict[str, Any]]:
        try:
            review_data = {
                "mentor_id": mentor_id,
                "mentee_id": mentee_id,
                "portfolio_data": portfolio_data,
                "feedback": feedback
            }
            return await self.db.insert("portfolio_reviews", review_data)
        except Exception as e:
            log.error("create_portfolio_review_failed", mentor_id=mentor_id, mentee_id=mentee_id, error=str(e))
            return None

    async def get_sessions(self, mentor_id: str) -> List[Dict[str, Any]]:
        try:
            client = self.db.get_client()
            response = client.table("mentor_sessions").select("*").eq("mentor_id", mentor_id).order("scheduled_at").execute()
            return response.data
        except Exception as e:
            log.error("get_mentor_sessions_failed", mentor_id=mentor_id, error=str(e))
            return []
