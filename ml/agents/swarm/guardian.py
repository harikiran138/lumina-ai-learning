class GuardianAgent:
    """
    Safety and Guardrails Agent for content filtering, bias prevention,
    and parent/guardian-facing summaries.
    """

    def __init__(self):
        self.banned_keywords = [
            "bomb", "hack", "exploit", "suicide", "murder", "kill",
            "attack", "malware", "virus", "trojan",
            "ignore previous instructions", "system prompt", "DAN mode"
        ]

    def check_safety(self, content: str) -> bool:
        """
        Check if content is safe.
        """
        result = self.validate_content(content)
        return result["safe"]

    def validate_content(self, content: str) -> dict:
        """
        Check content for violations.
        Returns: {"safe": bool, "reason": str}
        """
        content_lower = content.lower()
        for word in self.banned_keywords:
            if word in content_lower:
                return {"safe": False, "reason": f"Content contains prohibited term: {word}"}

        # Basic Prompt Injection Checks
        injection_patterns = ["you are now", "instead of", "forget everything"]
        for pattern in injection_patterns:
            if pattern in content_lower:
                return {"safe": False, "reason": "Potential prompt injection detected."}

        return {"safe": True, "reason": "Content is safe"}

    def sanitize_input(self, user_input: str) -> str:
        """
        Basic HTML/Script scrubbing.
        """
        import re
        clean = re.compile('<.*?>')
        return re.sub(clean, '', user_input)

    def check_transition(self, current_state: dict, requested_action: str) -> dict:
        """
        Review gate for high-impact AI transitions.
        """
        if requested_action == "ADVANCE":
            # Example gate: require minimum mastery or readiness
            readiness = current_state.get("readiness_score", 0.0)
            if readiness < 0.7:
                return {
                    "approved": False, 
                    "reason": f"Readiness score ({readiness:.2f}) is below the required 0.70 for advancement."
                }
        
        return {"approved": True, "reason": "Transition approved"}

    def generate_guardian_summary(self, profile: dict, recent_events: list = None) -> dict:
        """
        Generates a privacy-bounded, jargon-free summary of a student's progress
        suitable for a parent or guardian.
        """
        risk_level = profile.get("risk_summary", {}).get("risk_level", "low")
        engagement = profile.get("engagement_summary", {})
        streak = engagement.get("current_streak", 0)
        minutes = engagement.get("total_minutes", 0)
        mastery = profile.get("mastery_state", {})
        
        # High-level tone based on risk
        if risk_level in ["high", "critical"]:
            tone = "needs support"
            message = "We've noticed your student has encountered some challenging concepts recently. Consistent practice this week could help build confidence."
        elif streak >= 3:
            tone = "thriving"
            message = f"Your student is on a {streak}-day learning streak! Their dedication is really paying off."
        else:
            tone = "steady"
            message = "Your student is making steady progress through the curriculum. Encourage them to keep logging in!"
            
        mastered_topics = [k for k, v in mastery.items() if getattr(v, "score", v.get("score", 0)) > 0.75]
        weak_topics = profile.get("weak_topics", [])
        
        return {
            "student_id": profile.get("user_id"),
            "summary_date": "datetime.utcnow().isoformat()",
            "tone": tone,
            "message": message,
            "highlights": {
                "active_streak_days": streak,
                "learning_time_minutes": minutes,
                "recently_mastered": mastered_topics[:3]
            },
            "areas_for_support": weak_topics[:2],
            "escalation_required": risk_level == "critical"
        }
