from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.database.supabase_manager import supabase_db

class RiskAnalysisService:
    """
    Service for identifying students at risk and generating alerts.
    """
    
    async def get_student_risk(self, student_id: str) -> Dict[str, Any]:
        """Fetch the latest risk score for a specific student."""
        client = supabase_db.get_client()
        result = client.table("student_risk_scores")\
            .select("*")\
            .eq("student_id", student_id)\
            .order("detected_at", desc=True)\
            .limit(1)\
            .execute()
            
        return result.data[0] if result.data else None

    async def run_risk_analysis(self, student_id: str, institution_id: str) -> Dict[str, Any]:
        """
        Analyze student data (attendance, grades, engagement) and calculate risk score.
        """
        # 1. Fetch metrics (Weighted approach)
        # Mocking values here - in production, we'd query attendance, quiz results, etc.
        attendance_percentage = 0.65  # Example: 65% attendance
        quiz_average = 0.58           # Example: 58% average quiz score
        engagement_days = 2           # Example: 2 logins in last week
        
        # 2. Score Calculation (Weighted)
        # Higher score = higher risk
        score = (1 - attendance_percentage) * 40 + (1 - quiz_average) * 40 + (max(0, 7 - engagement_days) / 7) * 20
        
        # 3. Determine Level
        if score > 85: level = "critical"
        elif score > 60: level = "high"
        elif score > 35: level = "medium"
        else: level = "low"
        
        reasons = []
        if attendance_percentage < 0.75: reasons.append(f"Low attendance: {round(attendance_percentage*100)}%")
        if quiz_average < 0.70: reasons.append(f"Struggling with content: {round(quiz_average*100)}% average")
        if engagement_days < 3: reasons.append("Low login frequency")
        
        analysis = {
            "student_id": student_id,
            "risk_score": round(score, 2),
            "risk_level": level,
            "reasons": reasons,
            "institution_id": institution_id,
            "detected_at": datetime.now(timezone.utc).isoformat()
        }
        
        await supabase_db.insert("student_risk_scores", analysis)
        
        # 4. Trigger intervention if risk is high
        if level in ("high", "critical"):
             from app.services.personalization_service import get_personalization_service
             service = get_personalization_service()
             await service.record_event(
                 student_id, 
                 "RISK_DETECTED",
                 payload={"level": level, "score": score, "reasons": reasons},
                 source="risk_service"
             )
             
        return analysis

def get_risk_analysis_service():
    return RiskAnalysisService()
