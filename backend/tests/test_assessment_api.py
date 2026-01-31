from fastapi import FastAPI
from fastapi.testclient import TestClient
from app.assessment.api.router import router as assessment_router

# Create a standalone app for testing
app = FastAPI()
app.include_router(assessment_router, prefix="/api/assessment")

client = TestClient(app)

def test_assessment_flow():
    # 1. Start Assessment
    # Router expects StartAssessmentRequest(student_id, topic, num_questions=5)
    response = client.post("/api/assessment/start", json={
        "student_id": "test_student",
        "topic": "Python Basics"
    })
    assert response.status_code == 200
    data = response.json()
    assert "id" in data # Session ID is 'id' in AssessmentSession schema
    session_id = data["id"]
    
    # 2. Get Next Question (Initial)
    # Router: GET /next-question/{session_id}
    response = client.get(f"/api/assessment/next-question/{session_id}")
    assert response.status_code == 200
    question = response.json()
    assert question is not None
    assert "id" in question
    question_id = question["id"]
    
    # 3. Submit Answer (Correct)
    # Router: POST /submit (SubmitAnswerRequest)
    # Needs session_id, question_id, selected_option_id
    
    # For testing, we might need a valid option ID. 
    # Since we don't know which is correct without peeking, let's just pick the first option.
    first_option_id = question["options"][0]["id"]
    
    response = client.post("/api/assessment/submit", json={
        "session_id": session_id,
        "question_id": question_id,
        "selected_option_id": first_option_id,
        "time_taken": 5.0
    })
    assert response.status_code == 200
    session_data = response.json()
    assert "responses" in session_data
    assert len(session_data["responses"]) > 0
    
    # 4. Get Next Question (Adaptive)
    response = client.get(f"/api/assessment/next-question/{session_id}")
    assert response.status_code == 200
    question_2 = response.json()
    
    # Should get a new question if not finished
    if question_2:
        assert question_2["id"] != question_id

def test_assessment_not_found():
    response = client.get("/api/assessment/next-question/bad_id")
    # Router returns 404 if session not found
    assert response.status_code == 404
