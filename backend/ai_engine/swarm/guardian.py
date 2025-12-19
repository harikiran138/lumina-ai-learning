class GuardianAgent:
    """
    Safety and Guardrails Agent for PII redaction and topic filtering.
    """
    def __init__(self):
        self.banned_keywords = [
            "bomb", "hack", "exploit", "suicide", "murder", "kill", "attack",
            "malware", "virus", "trojan", "ignore previous instructions"
        ]
        
    def validate_content(self, content: str) -> dict:
        """
        Check content for violations.
        Returns: {"safe": bool, "reason": str}
        """
        content_lower = content.lower()
        for word in self.banned_keywords:
            if word in content_lower:
                return {"safe": False, "reason": f"Content contains prohibited term: {word}"}
        
        # Simple PII check (mock: check for phone-like patterns or emails)
        # In production this would use Presidio or similar
        if "@" in content and "." in content.split("@")[-1]:
             # Just a warning for now, don't block
             pass

        return {"safe": True, "reason": "Content is safe"}
    
    def sanitize_input(self, user_input: str) -> str:
        # Remove simple injections
        return user_input.replace("<script>", "").replace("</script>", "")
