"""
Optimized embedding service with GPU support and batch processing
"""

import torch
from sentence_transformers import SentenceTransformer
from typing import List, Dict
from loguru import logger
import asyncio
from concurrent.futures import ThreadPoolExecutor
from functools import partial
import hashlib
from tqdm import tqdm

from config import settings
from .cache_service import CacheService

class OptimizedEmbeddingService:
    def __init__(self):
        self.model_name = settings.EMBEDDING_MODEL
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.batch_size = 32  # Optimal batch size for most GPUs
        self.model = None
        self.cache = None
        self.thread_pool = ThreadPoolExecutor(max_workers=4)
        self._initialize_model()

    def _initialize_model(self):
        """Initialize the embedding model"""
        try:
            logger.info(f"Loading model {self.model_name} on {self.device}")
            self.model = SentenceTransformer(self.model_name)
            self.model.to(self.device)
            
            # Enable dynamic batching if on GPU
            if self.device == "cuda":
                logger.info("Enabling dynamic batching for GPU")
                self.model.max_seq_length = 512  # Adjust based on your needs
                self.model.batch_size = self.batch_size
            
            logger.info("Model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load model: {str(e)}")
            raise

    async def init_cache(self):
        """Initialize cache service"""
        self.cache = CacheService()
        await self.cache.init()

    def _generate_cache_key(self, text: str) -> str:
        """Generate cache key for text"""
        return hashlib.md5(text.encode()).hexdigest()

    async def generate_embedding(self, text: str) -> List[float]:
        """Generate embedding for a single text with caching"""
        try:
            # Check cache
            if self.cache:
                cache_key = self._generate_cache_key(text)
                cached_embedding = await self.cache.get_cached_embeddings(cache_key)
                if cached_embedding is not None:
                    return cached_embedding

            # Generate embedding in thread pool
            embedding = await asyncio.get_event_loop().run_in_executor(
                self.thread_pool,
                partial(self.model.encode, text, convert_to_numpy=True)
            )

            # Cache the result
            if self.cache:
                await self.cache.cache_embeddings(cache_key, embedding.tolist())

            return embedding.tolist()
        except Exception as e:
            logger.error(f"Error generating embedding: {str(e)}")
            raise

    async def generate_embeddings_batch(
        self,
        texts: List[str],
        show_progress: bool = False
    ) -> List[List[float]]:
        """Generate embeddings for multiple texts in batches"""
        try:
            embeddings = []
            cache_hits = 0
            
            # First, try to get cached embeddings
            if self.cache:
                cached_results = {}
                cache_keys = [self._generate_cache_key(text) for text in texts]
                
                # Get cached embeddings in parallel
                cache_tasks = [
                    self.cache.get_cached_embeddings(key)
                    for key in cache_keys
                ]
                cached_embeddings = await asyncio.gather(*cache_tasks)
                
                # Map cache keys to results
                for key, embedding in zip(cache_keys, cached_embeddings):
                    if embedding is not None:
                        cached_results[key] = embedding
                        cache_hits += 1

            # Process texts that weren't in cache
            texts_to_process = []
            cache_keys_to_update = []
            
            for i, text in enumerate(texts):
                cache_key = self._generate_cache_key(text)
                if cache_key in cached_results:
                    embeddings.append(cached_results[cache_key])
                else:
                    texts_to_process.append(text)
                    cache_keys_to_update.append(cache_key)

            if texts_to_process:
                # Process in batches
                batches = [
                    texts_to_process[i:i + self.batch_size]
                    for i in range(0, len(texts_to_process), self.batch_size)
                ]
                
                pbar = tqdm(total=len(batches), disable=not show_progress)
                
                for batch in batches:
                    # Generate embeddings for batch
                    batch_embeddings = await asyncio.get_event_loop().run_in_executor(
                        self.thread_pool,
                        partial(self.model.encode, batch, convert_to_numpy=True)
                    )
                    
                    # Cache and store results
                    for i, embedding in enumerate(batch_embeddings):
                        embedding_list = embedding.tolist()
                        embeddings.append(embedding_list)
                        
                        if self.cache:
                            cache_key = cache_keys_to_update[i]
                            await self.cache.cache_embeddings(cache_key, embedding_list)
                    
                    pbar.update(1)
                
                pbar.close()

            logger.info(f"Generated {len(embeddings)} embeddings (cache hits: {cache_hits})")
            return embeddings

        except Exception as e:
            logger.error(f"Error generating batch embeddings: {str(e)}")
            raise

    def get_model_info(self) -> Dict[str, str]:
        """Get information about the current model"""
        return {
            "model_name": self.model_name,
            "device": self.device,
            "max_seq_length": self.model.max_seq_length,
            "batch_size": self.batch_size,
            "embedding_dimension": self.model.get_sentence_embedding_dimension()
        }

    async def close(self):
        """Cleanup resources"""
        self.thread_pool.shutdown()
        if self.cache:
            await self.cache.close()