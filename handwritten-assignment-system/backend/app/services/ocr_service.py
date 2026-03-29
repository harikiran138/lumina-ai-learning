"""
OCR Service — TrOCR via HuggingFace Transformers.

Key design decisions:
  • Uses microsoft/trocr-large-handwritten (best accuracy for cursive / mixed)
  • Confidence score = mean token probability (beam search)
  • Flags low-confidence results instead of silently passing garbage
  • Pre-processes image aggressively (deskew, denoise, contrast) BEFORE OCR
  • Returns per-segment results so teacher can review each question individually
"""
import io
import math
import logging
from pathlib import Path
from dataclasses import dataclass
from typing import Optional

import numpy as np
from PIL import Image, ImageFilter, ImageEnhance, ImageOps
import cv2

logger = logging.getLogger(__name__)

# Lazy-load heavy models so the server starts fast
_trocr_processor = None
_trocr_model = None


def _load_trocr(model_name: str):
    global _trocr_processor, _trocr_model
    if _trocr_processor is None:
        from transformers import TrOCRProcessor, VisionEncoderDecoderModel
        import torch
        logger.info(f"Loading TrOCR model: {model_name}")
        _trocr_processor = TrOCRProcessor.from_pretrained(model_name)
        _trocr_model = VisionEncoderDecoderModel.from_pretrained(model_name)
        device = "cuda" if torch.cuda.is_available() else "cpu"
        _trocr_model = _trocr_model.to(device)
        _trocr_model.eval()
        logger.info(f"TrOCR loaded on {device}")
    return _trocr_processor, _trocr_model


# ── Image pre-processing ──────────────────────────────────────────────────────

def preprocess_image(image: Image.Image) -> Image.Image:
    """
    Aggressive pre-processing pipeline for handwritten text.
    Order matters: grayscale → denoise → deskew → contrast → sharpen
    """
    # 1. Convert to grayscale
    img = image.convert("L")

    # 2. Convert to numpy for OpenCV operations
    arr = np.array(img)

    # 3. Denoise (Non-local means — best for preserving strokes)
    arr = cv2.fastNlMeansDenoising(arr, h=10, templateWindowSize=7, searchWindowSize=21)

    # 4. Deskew
    arr = _deskew(arr)

    # 5. Adaptive thresholding (handles uneven lighting from phone cameras)
    arr = cv2.adaptiveThreshold(
        arr, 255,
        cv2.ADAPTIVE_THRESH_GAUSSIAN_C,
        cv2.THRESH_BINARY, 31, 10
    )

    # 6. Back to PIL
    img = Image.fromarray(arr).convert("RGB")

    # 7. Contrast + sharpening
    img = ImageEnhance.Contrast(img).enhance(1.4)
    img = img.filter(ImageFilter.SHARPEN)

    return img


def _deskew(arr: np.ndarray) -> np.ndarray:
    """Correct rotation using projection-profile method."""
    try:
        coords = np.column_stack(np.where(arr < 128))
        if len(coords) < 100:
            return arr
        angle = cv2.minAreaRect(coords)[-1]
        if angle < -45:
            angle = -(90 + angle)
        else:
            angle = -angle
        if abs(angle) < 0.5:  # skip tiny corrections
            return arr
        h, w = arr.shape
        M = cv2.getRotationMatrix2D((w / 2, h / 2), angle, 1.0)
        return cv2.warpAffine(arr, M, (w, h), flags=cv2.INTER_CUBIC,
                              borderMode=cv2.BORDER_REPLICATE)
    except Exception:
        return arr


# ── Quality gate ──────────────────────────────────────────────────────────────

@dataclass
class QualityResult:
    ok: bool
    reason: Optional[str] = None
    estimated_dpi: Optional[int] = None


def check_image_quality(image: Image.Image, min_dpi: int = 150) -> QualityResult:
    """
    Reject images that will produce unusable OCR.
    Checks: minimum resolution, blur detection.
    """
    w, h = image.size

    # Estimate DPI from pixel count (A4 assumption)
    estimated_dpi = int(min(w, h) / 8.27)   # 8.27 inches = A4 short side

    if estimated_dpi < min_dpi:
        return QualityResult(
            ok=False,
            reason=f"Image resolution too low (~{estimated_dpi} DPI). Please scan at 300 DPI or photograph in good light.",
            estimated_dpi=estimated_dpi
        )

    # Blur detection via Laplacian variance
    arr = np.array(image.convert("L"))
    blur_score = cv2.Laplacian(arr, cv2.CV_64F).var()
    if blur_score < 50:
        return QualityResult(
            ok=False,
            reason=f"Image is too blurry (score={blur_score:.1f}). Please hold the camera steady or use a scanner.",
            estimated_dpi=estimated_dpi
        )

    return QualityResult(ok=True, estimated_dpi=estimated_dpi)


# ── Question segmentation ─────────────────────────────────────────────────────

@dataclass
class Segment:
    question_number: int
    image: Image.Image
    bbox: dict   # {x, y, w, h} in original image coords


def segment_by_question_markers(image: Image.Image) -> list[Segment]:
    """
    Strategy 1 (recommended): Students write 'Q1:', 'Q2:' etc.
    Uses horizontal projection profile to find section boundaries.

    If no markers found → returns the whole image as Q1 (fallback).
    """
    arr = np.array(image.convert("L"))
    h, w = arr.shape

    # Binarize
    _, binary = cv2.threshold(arr, 0, 255, cv2.THRESH_BINARY_INV + cv2.THRESH_OTSU)

    # Horizontal projection: sum of dark pixels per row
    h_proj = binary.sum(axis=1)

    # Find rows with very little ink — potential section dividers
    blank_threshold = w * 0.02   # less than 2% of width has ink
    blank_rows = np.where(h_proj < blank_threshold)[0]

    # Group consecutive blank rows into gaps
    gaps = _group_consecutive(blank_rows, gap=5)

    if len(gaps) < 2:
        # No clear section breaks — return whole page
        return [Segment(
            question_number=1,
            image=image,
            bbox={"x": 0, "y": 0, "w": w, "h": h}
        )]

    # Build segments from gaps
    boundaries = [0] + [int(np.mean(g)) for g in gaps] + [h]
    segments = []
    for i in range(len(boundaries) - 1):
        y1, y2 = boundaries[i], boundaries[i + 1]
        if y2 - y1 < 40:   # skip tiny slices
            continue
        crop = image.crop((0, y1, w, y2))
        segments.append(Segment(
            question_number=i + 1,
            image=crop,
            bbox={"x": 0, "y": y1, "w": w, "h": y2 - y1}
        ))

    return segments if segments else [Segment(1, image, {"x": 0, "y": 0, "w": w, "h": h})]


def _group_consecutive(indices: np.ndarray, gap: int = 5) -> list[list[int]]:
    if len(indices) == 0:
        return []
    groups, current = [], [indices[0]]
    for idx in indices[1:]:
        if idx - current[-1] <= gap:
            current.append(idx)
        else:
            if len(current) > 10:   # only real gaps, not noise
                groups.append(current)
            current = [idx]
    if len(current) > 10:
        groups.append(current)
    return groups


# ── Core OCR ──────────────────────────────────────────────────────────────────

@dataclass
class OCRResult:
    text: str
    confidence: float       # 0.0 – 1.0
    is_flagged: bool        # True if confidence < threshold
    model_used: str


def run_trocr(
    image: Image.Image,
    model_name: str = "microsoft/trocr-large-handwritten",
    confidence_threshold: float = 0.70
) -> OCRResult:
    """
    Run TrOCR on a single image segment.
    Returns text + confidence score.
    """
    import torch

    processor, model = _load_trocr(model_name)
    device = next(model.parameters()).device

    # Pre-process
    processed = preprocess_image(image)

    # Tokenize
    pixel_values = processor(images=processed, return_tensors="pt").pixel_values.to(device)

    with torch.no_grad():
        outputs = model.generate(
            pixel_values,
            output_scores=True,
            return_dict_in_generate=True,
            max_new_tokens=512,
        )

    # Decode text
    generated_ids = outputs.sequences
    text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0].strip()

    # Confidence: geometric mean of top-1 token probabilities
    confidence = _compute_confidence(outputs.scores)

    return OCRResult(
        text=text,
        confidence=confidence,
        is_flagged=confidence < confidence_threshold,
        model_used=model_name,
    )


def _compute_confidence(scores) -> float:
    """Mean probability of the chosen token at each step."""
    import torch
    if not scores:
        return 0.0
    probs = []
    for score in scores:
        p = torch.softmax(score, dim=-1)
        top_p = p.max(dim=-1).values.item()
        probs.append(top_p)
    return float(np.mean(probs)) if probs else 0.0


# ── HuggingFace Inference API fallback (no GPU needed) ───────────────────────

async def run_trocr_api(
    image: Image.Image,
    api_token: str,
    confidence_threshold: float = 0.70,
) -> OCRResult:
    """
    Use HuggingFace Inference API instead of local model.
    Slower but works without a GPU. Good for development / small load.
    """
    import httpx, base64

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

    # HF Inference API returns list of {generated_text: ...}
    text = ""
    if isinstance(data, list) and data:
        text = data[0].get("generated_text", "")
    elif isinstance(data, dict):
        text = data.get("generated_text", "")

    # No confidence from API → use heuristic (text length / word count plausibility)
    confidence = _heuristic_confidence(text)

    return OCRResult(
        text=text.strip(),
        confidence=confidence,
        is_flagged=confidence < confidence_threshold,
        model_used="microsoft/trocr-large-handwritten (API)",
    )


def _heuristic_confidence(text: str) -> float:
    """Simple heuristic when real confidence isn't available."""
    if not text or len(text) < 3:
        return 0.2
    words = text.split()
    if len(words) < 2:
        return 0.4
    # Check ratio of alpha chars (gibberish = low ratio)
    alpha_ratio = sum(c.isalpha() for c in text) / max(len(text), 1)
    return min(0.65 + alpha_ratio * 0.3, 0.95)
