from datasets import load_dataset
from transformers import AutoTokenizer
import os

# Configuration
MODEL_NAME = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
DATASET_NAME = "sciq" # Science exam questions
OUTPUT_DIR = "./training/data"

def format_instruction(sample):
    """
    Format the sample into a chat-like instruction.
    User: {question}
    Model: {correct_answer}
    """
    prompt = f"<|user|>\n{sample['question']}\n{sample['support'] if sample['support'] else ''}</s>\n<|assistant|>\n{sample['correct_answer']}</s>"
    return {"text": prompt}

def main():
    print(f"Loading dataset: {DATASET_NAME}...")
    dataset = load_dataset(DATASET_NAME)
    
    print(f"Loading tokenizer: {MODEL_NAME}...")
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    tokenizer.pad_token = tokenizer.eos_token # Valid for Llama-type open-ended generation

    print("Formatting dataset...")
    # Concatenate train/validation for a larger training set if needed, 
    # but strictly we should keep validation separate.
    train_dataset = dataset["train"].map(format_instruction)
    val_dataset = dataset["validation"].map(format_instruction)

    # Tokenization function
    def tokenize_function(examples):
        return tokenizer(examples["text"], padding="max_length", truncation=True, max_length=512)

    print("Tokenizing...")
    tokenized_train = train_dataset.map(tokenize_function, batched=True)
    tokenized_val = val_dataset.map(tokenize_function, batched=True)

    # Save to disk
    print(f"Saving prepared data to {OUTPUT_DIR}...")
    tokenized_train.save_to_disk(os.path.join(OUTPUT_DIR, "train"))
    tokenized_val.save_to_disk(os.path.join(OUTPUT_DIR, "val"))
    print("Data preparation complete.")

if __name__ == "__main__":
    main()
