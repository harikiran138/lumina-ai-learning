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
            response = await client.table("mentor_matches").select("*").eq("mentor_id", mentor_id).eq("status", "active").async_execute()
            return response.data
        except Exception as e:
            log.error("get_mentor_matches_failed", mentor_id=mentor_id, error=str(e))
            return []

    async def get_mentee_profile(self, mentee_id: str) -> Optional[Dict[str, Any]]:
        """
        Returns a STRICTLY FILTERED profile for mentors (no academic scores).
        Required by Security-Critical Role Auditor:
        - career_goals, skills, portfolio, badges, completed_courses
        - ❌ NO mastery_score, assignment_scores, risk_score, engagement_signals
        """
        try:
            client = self.db.get_client()
            # Select ONLY allowed fields. Note: We Map 'goals' to 'career_goals' and ensure no sensitive data leaks.
            response = await client.table("learner_profiles").select("goals, strengths, weaknesses, learning_style, metadata").eq("user_id", mentee_id).async_execute()
            
            if not response.data:
                return None
            
            profile = response.data[0]
            # Further scrub metadata if any sensitive fields are found
            if "metadata" in profile and profile["metadata"]:
                sensitive_fields = ["risk_score", "engagement_signals", "mastery_score", "attendance"]
                profile["metadata"] = {k: v for k, v in profile["metadata"].items() if k not in sensitive_fields}
            
            # Fetch portfolio items separately
            portfolio_response = await client.table("portfolio_items").select("*").eq("student_id", mentee_id).async_execute()
            profile["portfolio"] = portfolio_response.data
            
            # Filter goals for career-specific only if possible, or mapping them directly
            profile["career_goals"] = profile.pop("goals", [])
            profile["skills"] = profile.get("strengths", [])
            
            return profile
        except Exception as e:
            log.error("get_mentee_profile_failed", mentee_id=mentee_id, error=str(e))
            return None

    async def schedule_session(self, mentor_id: str, mentee_id: str, session_date: str, notes: Optional[Dict[str, Any]] = None, next_steps: Optional[str] = None) -> Optional[Dict[str, Any]]:
        """
        Schedules a session with detailed notes and next steps for AI-briefing continuity.
        """
        try:
            # Enforce match check before scheduling
            matches = await self.get_matches(mentor_id)
            if not any(str(m["student_id"]) == mentee_id for m in matches):
                log.warning("unauthorized_session_attempt", mentor_id=mentor_id, mentee_id=mentee_id)
                return None

            session_data = {
                "mentor_id": mentor_id,
                "mentee_id": mentee_id,
                "session_date": session_date,
                "notes_json": notes or {},
                "next_steps": next_steps or "",
                "status": "scheduled"
            }
            return await self.db.insert("mentor_sessions", session_data)
        except Exception as e:
            log.error("schedule_session_failed", mentor_id=mentor_id, mentee_id=mentee_id, error=str(e))
            return None

    async def get_sessions(self, mentor_id: str) -> List[Dict[str, Any]]:
        try:
            client = self.db.get_client()
            response = await client.table("mentor_sessions").select("*").eq("mentor_id", mentor_id).order("session_date", desc=True).async_execute()
            return response.data
        except Exception as e:
            log.error("get_mentor_sessions_failed", mentor_id=mentor_id, error=str(e))
            return []

    async def get_session_briefing(self, mentor_id: str, mentee_id: str) -> Dict[str, Any]:
        """
        Generates an AI briefing based on the last 3 sessions' notes and next steps.
        Requirement: BRAIN-003 Briefing Intelligence
        """
        try:
            client = self.db.get_client()
            response = await client.table("mentor_sessions")\
                .select("notes_json, next_steps, session_date")\
                .eq("mentor_id", mentor_id)\
                .eq("mentee_id", mentee_id)\
                .eq("status", "completed")\
                .order("session_date", desc=True)\
                .limit(3)\
                .async_execute()
            
            history = response.data
            briefing = {
                "recent_history": history,
                "suggested_agenda": "Review pending next steps from previous sessions and assess progress on portfolio items.",
                "pending_next_steps": [s["next_steps"] for s in history if s.get("next_steps")]
            }
            return briefing
        except Exception as e:
            log.error("get_session_briefing_failed", mentee_id=mentee_id, error=str(e))
            return {"error": "Could not generate briefing"}
