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
        Formula: E = (variance * think_time * correction_ratio * originality)^(1/4)
        """
        if not telemetry:
            return 0.5 # Default neutral
            
        # 1. Variance Signal (Normalized 0-1)
        # Humans have variance between 0.05 and 0.5. 
        # < 0.02 is suspicious (bot), > 0.6 is chaotic.
        variance_signal = min(1.0, telemetry.typing_variance * 5.0) if telemetry.typing_variance > 0.02 else 0.1
        
        # 2. Think Time Signal
        # Expected ~10s per 100 chars for a real human student.
        expected_time = (telemetry.char_count / 10.0)
        think_time_signal = min(1.0, telemetry.think_time_seconds / max(1.0, expected_time))
        
        # 3. Correction Ratio (Human characteristic: we delete and re-type)
        # telemetry.correction_ratio = (deletions + edits) / total_chars
        # If 0.0, very suspect for complex answers.
        correction_ratio = telemetry.correction_ratio if hasattr(telemetry, 'correction_ratio') else 0.1
        correction_signal = min(1.0, correction_ratio * 4.0) # 0.25 is "healthy" amount of editing
        
        # 4. Originality (from Semantic Analysis/LLM)
        # If the answer matches a web result or textbook exactly.
        originality_signal = analysis.originality_score if hasattr(analysis, 'originality_score') else (1.0 - analysis.confidence_estimate * 0.2)

        # Composite Formula: Geometric mean to ensure if ANY signal is near zero, the whole score drops.
        e = (variance_signal * think_time_signal * correction_signal * originality_signal) ** 0.25
        
        # Deduct if paste detected (Hard Penalty)
        if telemetry.paste_detected:
            e *= 0.5

        return round(float(max(0.0, min(1.0, e))), 2)


authenticity_engine = AuthenticityEngine()
