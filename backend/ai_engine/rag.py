try:
    import chromadb

    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False
    chromadb = None
import uuid
from typing import List, Dict, Any
import os


class TextChunker:
    """
    Standard chunking with overlap.
    """

    def __init__(self, chunk_size: int = 500, overlap: int = 50):
        self.chunk_size = chunk_size
        self.overlap = overlap

    def chunk(self, text: str) -> List[str]:
        if not text:
            return []

        # Split by simple sliding window
        # For simplicity, character based. In prod, update to token based.
        chunks = []
        start = 0
        text_len = len(text)

        while start < text_len:
            end = min(start + self.chunk_size, text_len)
            chunks.append(text[start:end])
            if end == text_len:
                break
            start += self.chunk_size - self.overlap

        return chunks


class MockRAGEngine:
    """Fallback engine when RAG dependencies are missing."""

    def ingest_text(self, text, metadata=None):
        print("Mock RAG: Ingestion simulated (Dependencies missing)")

    def query(self, query_text, n_results=5):
        print("Mock RAG: Query simulated (Dependencies missing)")
        return []


class RAGEngine:
    def __init__(self, collection_name: str = "course_content"):
        if not CHROMADB_AVAILABLE:
            raise ImportError("ChromaDB not installed")

        # 1. Vector DB
        chroma_path = os.getenv("CHROMA_DB_PATH", "./backend/db/chroma")
        os.makedirs(chroma_path, exist_ok=True)
        self.client = chromadb.PersistentClient(path=chroma_path)
        self.collection = self.client.get_or_create_collection(name=collection_name)

        self.device = "cpu"
        self.embedder = None
        self.reranker = None

    def _ensure_models_loaded(self):
        try:
            import torch
            from sentence_transformers import SentenceTransformer, CrossEncoder
        except Exception as exc:
            raise RuntimeError(f"Embedding stack unavailable: {exc}") from exc

        self.device = "cuda" if torch.cuda.is_available() else "cpu"

        if self.embedder is None:
            print(f"Loading Embedding Model on {self.device}...")
            self.embedder = SentenceTransformer("all-MiniLM-L6-v2", device=self.device)

        if self.reranker is None:
            print("Loading Re-Ranker...")
            self.reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2", device=self.device)

    def ingest_text(self, text: str, metadata: Dict[str, Any] = None):
        """
        Pipeline: Chunk -> Embed -> Store
        """
        chunker = TextChunker()
        chunks = chunker.chunk(text)

        if not chunks:
            return

        try:
            self._ensure_models_loaded()
        except Exception as exc:
            print(f"RAG ingest skipped: {exc}")
            return
        ids = [str(uuid.uuid4()) for _ in chunks]
        embeddings = self.embedder.encode(chunks, convert_to_tensor=False).tolist()

        metadata_list = [metadata or {} for _ in chunks]

        self.collection.add(
            ids=ids, documents=chunks, embeddings=embeddings, metadatas=metadata_list
        )
        print(f"Ingested {len(chunks)} chunks.")

    def query(self, query_text: str, n_results: int = 5) -> List[str]:
        """
        Pipeline: Query -> Vector Search -> Re-Rank -> Return Top K
        """
        try:
            if self.collection.count() == 0:
                return []
        except Exception:
            return []

        try:
            self._ensure_models_loaded()
        except Exception as exc:
            print(f"RAG query skipped: {exc}")
            return []

        # 1. Vector Search (Retrieve more than we need for re-ranking)
        query_embedding = self.embedder.encode(query_text).tolist()

        results = self.collection.query(
            query_embeddings=[query_embedding], n_results=n_results * 2  # Fetch 2x candidates
        )

        documents = results["documents"][0] if results["documents"] else []

        if not documents:
            return []

        # 2. Re-Ranking
        # Pair query with each document
        pairs = [[query_text, doc] for doc in documents]
        scores = self.reranker.predict(pairs)

        # Sort by score (descending)
        scored_docs = sorted(zip(documents, scores), key=lambda x: x[1], reverse=True)

        # Return top K
        top_k_docs = [doc for doc, score in scored_docs[:n_results]]

        return top_k_docs


# Singleton instance
_rag_engine = None


def get_rag_engine():
    global _rag_engine
    if _rag_engine is None:
        try:
            if CHROMADB_AVAILABLE:
                _rag_engine = RAGEngine()
            else:
                _rag_engine = MockRAGEngine()
        except Exception as e:
            print(f"RAG Initialization Failed: {e}. using Mock.")
            _rag_engine = MockRAGEngine()
    return _rag_engine
