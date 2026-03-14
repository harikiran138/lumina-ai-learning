from typing import Optional
from app.assessment.models.schemas import ResponseTelemetry, AnswerAnalysis

class AuthenticityEngine:
    """
    Analyzes telemetry and semantic signals to estimate the authenticity of a response.
    Focuses on non-punitive signal collection.
    """
    
    def calculate_integrity_score(
        self, 
        telemetry: Optional[ResponseTelemetry], 
        analysis: AnswerAnalysis
    ) -> float:
        """
        Calculates a score from 0.0 to 1.0 indicating confidence in answer originality.
        """
        if not telemetry:
            return 0.5 # Default neutral
            
        score = 1.0
        
        # 1. Paste Detection (Binary Signal)
        if telemetry.paste_detected:
            score -= 0.4
            
        # 2. Timing/Speed heuristic
        # Average typing speed is ~40-60 wpm. ~200-300 cpm.
        # If response is > 50 chars but think_time < 2s, suspicious.
        if telemetry.char_count > 50 and telemetry.think_time_seconds < 2.0:
            score -= 0.3
            
        # 3. Typing Variance (Bot/Script check)
        # Humans have high variance. Robots/Paste have low.
        if telemetry.typing_variance < 0.01 and telemetry.char_count > 20:
             score -= 0.2
             
        # 4. Semantic Confidence (from LLM)
        # If the student is highly confident (high confidence_estimate) but signals are low, 
        # it might be a copy-paste from a high-quality source.
        if analysis.confidence_estimate > 0.9 and score < 0.6:
            # Further deduction for "too perfect" copy
            score -= 0.1

        return max(0.0, min(1.0, score))

authenticity_engine = AuthenticityEngine()
