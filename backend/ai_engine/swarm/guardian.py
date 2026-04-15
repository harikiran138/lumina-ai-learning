from typing import Any, Dict, List


class GuardianAgent:
    """
    Governance helper used by pathway and guardian-summary jobs.
    """

    def check_transition(self, context: Dict[str, Any], action: Any) -> Dict[str, Any]:
        risk_level = str((context or {}).get("riskLevel") or (context or {}).get("risk_level") or "low").lower()
        readiness = float((context or {}).get("readinessScore") or (context or {}).get("readiness_score") or 0.5)
        action_value = getattr(action, "value", str(action)).lower()

        if risk_level in {"critical", "high"} and action_value == "advance":
            return {
                "approved": False,
                "reason": f"Learner risk is {risk_level}; continue or review before advancing.",
            }

        if readiness < 0.25 and action_value == "advance":
            return {
                "approved": False,
                "reason": "Readiness is too low for progression.",
            }

        return {"approved": True, "reason": "Transition approved."}

    def generate_guardian_summary(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        risk = profile.get("risk_summary") or {}
        kpi = profile.get("kpi_snapshot") or {}
        weak_topics: List[str] = list(profile.get("weak_topics") or [])[:3]
        return {
            "student_id": profile.get("user_id"),
            "headline": "Weekly learner summary",
            "risk_level": risk.get("risk_level", "low"),
            "risk_score": risk.get("risk_score", 0.0),
            "summary": (
                f"Learning score: {kpi.get('learning_score', 0)}. "
                f"Readiness: {kpi.get('readiness', 0)}. "
                f"Weak topics: {', '.join(weak_topics) if weak_topics else 'none highlighted'}."
            ),
            "recommended_parent_action": (
                "Encourage a short revision session and follow up with the teacher if risk stays high."
                if risk.get("risk_level") in {"high", "critical"}
                else "Maintain a steady study routine and celebrate progress."
            ),
        }
