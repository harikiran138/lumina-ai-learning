import os
import subprocess
from huggingface_hub import snapshot_download

# Ensure data directories exist
os.makedirs("data/kaggle", exist_ok=True)
os.makedirs("data/hf", exist_ok=True)

KAGGLE_DATASETS = [
    "nicolasjana/assistments-2009-2010-data", # ASSISTments
    "aljarah/xAPI-Edu-Data", # xAPI-Edu-Data
    # "stanford-education-data/spatial-network-knowledge-tracing", # Knowledge Tracing (might be big or restricted, trying a reliable one)
    # attempting to find best matches for the others
]

# Mapping descriptive names to likely Kaggle IDs if known, else we search
# For this script we'll use specific IDs to be safe.
# "Student Learning Behavior" -> "arashnic/student-learning-pattern" (likely match)
# "Student Dropout" -> "thedevastator/higher-education-predictors-of-student-retention"

ADDITIONAL_KAGGLE = [
    "arashnic/student-learning-pattern", 
    "thedevastator/higher-education-predictors-of-student-retention"
]

HF_DATASETS = [
    "vunderkind/student-engagement-and-performance",
    "neuralsorcerer/student-performance"
]

def download_kaggle(dataset_id):
    print(f"Downloading Kaggle dataset: {dataset_id}")
    try:
        subprocess.run(["kaggle", "datasets", "download", "-d", dataset_id, "-p", "data/kaggle", "--unzip"], check=True)
        print(f"Successfully downloaded {dataset_id}")
    except subprocess.CalledProcessError:
        print(f"Failed to download {dataset_id}. Check credentials.")
    except Exception as e:
        print(f"Error: {e}")

def download_hf(dataset_id):
    print(f"Downloading HF dataset: {dataset_id}")
    try:
        # Using snapshot_download to get valid files
        # Training data usually implies we might want the parquet/csv files
        # We can also use 'datasets' library to load and save
        from datasets import load_dataset
        ds = load_dataset(dataset_id)
        # Save to disk
        local_path = os.path.join("data/hf", dataset_id.replace("/", "_"))
        ds.save_to_disk(local_path)
        print(f"Successfully downloaded and saved {dataset_id} to {local_path}")
    except Exception as e:
        print(f"Failed to download {dataset_id}: {e}")

if __name__ == "__main__":
    print("Starting data download...")
    
    # Check if kaggle is configured
    kaggle_config = os.path.expanduser("~/.kaggle/kaggle.json")
    if not os.path.exists(kaggle_config):
        print(f"Warning: {kaggle_config} found. Assuming Kaggle auth is set up via env vars or system.")

    for k in KAGGLE_DATASETS + ADDITIONAL_KAGGLE:
        download_kaggle(k)

    for h in HF_DATASETS:
        download_hf(h)
    
    print("Download complete.")
