import os
from PIL import Image
import torch
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
import io
from typing import List, Union

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
                self.model = VisionEncoderDecoderModel.from_pretrained(self.model_name).to(self.device)
                
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
            pixel_values = self.processor(images=image, return_tensors="pt").pixel_values.to(self.device)

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
