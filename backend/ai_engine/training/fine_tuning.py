class FineTuningManager:
    """
    Manager for LoRA Adapters and fine-tuning jobs.
    """
    def start_tuning_job(self, dataset_path: str, model_name: str):
        print(f"Starting fine-tuning for {model_name}")
