from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel
import torch
import uvicorn
import os

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
BASE_MODEL_NAME = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
ADAPTER_PATH = "./training/output/final_adapter"

# Global model/tokenizer
model = None
tokenizer = None

class ChatRequest(BaseModel):
    message: str

@app.on_event("startup")
async def load_model():
    global model, tokenizer
    print("Loading Local Model...")
    device = "cpu" # Force CPU for safety on this machine
    
    base_model = AutoModelForCausalLM.from_pretrained(BASE_MODEL_NAME)
    try:
        model = PeftModel.from_pretrained(base_model, ADAPTER_PATH)
    except:
        print("Adapter not found/ready, using base model.")
        model = base_model
        
    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_NAME)
    print("Model Loaded!")

@app.post("/chat")
async def chat(request: ChatRequest):
    global model, tokenizer
    if not model:
        raise HTTPException(status_code=503, detail="Model loading")

    # Format prompt
    prompt = f"<|user|>\n{request.message}</s>\n<|assistant|>\n"
    inputs = tokenizer(prompt, return_tensors="pt")
    
    # Generate
    outputs = model.generate(**inputs, max_new_tokens=100)
    response_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    
    # Extract only assistant response
    answer = response_text.split("<|assistant|>")[-1].strip()
    
    return {"response": answer}

if __name__ == "__main__":
    # Install: pip install fastapi uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
