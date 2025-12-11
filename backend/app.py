import os
import uuid
import json
import hashlib
from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from redis import Redis
from rq import Queue
from rq.job import Job

# Configuration
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
UPLOAD_DIR = "/app/uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Connect to Redis
try:
    redis_conn = Redis.from_url(REDIS_URL)
    q = Queue(connection=redis_conn)
except Exception as e:
    print(f"Error connecting to Redis: {e}")
    redis_conn = None
    q = None

app = FastAPI(title="Lumina AI Backend", version="1.0.0")

# CORS (allow all for local dev)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def calculate_sha256(file_path):
    sha256_hash = hashlib.sha256()
    with open(file_path, "rb") as f:
        # Read and update hash string value in blocks of 4K
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    return sha256_hash.hexdigest()

@app.get("/")
def health_check():
    return {"status": "ok", "redis": redis_conn.ping() if redis_conn else False}

@app.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    if not q:
        raise HTTPException(status_code=500, detail="Redis connection unavailable")

    job_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1].lower()
    
    # Create job directory
    job_dir = os.path.join(UPLOAD_DIR, job_id)
    os.makedirs(job_dir, exist_ok=True)
    
    file_path = os.path.join(job_dir, file.filename)
    
    # Save file
    try:
        contents = await file.read()
        with open(file_path, "wb") as f:
            f.write(contents)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save file: {e}")

    # Compute Checksum immediately (QA Step 1)
    checksum = calculate_sha256(file_path)

    # Enqueue Job
    payload = {
        "job_id": job_id,
        "file_path": file_path,
        "filename": file.filename,
        "checksum": checksum,
        "file_type": ext
    }
    
    # Enqueue extraction and generation task
    # We use 'worker.process_job' which matches our worker.py structure
    job = q.enqueue("worker.process_job", payload, job_id=job_id, job_timeout=3600) # 1 hour timeout for local LLM

    return {
        "job_id": job_id,
        "status": "queued",
        "checksum": checksum,
        "message": "File uploaded and processing started."
    }

@app.get("/status/{job_id}")
async def get_status(job_id: str):
    if not q:
         raise HTTPException(status_code=500, detail="Redis connection unavailable")
    
    try:
        job = Job.fetch(job_id, connection=redis_conn)
    except Exception:
        return {"job_id": job_id, "status": "not_found"}

    response = {
        "job_id": job_id,
        "status": job.get_status(),
        "result": job.result,
        "error": job.exc_info,
        "meta": job.meta
    }
    return response

@app.get("/results/{job_id}")
def get_results(job_id: str):
    # If the worker saves results to a JSON file, retrieve it
    # This is a fallback if job.result is too large or cleared
    result_path = os.path.join(UPLOAD_DIR, job_id, "course_data.json")
    if os.path.exists(result_path):
        with open(result_path, "r") as f:
            return json.load(f)
    return {"error": "Results not found yet"}
