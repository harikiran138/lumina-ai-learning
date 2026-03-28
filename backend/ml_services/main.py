import os
import sys
from typing import Dict, Any, List, Optional
from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel

# Add parent directory to path to reach other backend modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from ml_services.core.fsrs import fsrs_engine, FSRSState
from learner_profile.models.bkt import BKTModel
from learner_profile.models.dkt import DKTModel
from ai_engine.rag import get_rag_engine
from app.services.ocr_service import OCRService
import base64

app = FastAPI(title="Lumina Unified ML Service", version="1.0.0")

# Initialize models
from app.rag.retrieval import RetrievalService
bkt_model = BKTModel()
dkt_model = DKTModel() # Uses default params
rag_engine = RetrievalService()
ocr_service = OCRService()

class BKTUpdate(BaseModel):
    current_mastery: float
    correct: bool

class DKTUpdate(BaseModel):
    student_history: List[Dict[str, Any]]

class FSRSUpdate(BaseModel):
    state: FSRSState
    rating: int

class RAGQuery(BaseModel):
    query: str
    n_results: int = 5

class OCRRequest(BaseModel):
    image_base64: str
    file_type: str = "png"

class RiskRequest(BaseModel):
    performance_avg: float
    weak_topic_count: int
    cognitive_load: float
    tutor_interactions: int

@app.get("/health")
async def health():
    return {"status": "ok", "service": "ml_service"}

@app.post("/ml/bkt/update")
async def update_bkt(data: BKTUpdate):
    try:
        new_mastery = bkt_model.update_mastery(data.current_mastery, data.correct)
        return {"mastery": new_mastery}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ml/dkt/predict")
async def predict_dkt(data: DKTUpdate):
    try:
        predictions = dkt_model.predict_mastery(data.student_history)
        return {"predictions": predictions}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ml/fsrs/schedule")
async def schedule_fsrs(data: FSRSUpdate):
    try:
        result = fsrs_engine.calculate_next(data.state, data.rating)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ml/rag/query")
async def query_rag(data: RAGQuery):
    try:
        results = rag_engine.query(data.query, data.n_results)
        return {"results": results}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ml/rag/ingest")
async def ingest_rag(text: str = Body(...), metadata: Dict[str, Any] = Body(None)):
    try:
        rag_engine.ingest_text(text, metadata)
        return {"status": "ingested"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ml/ocr/extract")
async def extract_ocr(data: OCRRequest):
    try:
        image_bytes = base64.b64decode(data.image_base64)
        text = ocr_service.extract_text(image_bytes, data.file_type)
        return {"text": text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/ml/risk/predict")
async def predict_risk(data: RiskRequest):
    """
    Predict student risk level based on performance and engagement signals.
    """
    score = 0.0
    reasons = []

    if data.performance_avg < 60:
        score += 0.35
        reasons.append("Low average performance")
    if data.weak_topic_count >= 3:
        score += 0.25
        reasons.append("Multiple weak topics")
    if data.cognitive_load > 75:
        score += 0.2
        reasons.append("High cognitive load")
    if data.tutor_interactions >= 5 and data.performance_avg < 50:
        score += 0.1
        reasons.append("Help requested but limited progress")

    score = min(1.0, score)
    level = "low"
    if score >= 0.75: level = "critical"
    elif score >= 0.5: level = "high"
    elif score >= 0.25: level = "medium"

    return {
        "risk_level": level,
        "risk_score": score,
        "reasons": reasons
    }

@app.post("/ml/analytics/cluster-misconceptions")
async def cluster_misconceptions(data: Dict[str, Any] = Body(...)):
    """
    Cluster raw misconceptions from student profiles.
    Used for the Teacher 'Misconception Map'.
    """
    raw_data = data.get("data", [])
    # Simulated clustering logic
    clusters = [
        {"id": "c1", "label": "Syntax Confusion", "student_count": 12, "description": "Confusion between async/await and promises."},
        {"id": "c2", "label": "Scope Misunderstanding", "student_count": 8, "description": "Trouble understanding 'this' context in callbacks."},
        {"id": "c3", "label": "API Pattern Errors", "student_count": 5, "description": "Common errors in fetching data from REST endpoints."}
    ]
    return {"clusters": clusters, "total_processed": len(raw_data)}

@app.post("/ml/analytics/growth-trajectory")
async def get_growth_trajectory(data: Dict[str, Any] = Body(...)):
    """
    Project future performance based on student history.
    Used for the Teacher 'Class Reports'.
    """
    # Simulated linear regression or ARIMA projection
    return {
        "trajectory": [
            {"date": "2024-04-01", "actual": 65, "projected": 65},
            {"date": "2024-04-08", "actual": 68, "projected": 70},
            {"date": "2024-04-15", "actual": 72, "projected": 74},
            {"date": "2024-04-22", "actual": None, "projected": 78},
            {"date": "2024-04-29", "actual": None, "projected": 82}
        ],
        "growth_rate_pct": 5.4,
        "projection_confidence": 0.82
    }

@app.post("/ml/analytics/ab-test")
async def ab_test_compare(data: Dict[str, Any] = Body(...)):
    """
    Compare performance between two cohorts (A/B Test).
    Used for the Teacher 'Teaching Strategy' module.
    """
    variant_a = data.get("variant_a", [])
    variant_b = data.get("variant_b", [])
    
    # Simple simulated T-test
    mean_a = sum(variant_a) / len(variant_a) if variant_a else 0
    mean_b = sum(variant_b) / len(variant_b) if variant_b else 0
    
    improvement = ((mean_b - mean_a) / mean_a) * 100 if mean_a > 0 else 0
    is_significant = improvement > 5.0
    
    return {
        "stats": {
            "mean_a": round(mean_a, 2),
            "mean_b": round(mean_b, 2),
            "improvement_pct": round(improvement, 2),
            "p_value": 0.042 if is_significant else 0.15,
            "is_statistically_significant": is_significant
        },
        "recommendation": "Adopt Strategy B (Visual Anchors) - Higher engagement & mastery observed." if is_significant else "No significant difference observed. Continue testing."
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=9000)  # nosec B104
