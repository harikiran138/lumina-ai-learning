import torch
from transformers import AutoModelForCausalLM, AutoTokenizer
from peft import PeftModel, PeftConfig
from datasets import load_from_disk
import math
from tqdm import tqdm
import os

# Configuration
BASE_MODEL_NAME = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
ADAPTER_PATH = "./training/output/final_adapter"
DATA_DIR = "./training/data"

def main():
    device = "cuda" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device}")

    print("Loading base model...")
    base_model = AutoModelForCausalLM.from_pretrained(
        BASE_MODEL_NAME,
        torch_dtype=torch.float16 if device == "cuda" else torch.float32,
        device_map=device
    )
    
    print(f"Loading adapter from {ADAPTER_PATH}...")
    try:
        model = PeftModel.from_pretrained(base_model, ADAPTER_PATH)
        model.to(device)
    except Exception as e:
        print(f"Could not load adapter: {e}. using base model only for baseline.")
        model = base_model

    tokenizer = AutoTokenizer.from_pretrained(BASE_MODEL_NAME)

    print("Loading validation data...")
    val_dataset = load_from_disk(os.path.join(DATA_DIR, "val"))
    
    # Calculate Perplexity on a subset
    encodings = val_dataset.select(range(100)) # Test on 100 samples
    
    max_length = model.config.max_position_embeddings
    stride = 512
    nlls = []

    print("Evaluating...")
    # Simple perplexity calculation
    total_loss = 0
    count = 0

    model.eval()
    with torch.no_grad():
        for i, sample in tqdm(enumerate(encodings)):
            inputs = tokenizer(sample['text'], return_tensors="pt", truncation=True, max_length=1024).to(device)
            labels = inputs.input_ids.clone()
            outputs = model(**inputs, labels=labels)
            loss = outputs.loss
            total_loss += loss.item()
            count += 1
    
    avg_loss = total_loss / count
    perplexity = math.exp(avg_loss)

    print(f"\nResults for {ADAPTER_PATH}:")
    print(f"Average Loss: {avg_loss:.4f}")
    print(f"Perplexity: {perplexity:.4f}")

    # Generate a sample prediction
    print("\n--- Sample Generation ---")
    prompt = "<|user|>\nWhat is the mitochondria?</s>\n<|assistant|>\n"
    inputs = tokenizer(prompt, return_tensors="pt").to(device)
    outputs = model.generate(**inputs, max_new_tokens=50)
    print(tokenizer.decode(outputs[0], skip_special_tokens=True))

if __name__ == "__main__":
    main()
