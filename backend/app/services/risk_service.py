from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from app.database.supabase_manager import supabase_db

class RiskAnalysisService:
    """
    Service for identifying students at risk and generating alerts.
    """
    
    def __init__(self, db: Optional[Any] = None):
        self.db = db or supabase_db
    
    async def get_student_risk(self, student_id: str) -> Dict[str, Any]:
        """Fetch the latest risk score for a specific student."""
        client = self.db.get_client()
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
        Implementation follows the weighted model:
        Attendance (40%) + Academic Performance (60%)
        """
        client = self.db.get_client()

        # 1. Fetch Real Attendance (last 30 days)
        # Using a raw RPC or complex select if available, else simple aggregate
        att_res = await client.table("attendance")\
            .select("status")\
            .eq("student_id", student_id)\
            .async_execute()
        
        attendance_records = att_res.data or []
        present_count = sum(1 for r in attendance_records if r["status"] == "present")
        attendance_percentage = present_count / len(attendance_records) if attendance_records else 1.0

        # 2. Fetch Quiz Performance
        quiz_res = await client.table("quiz_results")\
            .select("score_percentage")\
            .eq("student_id", student_id)\
            .async_execute()
        
        quiz_records = quiz_res.data or []
        avg_grade = sum(r["score_percentage"] for r in quiz_records) / len(quiz_records) / 100 if quiz_records else 1.0

        # 3. Score Calculation (Weighted)
        # Higher score = higher risk (0-100 range)
        # Risk from attendance: (1 - attendance) * 100 * 0.4
        # Risk from grade: (1 - avg_grade) * 100 * 0.6
        att_risk = (1.0 - min(1.0, attendance_percentage / 0.75)) * 40 if attendance_percentage < 0.75 else 0
        grade_risk = (1.0 - min(1.0, avg_grade / 0.60)) * 60 if avg_grade < 0.60 else 0
        
        total_risk_score = att_risk + grade_risk
        
        # 4. Determine Level
        if total_risk_score >= 80: level = "critical"
        elif total_risk_score >= 50: level = "high"
        elif total_risk_score >= 20: level = "medium"
        else: level = "low"
        
        reasons = []
        if attendance_percentage < 0.75: reasons.append(f"Critical attendance: {round(attendance_percentage*100)}% (Threshold: 75%)")
        if avg_grade < 0.60: reasons.append(f"Academic struggle: {round(avg_grade*100)}% avg (Threshold: 60%)")
        
        analysis = {
            "student_id": student_id,
            "risk_score": round(total_risk_score, 2),
            "risk_level": level,
            "reasons": reasons,
            "institution_id": institution_id,
            "detected_at": datetime.now(timezone.utc).isoformat()
        }
        
        await client.table("student_risk_scores").insert(analysis).async_execute()
        
        # 4. Trigger intervention if risk is high
        if level in ("high", "critical"):
             from app.services.personalization_service import PersonalizationService
             service = PersonalizationService(db=self.db)
             await service.record_event(
                 student_id, 
                 "RISK_DETECTED",
                 payload={"level": level, "score": score, "reasons": reasons},
                 source="risk_service"
             )
             
        return analysis

def get_risk_analysis_service(db: Optional[Any] = None):
    return RiskAnalysisService(db=db)
