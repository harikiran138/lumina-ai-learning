import os
from PIL import Image
import torch
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
import io
from typing import List, Union
from pypdf import PdfReader


class OCRService:
    def __init__(self):
        self.processor = None
        self.model = None

        # Detect device: MPS for Mac, CUDA for Nvidia, CPU fallback
        if torch.backends.mps.is_available():
            self.device = "mps"
            print("🚀 Using Apple MPS (Metal Performance Shaders) acceleration")
        elif torch.cuda.is_available():
            self.device = "cuda"
            print("🚀 Using CUDA acceleration")
        else:
            self.device = "cpu"
            print("⚠️ Using CPU for inference (slower)")

        # Use the small model for significantly faster inference (2-3x speedup)
        # Trade-off: Slightly lower accuracy on messy handwriting
        self.model_name = "microsoft/trocr-small-handwritten"

    def _load_model(self):
        """Lazy load the model only when needed."""
        if self.model is None:
            print(f"Loading OCR model: {self.model_name} on {self.device}...")
            try:
                self.processor = TrOCRProcessor.from_pretrained(self.model_name)
                self.model = VisionEncoderDecoderModel.from_pretrained(self.model_name).to(
                    self.device
                )

                # Dynamic quantization for CPU speedup (only if on CPU)
                if self.device == "cpu":
                    try:
                        print("⚡ Applying dynamic quantization for CPU...")
                        self.model = torch.quantization.quantize_dynamic(
                            self.model, {torch.nn.Linear}, dtype=torch.qint8
                        )
                    except Exception as q_err:
                        print(f"⚠️ Quantization failed (skipping): {q_err}")

                print("✅ OCR Model loaded successfully.")
            except Exception as e:
                print(f"❌ Error loading OCR model: {e}")
                raise e

    def _read_text_file(self, document_input: Union[str, bytes]) -> str:
        try:
            if isinstance(document_input, str):
                with open(document_input, "r", encoding="utf-8") as handle:
                    return handle.read()
            if isinstance(document_input, bytes):
                return document_input.decode("utf-8", errors="ignore")
        except Exception as e:
            print(f"Error reading text file: {e}")
        return ""

    def _extract_pdf_text(self, document_input: Union[str, bytes]) -> str:
        try:
            if isinstance(document_input, str):
                with open(document_input, "rb") as handle:
                    reader = PdfReader(handle)
                    pages = [page.extract_text() or "" for page in reader.pages]
            else:
                reader = PdfReader(io.BytesIO(document_input))
                pages = [page.extract_text() or "" for page in reader.pages]

            text = "\n\n".join(page.strip() for page in pages if page and page.strip())
            return text or "[No extractable text found in PDF]"
        except Exception as e:
            print(f"Error extracting PDF text: {e}")
            return f"[Error extracting PDF text: {str(e)}]"

    def extract_text(self, document_input: Union[str, bytes, Image.Image], file_type: str = "") -> str:
        ext = file_type.lower().lstrip(".")

        if ext in {"txt", "md", "csv", "json"}:
            return self._read_text_file(document_input)
        if ext == "pdf":
            return self._extract_pdf_text(document_input)

        return self.digitize_image(document_input)

    def digitize_image(self, image_input: Union[str, bytes, Image.Image]) -> str:
        """
        Takes an image path, bytes, or PIL Image and returns the recognized text.
        """
        self._load_model()

        try:
            if isinstance(image_input, str):
                image = Image.open(image_input).convert("RGB")
            elif isinstance(image_input, bytes):
                image = Image.open(io.BytesIO(image_input)).convert("RGB")
            elif isinstance(image_input, Image.Image):
                image = image_input.convert("RGB")
            else:
                raise ValueError("Invalid image input format")

            # Preprocess
            pixel_values = self.processor(images=image, return_tensors="pt").pixel_values.to(
                self.device
            )

            # Generate
            # Reduced max_new_tokens to 32 for faster sentence-level output.
            # TrOCR is autoregressive, so fewer tokens = faster execution.
            # But for full pages, we might need more looping or bigger chunks.
            # Sticking to 100 for balance, or slightly less? 100 is safe for a paragraph.
            generated_ids = self.model.generate(pixel_values, max_new_tokens=128)
            generated_text = self.processor.batch_decode(generated_ids, skip_special_tokens=True)[0]

            return generated_text

        except Exception as e:
            print(f"Error during digitization: {e}")
            return f"[Error digitizing content: {str(e)}]"


ocr_service = OCRService()
