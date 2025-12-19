#!/bin/bash
echo "Setting up environment..."
pip install kaggle huggingface_hub pandas numpy torch datasets

echo "Generating synthetic data..."
python3 scripts/generate_synthetic_data.py

echo "Downloading datasets..."
python3 scripts/download_data.py

echo "Training model..."
python3 scripts/train_pathway.py

echo "Pipeline complete."
