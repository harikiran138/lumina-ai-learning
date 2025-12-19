import os
import torch
from transformers import TrOCRProcessor, VisionEncoderDecoderModel, Seq2SeqTrainer, Seq2SeqTrainingArguments, default_data_collator
from datasets import load_dataset
from PIL import Image
import pandas as pd
from torch.utils.data import Dataset

# Configuration
MODEL_NAME = "microsoft/trocr-base-handwritten"
OUTPUT_DIR = "models/fine_tuned_trocr"
BATCH_SIZE = 4
EPOCHS = 3
LEARNING_RATE = 5e-5

class HandwritingDataset(Dataset):
    def __init__(self, root_dir, df, processor, max_target_length=128):
        self.root_dir = root_dir
        self.df = df
        self.processor = processor
        self.max_target_length = max_target_length

    def __len__(self):
        return len(self.df)

    def __getitem__(self, idx):
        # Assuming df has 'file_name' and 'text' columns
        file_name = self.df.iloc[idx]['file_name']
        text = self.df.iloc[idx]['text']
        
        image_path = os.path.join(self.root_dir, file_name)
        image = Image.open(image_path).convert("RGB")
        
        pixel_values = self.processor(image, return_tensors="pt").pixel_values
        labels = self.processor.tokenizer(text, 
                                          padding="max_length", 
                                          max_length=self.max_target_length).input_ids
        
        # usually labels are processed to replace pad token id with -100
        labels = [label if label != self.processor.tokenizer.pad_token_id else -100 for label in labels]

        encoding = {"pixel_values": pixel_values.squeeze(), "labels": torch.tensor(labels)}
        return encoding

def train_model():
    print(f"Loading processor and model: {MODEL_NAME}")
    processor = TrOCRProcessor.from_pretrained(MODEL_NAME)
    model = VisionEncoderDecoderModel.from_pretrained(MODEL_NAME)

    # config
    model.config.decoder_start_token_id = processor.tokenizer.cls_token_id
    model.config.pad_token_id = processor.tokenizer.pad_token_id
    model.config.vocab_size = model.config.decoder.vocab_size

    # beam search parameters
    model.config.eos_token_id = processor.tokenizer.sep_token_id
    model.config.max_length = 64
    model.config.early_stopping = True
    model.config.no_repeat_ngram_size = 3
    model.config.length_penalty = 2.0
    model.config.num_beams = 4

    # Dummy data for demonstration since we haven't downloaded 50GB yet
    print("Initializing Dummy Dataset for functionality verify...")
    df_train = pd.DataFrame({'file_name': [], 'text': []})
    # train_dataset = HandwritingDataset(root_dir="data/raw", df=df_train, processor=processor)
    
    # In a real scenario, we would load the unified DF here
    # dataset = load_dataset(...)

    training_args = Seq2SeqTrainingArguments(
        predict_with_generate=True,
        evaluation_strategy="steps",
        per_device_train_batch_size=BATCH_SIZE,
        per_device_eval_batch_size=BATCH_SIZE,
        fp16=torch.cuda.is_available(), 
        output_dir=OUTPUT_DIR,
        logging_dir=f"{OUTPUT_DIR}/logs",
        logging_steps=10,
        save_steps=500,
        eval_steps=200,
        save_total_limit=2,
        num_train_epochs=EPOCHS,
        learning_rate=LEARNING_RATE,
    )

    print("Trainer would start here. (Skipping actual training without data)")
    # trainer = Seq2SeqTrainer(
    #     model=model,
    #     tokenizer=processor.feature_extractor,
    #     args=training_args,
    #     train_dataset=train_dataset,
    #     data_collator=default_data_collator,
    # )
    # trainer.train()
    # trainer.save_model(OUTPUT_DIR)
    # processor.save_pretrained(OUTPUT_DIR)

if __name__ == "__main__":
    train_model()
