import torch
from transformers import (
    AutoModelForCausalLM,
    AutoTokenizer,
    TrainingArguments,
    Trainer,
    DataCollatorForLanguageModeling
)
from peft import LoraConfig, get_peft_model, TaskType
from datasets import load_from_disk
import os

# Configuration
MODEL_NAME = "TinyLlama/TinyLlama-1.1B-Chat-v1.0"
DATA_DIR = "./training/data"
OUTPUT_DIR = "./training/output"

def main():
    print("Loading prepared data...")
    train_dataset = load_from_disk(os.path.join(DATA_DIR, "train"))
    val_dataset = load_from_disk(os.path.join(DATA_DIR, "val"))

    print(f"Loading model: {MODEL_NAME}...")
    # Load model in 4-bit or 8-bit mode if bitsandbytes is working, otherwise fp32/fp16
    # For simplicity on generic hardware, we'll try standard load first.
    # On Windows without specific CUDA bitsandbytes compilation, standard load is safer.
    
    device_map = "auto" if torch.cuda.is_available() else "cpu"
    print(f"Using device: {device_map}")

    model = AutoModelForCausalLM.from_pretrained(
        MODEL_NAME,
        device_map=device_map,
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32
    )
    tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME)
    tokenizer.pad_token = tokenizer.eos_token

    # LoRA Config (Parameter Efficient Fine-Tuning)
    print("Applying LoRA...")
    peft_config = LoraConfig(
        task_type=TaskType.CAUSAL_LM,
        inference_mode=False,
        r=8,
        lora_alpha=32,
        lora_dropout=0.1
    )
    model = get_peft_model(model, peft_config)
    model.print_trainable_parameters()

    # Training Arguments
    training_args = TrainingArguments(
        output_dir=OUTPUT_DIR,
        max_steps=30,
        num_train_epochs=1,              # 1 epoch for quick demo
        per_device_train_batch_size=2,   # Small batch for memory safety
        gradient_accumulation_steps=4,
        learning_rate=5e-5,
        logging_steps=1,
        eval_strategy="steps",
        eval_steps=50,
        save_steps=100,
        fp16=torch.cuda.is_available(),
        push_to_hub=False
    )

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=train_dataset.select(range(200)),  # Limit to 200 samples for DEMO SPEED
        eval_dataset=val_dataset.select(range(50)),      # Limit validation too
        data_collator=DataCollatorForLanguageModeling(tokenizer, mlm=False),
    )

    print("Starting training...")
    trainer.train()

    print("Saving model...")
    model.save_pretrained(os.path.join(OUTPUT_DIR, "final_adapter"))
    print("Training complete.")

if __name__ == "__main__":
    main()
