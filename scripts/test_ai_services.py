
import os
import httpx
import asyncio
import base64
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

ML_SERVICE_URL = os.getenv("ML_SERVICE_URL", "http://127.0.0.1:9000")
BACKEND_URL = os.getenv("API_URL", "http://127.0.0.1:8000")

async def test_llm_configuration():
    print("\n--- LLM CONFIGURATION CHECK ---")
    gemini_key = os.getenv("GEMINI_API_KEY")
    openai_key = os.getenv("OPENAI_API_KEY")
    
    if gemini_key:
        print("✅ GEMINI_API_KEY is set.")
    else:
        print("❌ GEMINI_API_KEY is missing!")

    if openai_key:
        print("✅ OPENAI_API_KEY is set.")
    else:
        print("⚠️ OPENAI_API_KEY is missing (Optional if using Gemini).")

async def test_ml_service_health():
    print("\n--- ML SERVICE HEALTH CHECK ---")
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            response = await client.get(f"{ML_SERVICE_URL}/health")
            if response.status_code == 200:
                print(f"✅ ML Service is healthy: {response.json()}")
            else:
                print(f"❌ ML Service returned status {response.status_code}")
    except Exception as e:
        print(f"❌ ML Service connection failed: {e}")

async def test_ocr_pipeline():
    print("\n--- OCR PIPELINE CHECK ---")
    # Small transparent pixel as base64
    dummy_image_b64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR42mP8/wnAAEIBAMF6v3AAAAAASUVORK5CYII="
    
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            payload = {
                "image_base64": dummy_image_b64,
                "file_type": "png"
            }
            response = await client.post(f"{ML_SERVICE_URL}/ml/ocr/extract", json=payload)
            if response.status_code == 200:
                print(f"✅ OCR extract call successful: {response.json().get('text', '')}")
            else:
                print(f"❌ OCR extract failed with status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ OCR connection failed: {e}")

async def test_rag_ingestion():
    print("\n--- RAG INGESTION CHECK ---")
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            # Body is expected as "text" and "metadata"
            # In code: @app.post("/ml/rag/ingest") async def ingest_rag(text: str = Body(...), metadata: Dict[str, Any] = Body(None)):
            # This is a bit unusual for FastAPI with json, usually it expects a model.
            # But the code says text: str = Body(...)
            response = await client.post(
                f"{ML_SERVICE_URL}/ml/rag/ingest", 
                json={"text": "Demo document for Lumina AI verification.", "metadata": {"source": "test_script"}}
            )
            if response.status_code == 200:
                print(f"✅ RAG ingestion successful: {response.json()}")
            else:
                print(f"❌ RAG ingestion failed with status {response.status_code}: {response.text}")
    except Exception as e:
        print(f"❌ RAG connection failed: {e}")

async def main():
    await test_llm_configuration()
    await test_ml_service_health()
    await test_ocr_pipeline()
    await test_rag_ingestion()

if __name__ == "__main__":
    asyncio.run(main())
