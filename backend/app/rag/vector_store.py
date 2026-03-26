from qdrant_client import QdrantClient
from qdrant_client.http.models import Distance, VectorParams
from app.rag.config import rag_settings
import uuid


class VectorStore:
    def __init__(self):
        self.client = QdrantClient(location=rag_settings.QDRANT_URL)
        self.collection_name = rag_settings.QDRANT_COLLECTION
        self._ensure_collection()

    def _ensure_collection(self):
        try:
            self.client.get_collection(self.collection_name)
        except Exception:
            # Create if not exists
            # BGE-Large dimension is 1024
            self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(size=1024, distance=Distance.COSINE),
            )

    def add_documents(self, texts: list, metadatas: list = None):
        if not texts:
            return
        from app.rag.embeddings import EmbeddingService

        embeddings_service = EmbeddingService.get_embeddings()
        embeddings = embeddings_service.embed_documents(texts)

        from qdrant_client.http.models import PointStruct

        points = []
        for i, (text, vector) in enumerate(zip(texts, embeddings)):
            metadata = metadatas[i] if metadatas else {}
            metadata["text"] = text
            points.append(PointStruct(id=str(uuid.uuid4()), vector=vector, payload=metadata))

        self.client.upsert(collection_name=self.collection_name, points=points)

    def search(self, query: str, top_k: int = 5, filter_options: dict = None):
        from app.rag.embeddings import EmbeddingService
        from qdrant_client.http.models import Filter, FieldCondition, MatchValue

        embeddings_service = EmbeddingService.get_embeddings()
        query_vector = embeddings_service.embed_query(query)

        qdrant_filter = None
        if filter_options:
            conditions = []
            for key, value in filter_options.items():
                if value is not None:
                    # Handle multiple values if provided as a list
                    if isinstance(value, list):
                        from qdrant_client.http.models import MatchAny
                        conditions.append(FieldCondition(key=key, match=MatchAny(any=value)))
                    else:
                        conditions.append(FieldCondition(key=key, match=MatchValue(value=value)))
            if conditions:
                qdrant_filter = Filter(must=conditions)

        results = self.client.search(
            collection_name=self.collection_name, 
            query_vector=query_vector, 
            query_filter=qdrant_filter,
            limit=top_k
        )

        return [hit.payload.get("text", "") for hit in results]
