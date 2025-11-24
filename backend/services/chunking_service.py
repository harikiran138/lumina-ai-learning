"""
Document chunking service for optimal knowledge ingestion
"""

from typing import List, Dict, Any
from loguru import logger
import re


class ChunkingService:
    def __init__(self, max_chunk_size: int = 512, overlap: int = 50):
        self.max_chunk_size = max_chunk_size
        self.overlap = overlap

    def chunk_text(self, text: str) -> List[Dict[str, Any]]:
        """
        Split text into overlapping chunks optimized for embedding
        """
        try:
            # Clean and normalize text
            text = self._normalize_text(text)
            
            # Split into paragraphs
            paragraphs = self._split_into_paragraphs(text)
            
            # Create chunks
            chunks = []
            current_chunk = ""
            chunk_num = 0
            
            for paragraph in paragraphs:
                # If paragraph is too long, split it
                if len(paragraph) > self.max_chunk_size:
                    if current_chunk:
                        chunks.append({
                            "content": current_chunk.strip(),
                            "chunk_num": chunk_num,
                            "start_char": len("".join([c["content"] for c in chunks])),
                            "length": len(current_chunk)
                        })
                        chunk_num += 1
                        current_chunk = ""
                    
                    # Split long paragraph into smaller chunks
                    sentences = self._split_into_sentences(paragraph)
                    temp_chunk = ""
                    
                    for sentence in sentences:
                        if len(temp_chunk) + len(sentence) <= self.max_chunk_size:
                            temp_chunk += sentence + " "
                        else:
                            if temp_chunk:
                                chunks.append({
                                    "content": temp_chunk.strip(),
                                    "chunk_num": chunk_num,
                                    "start_char": len("".join([c["content"] for c in chunks])),
                                    "length": len(temp_chunk)
                                })
                                chunk_num += 1
                                # Keep overlap from previous chunk
                                words = temp_chunk.split()
                                if len(words) > self.overlap:
                                    temp_chunk = " ".join(words[-self.overlap:]) + " "
                                else:
                                    temp_chunk = ""
                            temp_chunk += sentence + " "
                    
                    if temp_chunk:
                        chunks.append({
                            "content": temp_chunk.strip(),
                            "chunk_num": chunk_num,
                            "start_char": len("".join([c["content"] for c in chunks])),
                            "length": len(temp_chunk)
                        })
                        chunk_num += 1
                        current_chunk = ""
                
                # Handle regular paragraphs
                elif len(current_chunk) + len(paragraph) <= self.max_chunk_size:
                    current_chunk += paragraph + "\n"
                else:
                    if current_chunk:
                        chunks.append({
                            "content": current_chunk.strip(),
                            "chunk_num": chunk_num,
                            "start_char": len("".join([c["content"] for c in chunks])),
                            "length": len(current_chunk)
                        })
                        chunk_num += 1
                        # Keep overlap from previous chunk
                        words = current_chunk.split()
                        if len(words) > self.overlap:
                            current_chunk = " ".join(words[-self.overlap:]) + "\n"
                        else:
                            current_chunk = ""
                    current_chunk += paragraph + "\n"
            
            # Add final chunk
            if current_chunk:
                chunks.append({
                    "content": current_chunk.strip(),
                    "chunk_num": chunk_num,
                    "start_char": len("".join([c["content"] for c in chunks])),
                    "length": len(current_chunk)
                })

            logger.info(f"Split text into {len(chunks)} chunks")
            return chunks

        except Exception as e:
            logger.error(f"Error in chunk_text: {str(e)}")
            return []

    def _normalize_text(self, text: str) -> str:
        """Clean and normalize text"""
        # Replace multiple newlines with single newline
        text = re.sub(r'\n\s*\n', '\n\n', text)
        # Replace multiple spaces with single space
        text = re.sub(r'\s+', ' ', text)
        # Remove special characters but keep basic punctuation
        text = re.sub(r'[^\w\s\.,!?;:-]', ' ', text)
        return text.strip()

    def _split_into_paragraphs(self, text: str) -> List[str]:
        """Split text into paragraphs"""
        paragraphs = text.split('\n\n')
        return [p.strip() for p in paragraphs if p.strip()]

    def _split_into_sentences(self, text: str) -> List[str]:
        """Split text into sentences"""
        # Basic sentence splitting - can be enhanced with more sophisticated NLP
        text = re.sub(r'([.!?])\s*', r'\1\n', text)
        sentences = text.split('\n')
        return [s.strip() for s in sentences if s.strip()]


# Global instance
chunking_service = ChunkingService()