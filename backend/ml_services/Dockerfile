FROM python:3.11-slim

WORKDIR /app

# Install system dependencies for ML and RAG
RUN apt-get update && apt-get install -y \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

COPY ml_services/requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy the entire backend to allow cross-module imports
COPY . .

EXPOSE 9000

CMD ["uvicorn", "ml_services.main:app", "--host", "0.0.0.0", "--port", "9000"]
