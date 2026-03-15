import httpx
import os
from typing import Dict, Any, Optional, List

class MLServiceClient:
    """
    Client for interacting with the unified ML service running on port 9000.
    """
    def __init__(self):
        self.base_url = os.getenv("ML_SERVICE_URL", "http://ml-service:9000")
        self.timeout = 5.0

    async def _post(self, endpoint: str, data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                response = await client.post(f"{self.base_url}{endpoint}", json=data)
                response.raise_for_status()
                return response.json()
        except Exception as e:
            # Fallback to local logic or log the error
            print(f"ML Service Error ({endpoint}): {e}")
            return None

    async def update_bkt(self, current_mastery: float, is_correct: bool) -> Optional[float]:
        result = await self._post("/ml/bkt/update", {"current_mastery": current_mastery, "correct": is_correct})
        return result.get("mastery") if result else None

    async def get_fsrs_schedule(self, state: Dict[str, Any], rating: int) -> Optional[Dict[str, Any]]:
        return await self._post("/ml/fsrs/schedule", {"state": state, "rating": rating})

    async def chat_tutor(self, query: str, n_results: int = 5) -> Optional[Dict[str, Any]]:
        return await self._post("/ml/rag/query", {"query": query, "n_results": n_results})

    async def ingest_rag(self, text: str, metadata: Optional[Dict[str, Any]] = None) -> bool:
        result = await self._post("/ml/rag/ingest", {"text": text, "metadata": metadata})
        return result is not None

    async def extract_ocr(self, image_base64: str) -> Optional[str]:
        result = await self._post("/ml/ocr/extract", {"image_base64": image_base64})
        return result.get("text") if result else None

    async def predict_risk(self, user_id: str, behavior_history: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        return await self._post("/ml/risk/predict", {"user_id": user_id, "behavior_history": behavior_history})

    async def cluster_misconceptions(self, raw_misconceptions: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        return await self._post("/ml/analytics/cluster-misconceptions", {"data": raw_misconceptions})

    async def get_growth_trajectory(self, performance_history: List[Dict[str, Any]]) -> Optional[Dict[str, Any]]:
        return await self._post("/ml/analytics/growth-trajectory", {"history": performance_history})

    async def get_ab_test_results(self, variant_a_data: List[float], variant_b_data: List[float]) -> Optional[Dict[str, Any]]:
        return await self._post("/ml/analytics/ab-test", {"variant_a": variant_a_data, "variant_b": variant_b_data})

ml_client = MLServiceClient()
