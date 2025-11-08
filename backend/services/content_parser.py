"""
Content parsing service for PDF and text files
"""

import PyPDF2
import pdfplumber
from typing import List, Dict, Any, Tuple
import os
import docx2txt
import mammoth
from loguru import logger
from .chunking_service import chunking_service
from config import settings


class ContentParser:
    def __init__(self):
        self.supported_types = {
            'pdf': self._parse_pdf,
            'text': self._parse_text,
            'txt': self._parse_text,
            'docx': self._parse_docx,
            'doc': self._parse_docx,
            'html': self._parse_text,  # Basic HTML support - consider adding HTML parser
        }

    def parse_file(self, file_path: str, content_type: str) -> Tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """
        Parse content from file and split into chunks
        Returns: (chunks, metadata)
        """
        try:
            content_type = content_type.lower()
            if content_type not in self.supported_types:
                raise ValueError(f"Unsupported content type: {content_type}")

            # Parse content
            parser = self.supported_types[content_type]
            text = parser(file_path)

            # Extract metadata
            metadata = self.extract_metadata(file_path, content_type)

            # Split into chunks
            chunks = chunking_service.chunk_text(text)

            # Add source info to metadata
            for chunk in chunks:
                chunk["source_file"] = os.path.basename(file_path)
                chunk["content_type"] = content_type

            logger.info(f"Parsed {content_type} file: {file_path} into {len(chunks)} chunks")
            return chunks, metadata

        except Exception as e:
            logger.error(f"Error parsing file {file_path}: {str(e)}")
            raise

    def parse_text(self, text: str) -> List[Dict[str, Any]]:
        """
        Parse raw text content and split into chunks
        """
        try:
            # Clean and chunk the text
            chunks = chunking_service.chunk_text(text)
            logger.info(f"Parsed text content into {len(chunks)} chunks")
            return chunks
        except Exception as e:
            logger.error(f"Error parsing text content: {str(e)}")
            raise

    def _parse_pdf(self, file_path: str) -> str:
        """Parse PDF using pdfplumber with PyPDF2 fallback"""
        text = ""
        try:
            # Try pdfplumber first (better for formatted content)
            with pdfplumber.open(file_path) as pdf:
                for page in pdf.pages:
                    page_text = page.extract_text()
                    if page_text:
                        text += page_text + "\n\n"  # Add extra newline for paragraph separation
        except Exception as e:
            logger.warning(f"pdfplumber failed, falling back to PyPDF2: {str(e)}")
            try:
                # Fallback to PyPDF2
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    for page in pdf_reader.pages:
                        text += page.extract_text() + "\n\n"
            except Exception as e2:
                raise Exception(f"PDF parsing failed: {str(e)}, {str(e2)}")

        return text.strip()

    def _parse_text(self, file_path: str) -> str:
        """Parse text file with encoding detection"""
        encodings = ['utf-8', 'latin-1', 'cp1252', 'ascii']
        
        for encoding in encodings:
            try:
                with open(file_path, 'r', encoding=encoding) as file:
                    return file.read().strip()
            except UnicodeDecodeError:
                continue
            
        raise Exception(f"Could not decode text file with any supported encoding")

    def _parse_docx(self, file_path: str) -> str:
        """Parse DOCX files using multiple approaches"""
        text = ""
        try:
            # Try docx2txt first
            text = docx2txt.process(file_path)
        except Exception as e:
            logger.warning(f"docx2txt failed, trying mammoth: {str(e)}")
            try:
                # Fallback to mammoth
                with open(file_path, "rb") as docx_file:
                    result = mammoth.extract_raw_text(docx_file)
                    text = result.value
            except Exception as e2:
                raise Exception(f"DOCX parsing failed: {str(e)}, {str(e2)}")

        return text.strip()

    def extract_metadata(self, file_path: str, content_type: str) -> Dict[str, Any]:
        """Extract comprehensive metadata from file"""
        metadata = {
            "file_name": os.path.basename(file_path),
            "file_size": os.path.getsize(file_path),
            "file_type": content_type,
            "created_at": os.path.getctime(file_path),
            "modified_at": os.path.getmtime(file_path)
        }

        try:
            if content_type == 'pdf':
                with open(file_path, 'rb') as file:
                    pdf_reader = PyPDF2.PdfReader(file)
                    info = pdf_reader.metadata
                    metadata.update({
                        "pages": len(pdf_reader.pages),
                        "title": info.get("/Title", ""),
                        "author": info.get("/Author", ""),
                        "subject": info.get("/Subject", ""),
                        "keywords": info.get("/Keywords", ""),
                        "creator": info.get("/Creator", ""),
                        "producer": info.get("/Producer", "")
                    })
            elif content_type in ['docx', 'doc']:
                # Add DOCX-specific metadata extraction here if needed
                pass

        except Exception as e:
            logger.warning(f"Error extracting metadata: {str(e)}")

        return metadata


# Global instance
content_parser = ContentParser()
