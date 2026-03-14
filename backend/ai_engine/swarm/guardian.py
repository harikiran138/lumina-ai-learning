class GuardianAgent:
    """
    Safety and Guardrails Agent for content filtering and bias prevention.
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
