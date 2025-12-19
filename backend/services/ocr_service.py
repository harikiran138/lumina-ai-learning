from PIL import Image
import torch
import os

class OCRService:
    def __init__(self):
        self.device = "cuda" if torch.cuda.is_available() else "cpu"
        self.processor = None
        self.model = None

    def _load_model(self):
        if self.processor and self.model:
            return

        print(f"Loading TrOCR model on {self.device}...")
        try:
            from transformers import TrOCRProcessor, VisionEncoderDecoderModel
            self.processor = TrOCRProcessor.from_pretrained('microsoft/trocr-base-handwritten')
            self.model = VisionEncoderDecoderModel.from_pretrained('microsoft/trocr-base-handwritten').to(self.device)
            print("TrOCR model loaded successfully.")
        except Exception as e:
            print(f"Failed to load TrOCR model: {e}")
            self.processor = None
            self.model = None

    def extract_text(self, image_path: str) -> str:
        self._load_model()
        if not self.model or not self.processor:
            return "OCR Model not loaded."

        try:
            image = Image.open(image_path).convert("RGB")
            pixel_values = self.processor(images=image, return_tensors="pt").pixel_values.to(self.device)

            generated_ids = self.model.generate(pixel_values)
            generated_text = self.processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
            
            return generated_text
        except Exception as e:
            print(f"OCR Extraction Error: {e}")
            return ""

# Singleton instance
ocr_service = OCRService()
