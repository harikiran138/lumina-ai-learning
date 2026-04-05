import logging
import uuid
from datetime import datetime, timezone
from typing import List, Optional, Dict, Any

logger = logging.getLogger(__name__)

async def log_checkin(
    db,
    student_id: str,
    mood: str,
    notes: Optional[str] = None
) -> Dict[str, Any]:
    """
    Log a student's emotional check-in to the emotion_logs table.
    """
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        
        # 1. Log the mood
        entry = {
            "id": str(uuid.uuid4()),
            "student_id": student_id,
            "mood": mood,
            "notes": notes,
            "created_at": now_iso
        }
        
        await db.table("emotion_logs").insert(entry).execute()
        
        # 2. Heuristic check for distress signals
        if mood == "struggling":
            signals = assess_distress_signals(notes if notes else "")
            if signals:
                await send_wellbeing_alert(
                    db,
                    student_id=student_id,
                    signals=signals,
                    severity="medium",
                    triggered_by="system_on_checkin"
                )
        
        return entry
    except Exception as e:
        logger.error(f"Failed to log wellbeing checkin for {student_id}: {str(e)}")
        raise

async def send_wellbeing_alert(
    db,
    student_id: str,
    signals: List[str],
    severity: str,
    triggered_by: str
) -> Dict[str, Any]:
    """
    Trigger a direct alert to the wellbeing/counselor dashboard.
    """
    try:
        now_iso = datetime.now(timezone.utc).isoformat()
        
        alert = {
            "id": str(uuid.uuid4()),
            "student_id": student_id,
            "signals": signals,
            "severity": severity,
            "triggered_by": triggered_by,
            "status": "active",
            "created_at": now_iso
        }
        
        await db.table("wellbeing_alerts").insert(alert).execute()
        
        # TODO: Trigger real-time push notification or email to designated counselor
        
        return alert
    except Exception as e:
        logger.error(f"Failed to send wellbeing alert for {student_id}: {str(e)}")
        raise

def assess_distress_signals(text: str) -> List[str]:
    """
    Basic rule-based heuristic for identifying distress in notes.
    Could be upgraded to use LLM categorization in Phase 2.
    """
    signals = []
    text_lower = text.lower()
    
    keywords = {
        "anxiety": ["anxious", "panic", "scared", "nervous"],
        "depression": ["hopeless", "sad", "unmotivated", "worthless", "heavy"],
        "frustration": ["angry", "stressed", "overwhelmed", "confused"],
        "academic_stress": ["failure", "exam", "grade", "cannot keep up"]
    }
    
    for category, words in keywords.items():
        if any(word in text_lower for word in words):
            signals.append(category)
            
    return signals
