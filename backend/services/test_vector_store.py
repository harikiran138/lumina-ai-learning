"""Mock vector store for testing"""

from typing import List, Dict, Any, Optional
import numpy as np

class MockVectorStore:
    def __init__(self):
        self.vectors = {}
        self.metadata = {}
        self.contents = {}

    async def insert_batch(
        self,
        ids: List[str],
        embeddings: List[List[float]],
        contents: List[str],
        metadatas: Optional[List[Dict[str, Any]]] = None
    ) -> bool:
        """Mock inserting vectors into store"""
        try:
            for i, _id in enumerate(ids):
                self.vectors[_id] = embeddings[i]
                self.contents[_id] = contents[i]
                if metadatas:
                    self.metadata[_id] = metadatas[i]
            return True
        except Exception:
            return False

    async def search(
        self,
        query_embedding: List[float],
        limit: int = 10,
        filter_dict: Optional[Dict[str, Any]] = None
    ) -> List[Dict[str, Any]]:
        """Mock vector similarity search"""
        # Mock some content for testing
        mock_content = {
            "python_basics": [
                {
                    "id": "python_basics_1",
                    "score": 0.9,
                    "content": "python_basics requires knowledge of programming fundamentals",
                    "metadata": {"content_type": "lesson"}
                }
            ],
            "classes": [
                {
                    "id": "classes_1",
                    "score": 0.8,
                    "content": "classes requires knowledge of python_basics and object-oriented programming",
                    "metadata": {"content_type": "lesson"}
                }
            ],
            "functions": [
                {
                    "id": "functions_1",
                    "score": 0.85,
                    "content": "functions requires knowledge of python_basics",
                    "metadata": {"content_type": "lesson"}
                }
            ]
        }

        # Determine which skill is being queried based on embedding (simplified)
        # In real implementation, this would be based on semantic search
        query_text = "python_basics" if len(query_embedding) > 0 else ""
        if "python" in str(query_embedding[:5]):  # Simplified detection
            query_text = "python_basics"
        elif "class" in str(query_embedding[:5]):
            query_text = "classes"
        elif "function" in str(query_embedding[:5]):
            query_text = "functions"

        if query_text in mock_content:
            return mock_content[query_text][:limit]

        # Fallback to original logic
        results = []
        query_vector = np.array(query_embedding)

        for _id, vector in self.vectors.items():
            if filter_dict and self.metadata[_id]:
                matches = all(
                    self.metadata[_id].get(k) == v
                    for k, v in filter_dict.items()
                )
                if not matches:
                    continue

            similarity = 1 - np.linalg.norm(query_vector - np.array(vector))
            results.append({
                "id": _id,
                "score": float(similarity),
                "content": self.contents[_id],
                "metadata": self.metadata.get(_id, {})
            })

        results.sort(key=lambda x: x["score"], reverse=True)
        return results[:limit]

# Create mock instance
vector_store = MockVectorStore()