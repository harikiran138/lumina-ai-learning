from enum import Enum
from typing import Dict, Any, Optional

class RoutingTier(str, Enum):
    RESTRICTED = "restricted"
    SAFE_INSTANT = "safe_instant"
    ACADEMIC_VERIFIED = "academic_verified"

RESTRICTED_REDIRECT = "I'm sorry, but I can only assist with academic and course-related discussions."
SAFE_INSTANT_WAITING = "Please wait, your question is being securely routed."

def classify(prompt: str, context: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
    """
    Mock implementation of a Zero-Shot semantic classifier.
    In a real environment, this would call out to an LLM or a lighter NLP model.
    """
    prompt_lower = prompt.lower()
    
    # 1. High Risk / Off-Topic (RESTRICTED)
    restricted_keywords = ["hack", "cheat", "ignore previous", "bypass", "politics", "bomb", "nsfw"]
    if any(keyword in prompt_lower for keyword in restricted_keywords):
        return {
            "tier": RoutingTier.RESTRICTED,
            "confidence": 0.99,
            "reason": "Restricted keyword detected"
        }
        
    # 2. Academic Integrity Risk (ACADEMIC_VERIFIED - queue for review)
    integrity_keywords = ["do my homework", "write my essay", "exact answer", "give me the final answer"]
    if any(keyword in prompt_lower for keyword in integrity_keywords):
        return {
            "tier": RoutingTier.ACADEMIC_VERIFIED,
            "confidence": 0.85,
            "reason": "Potential academic integrity flag"
        }
        
    # 3. Safe fallback query (SAFE_INSTANT - immediate LLM proxy)
    return {
        "tier": RoutingTier.SAFE_INSTANT,
        "confidence": 0.95,
        "reason": "Safe academic question"
    }
