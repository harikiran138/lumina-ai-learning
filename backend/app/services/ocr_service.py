import os
import io
import base64
from PIL import Image
from typing import List, Union, Optional
from pypdf import PdfReader
from app.services.ml_client import ml_client

class OCRService:
    def __init__(self):
        self.processor = None
        self.model = None
        self._local_deps_checked = False
        self._has_local_deps = False

    def _check_local_dependencies(self):
        if self._local_deps_checked:
            return
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
            self.processor = TrOCRProcessor.from_pretrained(model_name)
            self.model = VisionEncoderDecoderModel.from_pretrained(model_name).to(device)
            if device == "cpu":
                self.model = torch.quantization.quantize_dynamic(
                    self.model, {torch.nn.Linear}, dtype=torch.qint8
                )
            print("✅ Local OCR fallback loaded.")
        except Exception as e:
            print(f"❌ Local OCR load failed: {e}")

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
        
        # For images, we need to run it in a way that supports async or just wait
        # Since this method is often called in sync contexts, we'll try an async bridge if needed
        # But for now, let's assume it's called in an async context or we'll wrap it.
        import asyncio
        try:
            loop = asyncio.get_event_loop()
            if loop.is_running():
                # We are in an async loop, but this method is sync. 
                # Ideally this service should be async.
                return self.digitize_image_sync(document_input)
            else:
                return asyncio.run(self.digitize_image(document_input))
        except Exception:
            return self.digitize_image_sync(document_input)

    async def digitize_image(self, image_input: Union[str, bytes, Image.Image]) -> str:
        """Preferred async path using ML Service."""
        try:
            # Convert to base64
            if isinstance(image_input, str):
                with open(image_input, "rb") as f:
                    img_bytes = f.read()
            elif isinstance(image_input, bytes):
                img_bytes = image_input
            elif isinstance(image_input, Image.Image):
                buf = io.BytesIO()
                image_input.save(buf, format="PNG")
                img_bytes = buf.getvalue()
            else:
                raise ValueError("Invalid image input")

            img_b64 = base64.b64encode(img_bytes).decode("utf-8")
            text = await ml_client.extract_ocr(img_b64)
            if text:
                return text
        except Exception as e:
            print(f"ML OCR call failed: {e}. Falling back to local if possible.")
        
        return self.digitize_image_local(image_input)

    def digitize_image_sync(self, image_input: Union[str, bytes, Image.Image]) -> str:
        """Synchronous wrapper for digitize_image."""
        import asyncio
        try:
            return asyncio.run(self.digitize_image(image_input))
        except RuntimeError:
            # Already in a loop
            return self.digitize_image_local(image_input)

    def digitize_image_local(self, image_input: Union[str, bytes, Image.Image]) -> str:
        """Legacy local processing fallback."""
        self._load_model()
        if not self.model:
            return "[OCR Unavailable: ML Service failed and local models not loaded]"

        try:
            if isinstance(image_input, str):
                image = Image.open(image_input).convert("RGB")
            elif isinstance(image_input, bytes):
                image = Image.open(io.BytesIO(image_input)).convert("RGB")
            elif isinstance(image_input, Image.Image):
                image = image_input.convert("RGB")
            else:
                return "[Invalid image input]"

            import torch
            device = "mps" if torch.backends.mps.is_available() else "cuda" if torch.cuda.is_available() else "cpu"
            pixel_values = self.processor(images=image, return_tensors="pt").pixel_values.to(device)
            generated_ids = self.model.generate(pixel_values, max_new_tokens=128)
            return self.processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
        except Exception as e:
            return f"[OCR Local Error: {str(e)}]"

ocr_service = OCRService()
