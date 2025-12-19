from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
from typing import List
from ..logic.scoring import QAScorer
from ..models.train_trocr import MODEL_NAME # Just for ref, inference code would be separate
from transformers import TrOCRProcessor, VisionEncoderDecoderModel
from PIL import Image
import torch

app = FastAPI(title="Handwriting Analysis ML Service")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model loader (Lazy loading usually better, but eager for now)
print("Loading Inference Model...")
try:
    processor = TrOCRProcessor.from_pretrained(MODEL_NAME)
    model = VisionEncoderDecoderModel.from_pretrained(MODEL_NAME)
    model.eval()
    if torch.cuda.is_available():
        model.cuda()
    scorer = QAScorer()
    print("Model Loaded Successfully.")
except Exception as e:
    print(f"Model Load Failed (expected if offline/no download): {e}")
    processor = None
    model = None
    scorer = QAScorer() # Scorer might still work

@app.post("/analyze")
async def analyze_handwriting(
    file: UploadFile = File(...),
    answer_key: str = Form(None)
):
    """
    Analyzes uploaded handwriting image.
    If answer_key is provided, calculates score.
    """
    try:
        # Save temp file
        temp_filename = f"temp_{file.filename}"
        with open(temp_filename, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        
        # Inference
        extracted_text = ""
        if model and processor:
            image = Image.open(temp_filename).convert("RGB")
            pixel_values = processor(image, return_tensors="pt").pixel_values
            if torch.cuda.is_available():
                pixel_values = pixel_values.cuda()
            
            with torch.no_grad():
                generated_ids = model.generate(pixel_values)
                extracted_text = processor.batch_decode(generated_ids, skip_special_tokens=True)[0]
        else:
            extracted_text = "Model unavailable. Mock extraction: 'The quick brown fox...'"

        # Scoring
        result = {
            "extracted_text": extracted_text,
            "score": None,
            "feedback": "Analysis Complete"
        }
        
        if answer_key:
            score = scorer.calculate_similarity(extracted_text, answer_key)
            result["score"] = score
            result["feedback"] = f"Alignment with key: {score:.2f}"
            
        # Cleanup
        os.remove(temp_filename)
        
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "healthy", "gpu": torch.cuda.is_available()}
