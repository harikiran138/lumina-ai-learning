"""
Document validation service to ensure content quality and security
"""

import magic
from typing import Tuple, Dict, Any
from loguru import logger
from pathlib import Path
import hashlib
import aiofiles
from config import settings


class DocumentValidator:
    def __init__(self):
        self.max_file_size = settings.max_upload_size  # e.g., 50MB
        self.allowed_mime_types = {
            'application/pdf': ['pdf'],
            'text/plain': ['txt', 'text'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
            'application/msword': ['doc'],
            'text/html': ['html', 'htm'],
            'text/markdown': ['md']
        }
        self.content_rules = {
            'min_content_length': 10,  # Minimum content length
            'max_content_length': 1000000,  # Maximum content length
            'min_word_count': 5,  # Minimum words per chunk
            'max_repetition_ratio': 0.3,  # Maximum allowed repetition
        }

    async def validate_file(self, file_path: str) -> Tuple[bool, Dict[str, Any]]:
        """
        Validate file content and structure
        Returns: (is_valid, validation_info)
        """
        try:
            validation_info = {
                "file_path": file_path,
                "file_size": 0,
                "mime_type": None,
                "extension": Path(file_path).suffix.lower()[1:],
                "content_hash": None,
                "validation_errors": []
            }

            # Check file existence and size
            file_stat = Path(file_path).stat()
            validation_info["file_size"] = file_stat.st_size
            if file_stat.st_size > self.max_file_size:
                validation_info["validation_errors"].append(
                    f"File size ({file_stat.st_size} bytes) exceeds maximum allowed ({self.max_file_size} bytes)"
                )

            # Check file type
            mime_type = magic.from_file(file_path, mime=True)
            validation_info["mime_type"] = mime_type
            if mime_type not in self.allowed_mime_types:
                validation_info["validation_errors"].append(
                    f"Unsupported MIME type: {mime_type}"
                )
            elif validation_info["extension"] not in self.allowed_mime_types[mime_type]:
                validation_info["validation_errors"].append(
                    f"File extension does not match MIME type {mime_type}"
                )

            # Calculate file hash for deduplication
            async with aiofiles.open(file_path, 'rb') as f:
                content = await f.read()
                validation_info["content_hash"] = hashlib.sha256(content).hexdigest()

            # Basic content validation
            if mime_type == 'text/plain':
                async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                    text = await f.read()
                    
                    # Check content length
                    if len(text) < self.content_rules['min_content_length']:
                        validation_info["validation_errors"].append(
                            "Content too short"
                        )
                    elif len(text) > self.content_rules['max_content_length']:
                        validation_info["validation_errors"].append(
                            "Content too long"
                        )

                    # Check word count
                    words = text.split()
                    if len(words) < self.content_rules['min_word_count']:
                        validation_info["validation_errors"].append(
                            f"Word count ({len(words)}) below minimum ({self.content_rules['min_word_count']})"
                        )

                    # Check for excessive repetition
                    repetition_ratio = self._calculate_repetition_ratio(text)
                    if repetition_ratio > self.content_rules['max_repetition_ratio']:
                        validation_info["validation_errors"].append(
                            f"Content contains excessive repetition (ratio: {repetition_ratio:.2f})"
                        )

            return len(validation_info["validation_errors"]) == 0, validation_info

        except Exception as e:
            logger.error(f"Validation error for {file_path}: {str(e)}")
            validation_info["validation_errors"].append(f"Validation error: {str(e)}")
            return False, validation_info

    def _calculate_repetition_ratio(self, text: str) -> float:
        """Calculate the ratio of repeated phrases to total content"""
        words = text.lower().split()
        if not words:
            return 0.0

        # Check for repeated phrases (3-5 words)
        phrases = set()
        repeated_phrases = set()
        
        for n in range(3, 6):
            for i in range(len(words) - n + 1):
                phrase = tuple(words[i:i + n])
                if phrase in phrases:
                    repeated_phrases.add(phrase)
                phrases.add(phrase)

        # Calculate repetition ratio
        total_words = len(words)
        repeated_words = sum(len(phrase) for phrase in repeated_phrases)
        
        return repeated_words / total_words if total_words > 0 else 0.0


# Global instance
document_validator = DocumentValidator()