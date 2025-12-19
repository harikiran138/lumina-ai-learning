import requests
import os
from PIL import Image, ImageDraw, ImageFont

BASE_URL = "http://localhost:8000/api/assignments"

def create_dummy_image(filename="handwritten_test.png"):
    img = Image.new('RGB', (400, 200), color = (255, 255, 255))
    d = ImageDraw.Draw(img)
    # Just draw some text - TrOCR might read this if it's clear enough, or meaningless text
    d.text((10,10), "The capital of France is Paris.", fill=(0,0,0))
    img.save(filename)
    return filename

def test_grading_flow():
    # 1. Create Assignment
    print("1. Creating Assignment...")
    assignment_data = {
        "title": "Geography Quiz",
        "course_id": "GEO101",
        "description": "What is the capital of France?",
        "due_date": "2024-12-31T23:59:59"
    }
    res = requests.post(f"{BASE_URL}/create", data=assignment_data)
    if res.status_code != 200:
        print("Failed to create assignment:", res.text)
        return
    assignment_id = res.json()["assignment"]["id"]
    print(f"   Assignment ID: {assignment_id}")

    # 2. Submit Assignment
    print("2. Submitting Assignment...")
    image_path = create_dummy_image()
    with open(image_path, "rb") as f:
        files = {"file": (image_path, f, "image/png")}
        data = {
            "assignment_id": assignment_id,
            "student_id": "student_123"
        }
        res = requests.post(f"{BASE_URL}/submit", data=data, files=files)
    
    if res.status_code != 200:
        print("Failed to submit assignment:", res.text)
        return
    
    submission_id = res.json()["submission"]["id"]
    print(f"   Submission ID: {submission_id}")

    # 3. Grade Assignment
    print("3. Grading Assignment...")
    grade_url = f"{BASE_URL}/{assignment_id}/submissions/{submission_id}/grade"
    res = requests.post(grade_url)
    
    if res.status_code != 200:
        print("Failed to grade assignment:", res.text)
        return
    
    result = res.json()
    print("\n=== GRADING RESULT ===")
    print(f"Score: {result.get('score')}")
    print(f"Feedback: {result.get('feedback')}")
    print(f"OCR Text: {result.get('ocr_text')}")

    # 4. Verify Persistence
    print("\n4. Verifying Persistence...")
    subs_res = requests.get(f"{BASE_URL}/{assignment_id}/submissions")
    if subs_res.status_code == 200:
        submissions = subs_res.json()
        saved_sub = next((s for s in submissions if s["id"] == submission_id), None)
        if saved_sub and saved_sub.get("grade") is not None:
             print("SUCCESS: Grade saved to database.")
             print(f"Saved Grade: {saved_sub['grade']}")
             if saved_sub.get("ocr_text"):
                 print("SUCCESS: OCR Text saved to database.")
             else:
                 print("FAILURE: OCR Text NOT saved.")
        else:
             print("FAILURE: Grade NOT saved to database.")
    else:
        print("Failed to fetch submissions for verification.")

    # Cleanup
    if os.path.exists(image_path):
        os.remove(image_path)

if __name__ == "__main__":
    test_grading_flow()
