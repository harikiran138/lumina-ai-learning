import os
import json
import time
import hashlib
from redis import Redis
from rq import Worker, Queue, Connection
# import fitz # PyMuPDF - verify if we can use it or fallback to pdfminer
# The user suggested PyMuPDF snippet, but requirements had pdfminer.six. 
# We will use pdfminer.six for strictly python-only deps if we want, or pypdf.
# Let's use pypdf for simplicity and speed, or pdfminer for layout.
# User snippet used 'fitz' (PyMuPDF). I'll stick to a robust standard library approach or check requirements.
# requirements.txt had: pdfminer.six. I will use that for generic, or just text.
# Actually, for "bbox" support, pdfminer.six is good.

from pdfminer.high_level import extract_pages
from pdfminer.layout import LTTextContainer, LTChar
import pytesseract
from pdf2image import convert_from_path
import tabula

from openai import OpenAI
import re

REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
OLLAMA_HOST = os.getenv("OLLAMA_HOST", "http://host.docker.internal:11434/v1")
UPLOAD_DIR = "/app/uploads"

redis_conn = Redis.from_url(REDIS_URL)

# Ollama Client (actually OpenAI compatible)
client = OpenAI(
    base_url=OLLAMA_HOST,
    api_key="ollama" # required but unused
)

def extract_tables(file_path):
    """
    Extracts tables using Tabula and returns them as HTML/Markdown string.
    """
    try:
        # Read tables -> list of DataFrames
        print("Extracting tables...")
        tables = tabula.read_pdf(file_path, pages='all', multiple_tables=True)
        table_text = "\n\n=== EXTRACTED TABLES ===\n"
        for i, df in enumerate(tables):
            if not df.empty:
                table_text += f"\n[Table {i+1}]\n{df.to_markdown(index=False)}\n"
        return table_text
    except Exception as e:
        print(f"Table extraction failed: {e}")
        return ""

def extract_text_with_metadata(file_path):
    """
    Extracts text with simple metadata using pdfminer.high_level
    Falls back to OCR (Tesseract) if text is sparse.
    Returns: full_text, pages_list, used_ocr (bool)
    """
    full_text = ""
    pages_data = []
    used_ocr = False
    
    # Robust extraction
    try:
        print("Attempting standard text extraction...")
        # Get total pages count first (rough check)
        # Note: pdfminer doesn't make it easy to get count without parsing.
        # We'll rely on iteration.
        
        page_count = 0
        sparse_pages = 0
        
        for i, page_layout in enumerate(extract_pages(file_path)):
            page_count += 1
            page_text = ""
            for element in page_layout:
                if isinstance(element, LTTextContainer):
                    text = element.get_text()
                    page_text += text
            
            # Check for sparsity (OCR trigger)
            if len(page_text.strip()) < 50:
                sparse_pages += 1
            
            full_text += page_text
            pages_data.append({
                "text": page_text,
                "length": len(page_text),
                "page_num": i + 1
            })

        # OCR FALLBACK DECISION
        # If > 50% of pages are sparse, or total text is very low, try OCR.
        if (page_count > 0 and (sparse_pages / page_count) > 0.5) or len(full_text.strip()) < 100:
            print("Text extraction yielded minimal results. Switching to OCR (Tesseract)...")
            used_ocr = True
            
            # Reset
            full_text = ""
            pages_data = []
            
            # Convert PDF to images
            images = convert_from_path(file_path)
            for i, image in enumerate(images):
                # Simple Tesseract
                ocr_text = pytesseract.image_to_string(image)
                full_text += ocr_text + "\n"
                pages_data.append({
                    "text": ocr_text,
                    "length": len(ocr_text),
                    "page_num": i + 1,
                    "is_ocr": True
                })

        # TABLE EXTRACTION
        table_content = extract_tables(file_path)
        if table_content:
             full_text += table_content
             # Append to last page data or verify where to put it?
             # For now, just appending to ensure it is in the "Full Text" for searching/chunking.
            
    except Exception as e:
        print(f"PDF Extraction fallback or error: {e}")
        return "", [], False

    return full_text, pages_data, used_ocr

def smart_chunking(full_text, chunk_size=3000, overlap=400):
    chunks = []
    start = 0
    while start < len(full_text):
        end = min(start + chunk_size, len(full_text))
        
        # Adjust end to nearest newline/space to avoid splitting words
        if end < len(full_text):
            # look back for space
            last_space = full_text.rfind(' ', start, end)
            if last_space != -1 and last_space > start + chunk_size * 0.8:
                end = last_space
        
        chunk_text = full_text[start:end]
        chunks.append({
            "text": chunk_text,
            "start": start,
            "end": end
        })
        
        start = end - overlap if end < len(full_text) else end
        
    return chunks

def generate_gold_standard_artifacts(chunk_text, heading="Section"):
    """
    Calls Ollama to generate strict JSON artifacts.
    """
    prompt = f"""
    SYSTEM: You are a precise Course Builder. Output strictly valid JSON.
    INPUT: {{ "chapter_title": "{heading}", "source_text": "{chunk_text.replace('"', '\\"')}" }}
    
    TASK:
    1) Produce "module_title" and "lessons" list.
    2) For each lesson create:
       - lesson_title
       - full_content_orig: (the verbatim source_text passed in input) <-- MUST be identical to input text
       - summary: concise 4-6 bullet summary
       - key_points: 6 bullets
       - definitions: list of {{term, definition}} found in text
       - quiz: 5 MCQs with answer keys based only on source_text
    
    3) Output only JSON with keys: module_title, lessons (array).
    DO NOT invent facts.
    """
    
    try:
        response = client.chat.completions.create(
            model="llama3.1:latest", # Assuming user has this or similar
            messages=[
                {"role": "system", "content": "You are a JSON-only API. Output raw JSON."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1
        )
        content = response.choices[0].message.content
        
        # Strip markdown code blocks if present
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0]
        elif "```" in content:
            content = content.split("```")[1].split("```")[0]
            
        return json.loads(content)
        
    except Exception as e:
        print(f"LLM Error: {e}")
        return None

def process_job(payload):
    job_id = payload["job_id"]
    file_path = payload["file_path"]
    
    print(f"Processing job {job_id} for {file_path}")
    
    # 1. Extraction (Zero Word Loss)
    # Using pdfminer for now as configured in requirements
    full_text, pages, used_ocr = extract_text_with_metadata(file_path)
    
    if not full_text:
        # Just read as text if pdf failed or if it's not a pdf
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                full_text = f.read()
            pages = [{"text": full_text, "length": len(full_text), "page_num": 1}]
        except:
            pass

    # Coverage Metric: Checksum
    checksum = hashlib.sha256(full_text.encode('utf-8')).hexdigest()
    
    # 2. Chunking
    chunks = smart_chunking(full_text)
    
    # 3. Generation Loop
    course_modules = []
    
    generated_text_coverage = 0
    total_text_length = len(full_text)
    
    for i, chunk in enumerate(chunks):
        print(f"Generating artifacts for chunk {i+1}/{len(chunks)}...")
        # Call LLM
        data = generate_gold_standard_artifacts(chunk['text'], f"Part {i+1}")
        
        if data:
            course_modules.append(data)
    
    # 4. Save Results
    result = {
        "job_id": job_id,
        "checksum": checksum,
        "original_length": total_text_length,
        "pages_processed": len(pages),
        "used_ocr": used_ocr,
        "modules": course_modules
    }
    
    out_file = os.path.join(UPLOAD_DIR, job_id, "course_data.json")
    with open(out_file, "w") as f:
        json.dump(result, f, indent=2)
        
    print(f"Job {job_id} completed. Saved to {out_file}")
    return result

if __name__ == "__main__":
    print("Worker started. Listening on redis...")
    with Connection(redis_conn):
        worker = Worker([Queue(connection=redis_conn)])
        worker.work()
