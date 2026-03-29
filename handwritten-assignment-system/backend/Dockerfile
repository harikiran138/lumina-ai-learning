FROM python:3.11-slim

# System deps for OpenCV + pdf2image
RUN apt-get update && apt-get install -y \
    libgl1-mesa-glx \
    libglib2.0-0 \
    poppler-utils \
    libgomp1 \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY requirements.txt .
# Install torch CPU-only first (saves 2GB vs CUDA build)
RUN pip install --no-cache-dir torch torchvision --index-url https://download.pytorch.org/whl/cpu
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Pre-download TrOCR model at build time (cached in image layer)
RUN python -c "from transformers import TrOCRProcessor, VisionEncoderDecoderModel; \
    TrOCRProcessor.from_pretrained('microsoft/trocr-large-handwritten'); \
    VisionEncoderDecoderModel.from_pretrained('microsoft/trocr-large-handwritten')" \
    || echo "Model download skipped (will download at runtime)"

EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
