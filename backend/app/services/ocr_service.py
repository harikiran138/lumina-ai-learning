import io
import math
import logging
import os
from pathlib import Path
from dataclasses import dataclass
from typing import Optional, List
import numpy as np
from PIL import Image, ImageFilter, ImageEnhance
import cv2
from app.core.config import settings
from app.core.logging import structlog

log = structlog.get_logger()

# Lazy-load heavy models so the server starts fast
_trocr_processor = None
_trocr_model = None


def _load_trocr(model_name: str):
    global _trocr_processor, _trocr_model
    if _trocr_processor is None:
        from transformers import TrOCRProcessor, VisionEncoderDecoderModel
        import torch
        log.info("loading_trocr_model", model=model_name)
        _trocr_processor = TrOCRProcessor.from_pretrained(model_name)
        _trocr_model = VisionEncoderDecoderModel.from_pretrained(model_name)
        device = "cuda" if torch.cuda.is_available() else "cpu"
        _trocr_model = _trocr_model.to(device)
        _trocr_model.eval()
        log.info("trocr_loaded", device=device)
    return _trocr_processor, _trocr_model


# ── Image pre-processing ──────────────────────────────────────────────────────

def preprocess_image(image: Image.Image) -> Image.Image:
    """
    Aggressive pre-processing pipeline for handwritten text.
    Order matters: grayscale → denoise → deskew → contrast → sharpen
    """
    img = image.convert("L")
    arr = np.array(img)

    # Denoise (Non-local means)
    arr = cv2.fastNlMeansDenoising(arr, h=10, templateWindowSize=7, searchWindowSize=21)

    # Deskew
    arr = _deskew(arr)

    # Adaptive thresholding
    arr = cv2.adaptiveThreshold(
        arr, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 31, 10
    )

    img = Image.fromarray(arr).convert("RGB")
    img = ImageEnhance.Contrast(img).enhance(1.4)
    img = img.filter(ImageFilter.SHARPEN)

    return img


def _deskew(arr: np.ndarray) -> np.ndarray:
    try:
        coords = np.column_stack(np.where(arr < 128))
        if len(coords) < 100:
            return arr
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
        if abs(angle) < 0.5:
            return arr
        h, w = arr.shape
        M = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
        return cv2.warpAffine(arr, M, (w, h), flags=cv2.INTER_CUBIC,
                               borderMode=cv2.BORDER_REPLICATE)
    except Exception:
        return arr


@dataclass
class QualityResult:
    ok: bool
    reason: Optional[str] = None
    estimated_dpi: Optional[int] = None


def check_image_quality(image: Image.Image, min_dpi: int = 150) -> QualityResult:
    w, h = image.size
    estimated_dpi = int(min(w, h) / 8.27)

    if estimated_dpi < min_dpi:
        return QualityResult(
            ok=False,
            reason=f"Image resolution too low (~{estimated_dpi} DPI).",
            estimated_dpi=estimated_dpi
        )

    arr = np.array(image.convert("L"))
    blur_score = cv2.Laplacian(arr, cv2.CV_64F).var()
    if blur_score < 50:
        return QualityResult(
            ok=False,
            reason=f"Image is too blurry (score={blur_score:.1f}).",
            estimated_dpi=estimated_dpi
        )

    return QualityResult(ok=True, estimated_dpi=estimated_dpi)


# ── Question segmentation ─────────────────────────────────────────────────────

@dataclass
class Segment:
    question_number: int
    image: Image.Image
    bbox: dict


def segment_by_question_markers(image: Image.Image) -> List[Segment]:
    arr = np.array(image.convert("L"))
    h, w = arr.shape
    _, binary = cv2.threshold(arr, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)
    h_proj = binary.sum(axis=1)

    blank_threshold = w * 0.02
    blank_rows = np.where(h_proj < blank_threshold)[0]
    gaps = _group_consecutive(blank_rows, gap=5)

    if len(gaps) < 2:
        return [Segment(1, image, {"x": 0, "y": 0, "w": w, "h": h})]

    boundaries = [0] + [int(np.mean(g)) for g in gaps] + [h]
    segments = []
    for i in range(len(boundaries) - 1):
        y1, y2 = boundaries[i], boundaries[i + 1]
        if y2 - y1 < 40:
            continue
        crop = image.crop((0, y1, w, y2))
        segments.append(Segment(i + 1, crop, {"x": 0, "y": y1, "w": w, "h": y2 - y1}))

    return segments if segments else [Segment(1, image, {"x": 0, "y": 0, "w": w, "h": h})]


def _group_consecutive(indices: np.ndarray, gap: int = 5) -> List[List[int]]:
    if len(indices) == 0:
        return []
    groups, current = [], [indices[0]]
    for idx in indices[1:]:
        if idx - current[-1] <= gap:
            current.append(idx)
        else:
            if len(current) > 10:
                groups.append(current)
            current = [idx]
    if len(current) > 10:
        groups.append(current)
    return groups


# ── Core OCR ──────────────────────────────────────────────────────────────────

@dataclass
class OCRResult:
    text: str
    confidence: float
    is_flagged: bool
    model_used: str


def run_trocr(
    image: Image.Image,
    model_name: str = "microsoft/trocr-large-handwritten",
    confidence_threshold: float = 0.70
) -> OCRResult:
    import torch
    processor, model = _load_trocr(model_name)
    device = next(model.parameters()).device
    processed = preprocess_image(image)
    pixel_values = processor(images=processed, return_tensors="pt").pixel_values.to(device)

    with torch.no_grad():
        outputs = model.generate(
            pixel_values,
            output_scores=True,
            return_dict_in_generate=True,
            max_new_tokens=512,
        )

    text = processor.batch_decode(outputs.sequences, skip_special_tokens=True)[0].strip()
    confidence = _compute_confidence(outputs.scores)

    return OCRResult(
        text=text,
        confidence=confidence,
        is_flagged=confidence < confidence_threshold,
        model_used=model_name,
    )


def _compute_confidence(scores) -> float:
    import torch
    if not scores:
        return 0.0
    probs = []
    for score in scores:
        p = torch.softmax(score, dim=-1)
        top_p = p.max(dim=-1).values.item()
        probs.append(top_p)
    return float(np.mean(probs)) if probs else 0.0


async def run_trocr_api(
    image: Image.Image,
    api_token: str,
    confidence_threshold: float = 0.70,
) -> OCRResult:
    import httpx
    processed = preprocess_image(image)
    buf = io.BytesIO()
    processed.save(buf, format="PNG")
    img_bytes = buf.getvalue()

    headers = {"Authorization": f"Bearer {api_token}"}
    url = "https://api-inference.huggingface.co/models/microsoft/trocr-large-handwritten"

    async with httpx.AsyncClient(timeout=30) as client:
        resp = await client.post(url, headers=headers, content=img_bytes)
        resp.raise_for_status()
        data = resp.json()

    text = data[0].get("generated_text", "") if isinstance(data, list) else data.get("generated_text", "")
    confidence = _heuristic_confidence(text)

    return OCRResult(
        text=text.strip(),
        confidence=confidence,
        is_flagged=confidence < confidence_threshold,
        model_used="microsoft/trocr-large-handwritten (API)",
    )


def _heuristic_confidence(text: str) -> float:
    if not text or len(text) < 3: return 0.2
    alpha_ratio = sum(c.isalpha() for c in text) / max(len(text), 1)
    return min(0.65 + alpha_ratio * 0.3, 0.95)


async def run_gemini_ocr(image: Image.Image, confidence_threshold: float = 0.70) -> OCRResult:
    """Use Gemini Vision API to transcribe handwritten text — fast, no local model needed."""
    import base64
    import httpx

    gemini_key = settings.ASSESSMENT_API_KEY
    if not gemini_key:
        return OCRResult(text="", confidence=0.0, is_flagged=True, model_used="none")

    processed = preprocess_image(image)
    buf = io.BytesIO()
    processed.save(buf, format="PNG")
    img_b64 = base64.b64encode(buf.getvalue()).decode()

    payload = {
        "contents": [{
            "parts": [
                {"text": "Transcribe all handwritten text from this exam paper image exactly as written. Output only the transcribed text, no commentary."},
                {"inline_data": {"mime_type": "image/png", "data": img_b64}}
            ]
        }]
    }

    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={gemini_key}"
    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(url, json=payload)
            resp.raise_for_status()
            data = resp.json()
        text = data["candidates"][0]["content"]["parts"][0]["text"].strip()
        confidence = _heuristic_confidence(text)
        return OCRResult(
            text=text,
            confidence=confidence,
            is_flagged=confidence < confidence_threshold,
            model_used="gemini-1.5-flash-vision",
        )
    except Exception as e:
        log.error("gemini_ocr_failed", error=str(e))
        return OCRResult(text="", confidence=0.0, is_flagged=True, model_used="gemini-error")


class OCRService:
    @staticmethod
    def extract_text(file_path: str, file_type: str = "image") -> str:
        """
        Main entry point for extracting text from a file path.
        Tries local TrOCR; falls back gracefully.
        """
        try:
            import torch
            from transformers import TrOCRProcessor, VisionEncoderDecoderModel
            self._has_local_deps = True
        except ImportError:
            self._has_local_deps = False
        self._local_deps_checked = True

    def _load_model(self):
        """Lazy load the model only when needed for local fallback."""
        if self.model is not None:
            return
        
        self._check_local_dependencies()
        if not self._has_local_deps:
            return

        import torch
        from transformers import TrOCRProcessor, VisionEncoderDecoderModel
        
        device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"
        model_name = "microsoft/trocr-small-handwritten"
        
        print(f"Loading local OCR fallback: {model_name} on {device}...")
        try:
            self.processor = TrOCRProcessor.from_pretrained(model_name)  # nosec B615
            self.model = VisionEncoderDecoderModel.from_pretrained(model_name).to(device)  # nosec B615
            if device == "cpu":
                self.model = torch.quantization.quantize_dynamic(
                    self.model, {torch.nn.Linear}, dtype=torch.qint8
                )
            print("✅ Local OCR fallback loaded.")
        except Exception as e:
            log.warning("local_trocr_unavailable", error=str(e))
            return f"[OCR unavailable — teacher review required]"

ocr_service = OCRService()

