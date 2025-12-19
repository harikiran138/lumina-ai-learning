try:
    import chromadb
    CHROMADB_AVAILABLE = True
except ImportError:
    CHROMADB_AVAILABLE = False
    chromadb = None
import uuid
import torch
from typing import List, Dict, Any
from sentence_transformers import SentenceTransformer, CrossEncoder

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

class RAGEngine:
    def __init__(self, collection_name: str = "course_content"):
        # 1. Vector DB
        self.client = chromadb.PersistentClient(path="./backend/db/chroma")
        self.collection = self.client.get_or_create_collection(name=collection_name)
        
        # 2. Embedding Model (Small HF Model)
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        # "all-MiniLM-L6-v2" is optimal for speed/accuracy ratio
        print(f"Loading Embedding Model on {self.device}...")
        self.embedder = SentenceTransformer('all-MiniLM-L6-v2', device=self.device)
        
        # 3. Re-Ranker (Cross-Encoder)
        # "ms-marco-MiniLM-L-6-v2" is excellent for Passage Ranking
        print("Loading Re-Ranker...")
        self.reranker = CrossEncoder('cross-encoder/ms-marco-MiniLM-L-6-v2', device=self.device)

    def ingest_text(self, text: str, metadata: Dict[str, Any] = None):
        """
        Pipeline: Chunk -> Embed -> Store
        """
        chunker = TextChunker()
        chunks = chunker.chunk(text)
        
        if not chunks:
            return

        ids = [str(uuid.uuid4()) for _ in chunks]
        embeddings = self.embedder.encode(chunks, convert_to_tensor=False).tolist()
        
        metadata_list = [metadata or {} for _ in chunks]
        
        self.collection.add(
            ids=ids,
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadata_list
        )
        print(f"Ingested {len(chunks)} chunks.")

    def query(self, query_text: str, n_results: int = 5) -> List[str]:
        """
        Pipeline: Query -> Vector Search -> Re-Rank -> Return Top K
        """
        # 1. Vector Search (Retrieve more than we need for re-ranking)
        query_embedding = self.embedder.encode(query_text).tolist()
        
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results * 2 # Fetch 2x candidates
        )
        
        documents = results['documents'][0] if results['documents'] else []
        
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
        _rag_engine = RAGEngine()
    return _rag_engine
