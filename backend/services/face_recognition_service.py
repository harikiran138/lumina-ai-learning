import numpy as np
import cv2
from insightface.app import FaceAnalysis
import logging
from typing import List, Tuple, Optional, Dict
import os
from pathlib import Path

logger = logging.getLogger(__name__)

class FaceRecognitionService:
    def __init__(self, model_path: str = None):
        self.model = None
        self.model_path = model_path or os.path.join(os.path.dirname(__file__), 'models')
        self._load_model()

    def _load_model(self):
        """Load InsightFace model for face recognition"""
        try:
            # Create model directory if it doesn't exist
            Path(self.model_path).mkdir(parents=True, exist_ok=True)

            # Initialize face analysis app
            self.model = FaceAnalysis(name='buffalo_l', root=self.model_path)
            self.model.prepare(ctx_id=0, det_size=(640, 640))

            logger.info("Face recognition model loaded successfully")
        except Exception as e:
            logger.error(f"Failed to load face recognition model: {str(e)}")
            self.model = None

    def extract_face_embedding(self, image_path: str) -> Optional[np.ndarray]:
        """Extract face embedding from image file"""
        try:
            if not self.model:
                logger.error("Face recognition model not loaded")
                return None

            # Read image
            img = cv2.imread(image_path)
            if img is None:
                logger.error(f"Could not read image: {image_path}")
                return None

            # Detect faces
            faces = self.model.get(img)

            if len(faces) == 0:
                logger.warning(f"No faces detected in image: {image_path}")
                return None
            elif len(faces) > 1:
                logger.warning(f"Multiple faces detected in image: {image_path}, using first face")

            # Return embedding of first face
            return faces[0].embedding

        except Exception as e:
            logger.error(f"Error extracting face embedding: {str(e)}")
            return None

    def extract_face_embedding_from_bytes(self, image_bytes: bytes) -> Optional[np.ndarray]:
        """Extract face embedding from image bytes"""
        try:
            if not self.model:
                logger.error("Face recognition model not loaded")
                return None

            # Convert bytes to numpy array
            nparr = np.frombuffer(image_bytes, np.uint8)
            img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)

            if img is None:
                logger.error("Could not decode image from bytes")
                return None

            # Detect faces
            faces = self.model.get(img)

            if len(faces) == 0:
                logger.warning("No faces detected in image")
                return None
            elif len(faces) > 1:
                logger.warning("Multiple faces detected in image, using first face")

            # Return embedding of first face
            return faces[0].embedding

        except Exception as e:
            logger.error(f"Error extracting face embedding from bytes: {str(e)}")
            return None

    def compare_faces(self, embedding1: np.ndarray, embedding2: np.ndarray) -> Tuple[bool, float]:
        """Compare two face embeddings and return similarity score"""
        try:
            if not self.model:
                logger.error("Face recognition model not loaded")
                return False, 0.0

            # Calculate cosine similarity
            similarity = np.dot(embedding1, embedding2) / (
                np.linalg.norm(embedding1) * np.linalg.norm(embedding2)
            )

            # Convert to distance (0 = identical, higher = more different)
            distance = 1 - similarity

            # Threshold for match (lower distance = better match)
            threshold = 0.6  # This can be adjusted based on requirements
            is_match = distance < threshold

            return is_match, float(similarity)

        except Exception as e:
            logger.error(f"Error comparing faces: {str(e)}")
            return False, 0.0

    def verify_attendance(self, student_embedding: np.ndarray, captured_embedding: np.ndarray,
                         threshold: float = 0.6) -> Dict:
        """Verify attendance by comparing stored student embedding with captured embedding"""
        try:
            is_match, similarity = self.compare_faces(student_embedding, captured_embedding)

            result = {
                "is_present": is_match,
                "confidence_score": float(similarity),
                "threshold_used": threshold,
                "distance": float(1 - similarity)
            }

            return result

        except Exception as e:
            logger.error(f"Error verifying attendance: {str(e)}")
            return {
                "is_present": False,
                "confidence_score": 0.0,
                "threshold_used": threshold,
                "distance": 1.0,
                "error": str(e)
            }

    def detect_faces(self, image_path: str) -> List[Dict]:
        """Detect faces in image and return bounding boxes"""
        try:
            if not self.model:
                logger.error("Face recognition model not loaded")
                return []

            img = cv2.imread(image_path)
            if img is None:
                logger.error(f"Could not read image: {image_path}")
                return []

            faces = self.model.get(img)

            face_info = []
            for face in faces:
                bbox = face.bbox.astype(int).tolist()
                face_info.append({
                    "bbox": bbox,
                    "confidence": float(face.det_score),
                    "embedding": face.embedding.tolist()
                })

            return face_info

        except Exception as e:
            logger.error(f"Error detecting faces: {str(e)}")
            return []

    def batch_extract_embeddings(self, image_paths: List[str]) -> List[Optional[np.ndarray]]:
        """Extract embeddings from multiple images"""
        embeddings = []
        for path in image_paths:
            embedding = self.extract_face_embedding(path)
            embeddings.append(embedding)
        return embeddings

    def save_embedding(self, student_id: str, embedding: np.ndarray, save_path: str = None) -> bool:
        """Save face embedding to file for persistence"""
        try:
            if save_path is None:
                save_path = os.path.join(self.model_path, 'embeddings', f'{student_id}.npy')

            # Create directory if it doesn't exist
            os.makedirs(os.path.dirname(save_path), exist_ok=True)

            # Save embedding
            np.save(save_path, embedding)
            return True

        except Exception as e:
            logger.error(f"Error saving embedding: {str(e)}")
            return False

    def load_embedding(self, student_id: str, load_path: str = None) -> Optional[np.ndarray]:
        """Load face embedding from file"""
        try:
            if load_path is None:
                load_path = os.path.join(self.model_path, 'embeddings', f'{student_id}.npy')

            if not os.path.exists(load_path):
                return None

            return np.load(load_path)

        except Exception as e:
            logger.error(f"Error loading embedding: {str(e)}")
            return None
