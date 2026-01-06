FROM python:3.9-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Set environment variable for ChromaDB in Docker
ENV CHROMA_DB_PATH=/app/db/chroma

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
