"""
Enhanced content extraction service for rich documents
"""

import pdfplumber
from PIL import Image
import pytesseract
import cv2
import pandas as pd
from typing import List, Dict, Any
from loguru import logger
import tempfile
import os
from config import settings


class ContentExtractor:
    def __init__(self):
        # Configure OCR
        if settings.TESSERACT_PATH:
            pytesseract.pytesseract.tesseract_cmd = settings.TESSERACT_PATH

    def extract_tables_from_pdf(self, pdf_path: str) -> List[Dict[str, Any]]:
        """Extract tables from PDF with position information"""
        tables = []
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    # Extract tables from the page
                    page_tables = page.extract_tables()
                    
                    for table_num, table_data in enumerate(page_tables, 1):
                        # Convert table to pandas DataFrame
                        df = pd.DataFrame(table_data)
                        
                        # Get table position on page
                        table_bbox = page.find_tables()[table_num - 1].bbox
                        
                        table_info = {
                            "page_number": page_num,
                            "table_number": table_num,
                            "position": {
                                "top": table_bbox[1],
                                "left": table_bbox[0],
                                "bottom": table_bbox[3],
                                "right": table_bbox[2]
                            },
                            "data": df.to_dict(orient='records'),
                            "headers": df.columns.tolist() if not df.empty else [],
                            "num_rows": len(df),
                            "num_cols": len(df.columns)
                        }
                        tables.append(table_info)
                        
            logger.info(f"Extracted {len(tables)} tables from PDF")
            return tables
            
        except Exception as e:
            logger.error(f"Table extraction error: {str(e)}")
            return []

    def extract_images_from_pdf(self, pdf_path: str) -> List[Dict[str, Any]]:
        """Extract images from PDF with OCR and position information"""
        images = []
        try:
            with pdfplumber.open(pdf_path) as pdf:
                for page_num, page in enumerate(pdf.pages, 1):
                    # Extract images from the page
                    image_list = page.images
                    
                    for img_num, img in enumerate(image_list, 1):
                        # Save image to temporary file
                        with tempfile.NamedTemporaryFile(suffix='.png', delete=False) as tmp:
                            try:
                                # Extract and save image
                                img_data = img["stream"].get_data()
                                tmp.write(img_data)
                                tmp.flush()
                                
                                # Perform OCR on image
                                ocr_text = pytesseract.image_to_string(
                                    Image.open(tmp.name)
                                )
                                
                                # Get image metadata
                                image_info = {
                                    "page_number": page_num,
                                    "image_number": img_num,
                                    "position": {
                                        "top": img["y0"],
                                        "left": img["x0"],
                                        "bottom": img["y1"],
                                        "right": img["x1"]
                                    },
                                    "size": {
                                        "width": img["width"],
                                        "height": img["height"]
                                    },
                                    "ocr_text": ocr_text.strip(),
                                    "image_type": img.get("image_type", "unknown"),
                                    "color_space": img.get("colorspace", "unknown")
                                }
                                images.append(image_info)
                                
                            finally:
                                # Clean up temporary file
                                os.unlink(tmp.name)
                                
            logger.info(f"Extracted {len(images)} images from PDF")
            return images
            
        except Exception as e:
            logger.error(f"Image extraction error: {str(e)}")
            return []

    def extract_diagrams(self, image_path: str) -> Dict[str, Any]:
        """Extract and analyze diagrams from images"""
        try:
            # Read image
            img = cv2.imread(image_path)
            if img is None:
                raise ValueError("Could not read image")

            # Convert to grayscale
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
            
            # Edge detection
            edges = cv2.Canny(gray, 50, 150)
            
            # Find contours
            contours, _ = cv2.findContours(
                edges, 
                cv2.RETR_EXTERNAL, 
                cv2.CHAIN_APPROX_SIMPLE
            )
            
            # Analyze shapes
            shapes = []
            for contour in contours:
                # Get shape properties
                area = cv2.contourArea(contour)
                perimeter = cv2.arcLength(contour, True)
                
                if area > 100:  # Filter out small noise
                    # Approximate shape
                    approx = cv2.approxPolyDP(
                        contour,
                        0.04 * perimeter,
                        True
                    )
                    
                    # Determine shape type
                    vertices = len(approx)
                    shape_type = self._classify_shape(vertices)
                    
                    # Get bounding box
                    x, y, w, h = cv2.boundingRect(contour)
                    
                    shape_info = {
                        "type": shape_type,
                        "vertices": vertices,
                        "area": area,
                        "position": {
                            "x": int(x),
                            "y": int(y),
                            "width": int(w),
                            "height": int(h)
                        }
                    }
                    shapes.append(shape_info)
            
            # Get any text in the diagram using OCR
            ocr_text = pytesseract.image_to_string(gray)
            
            return {
                "shapes": shapes,
                "num_shapes": len(shapes),
                "text_content": ocr_text.strip(),
                "size": {
                    "width": img.shape[1],
                    "height": img.shape[0]
                }
            }
            
        except Exception as e:
            logger.error(f"Diagram extraction error: {str(e)}")
            return {
                "shapes": [],
                "num_shapes": 0,
                "text_content": "",
                "size": {"width": 0, "height": 0},
                "error": str(e)
            }

    def _classify_shape(self, vertices: int) -> str:
        """Classify shape based on number of vertices"""
        shape_types = {
            3: "triangle",
            4: "rectangle/square",
            5: "pentagon",
            6: "hexagon",
            8: "octagon"
        }
        return shape_types.get(vertices, "polygon")


# Global instance
content_extractor = ContentExtractor()