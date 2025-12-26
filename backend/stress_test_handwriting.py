import requests
import concurrent.futures
import time
import os

BASE_URL = "http://localhost:8000/api/handwriting/upload"
IMAGE_PATH = "/Users/chepuriharikiran/.gemini/antigravity/brain/db04e481-394f-48aa-9e0c-02d5f6b4ca5c/handwriting_sample_1766738570683.png"
NUM_REQUESTS = 5
CONCURRENCY = 2  # Start small to avoid OOM if model is heavy

def send_request(req_id):
    start_time = time.time()
    try:
        with open(IMAGE_PATH, "rb") as f:
            files = {"file": ("sample.png", f, "image/png")}
            data = {
                "type": "note",
                "user_id": f"stress_test_user_{req_id}",
                "course_id": "stress_test_course"
            }
            response = requests.post(BASE_URL, data=data, files=files)
            
        elapsed = time.time() - start_time
        return {
            "id": req_id,
            "status": response.status_code,
            "elapsed": elapsed,
            "text_len": len(response.json().get("data", {}).get("digital_text", "")),
            "ai_analysis": response.json().get("data", {}).get("ai_analysis") is not None
        }
    except Exception as e:
        return {"id": req_id, "status": "ERROR", "elapsed": time.time() - start_time, "error": str(e)}

def run_stress_test():
    print(f"Starting Stress Test: {NUM_REQUESTS} requests, {CONCURRENCY} concurrent...")
    print(f"Target: {BASE_URL}")
    print(f"Image: {IMAGE_PATH}")
    
    start_total = time.time()
    results = []
    
    with concurrent.futures.ThreadPoolExecutor(max_workers=CONCURRENCY) as executor:
        futures = [executor.submit(send_request, i) for i in range(NUM_REQUESTS)]
        for future in concurrent.futures.as_completed(futures):
            results.append(future.result())
            print(f"Completed Request {results[-1]['id']} in {results[-1]['elapsed']:.2f}s - Status: {results[-1]['status']}")

    total_time = time.time() - start_total
    
    # Analysis
    success_count = sum(1 for r in results if r['status'] == 200)
    avg_time = sum(r['elapsed'] for r in results) / len(results) if results else 0
    
    print("\n--- Stress Test Results ---")
    print(f"Total Time: {total_time:.2f}s")
    print(f"Successful Requests: {success_count}/{NUM_REQUESTS}")
    print(f"Average Latency: {avg_time:.2f}s")
    
    if success_count == NUM_REQUESTS:
        print("✅ STRESS TEST PASSED")
    else:
        print("❌ STRESS TEST FAILED OR HAD ERRORS")

if __name__ == "__main__":
    if not os.path.exists(IMAGE_PATH):
        print(f"Error: Image file not found at {IMAGE_PATH}")
    else:
        run_stress_test()
