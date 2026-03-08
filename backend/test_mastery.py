import httpx
import asyncio

async def test_mastery():
    login_url = "http://localhost:8000/api/auth/token"
    login_data = {"username": "student@lumina.com", "password": "student123"}
    
    async with httpx.AsyncClient() as client:
        # Login using form data
        response = await client.post(login_url, data=login_data)
        if response.status_code != 200:
            print(f"Login Failed: {response.status_code}")
            return
            
        token = response.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Save Quiz Result
        # Matching QuizResultRequest: difficulty, score, course_id, details
        quiz_data = {
            "difficulty": "medium",
            "score": 90.0,
            "course_id": "3ca8f41f-a4c9-49f5-bb14-e52ceda64c13",
            "details": {
                "quiz_id": "quiz-123",
                "total_questions": 10,
                "correct_answers": 9
            }
        }
        
        save_res = await client.post("http://localhost:8000/api/student/quiz-result", json=quiz_data, headers=headers)
        print(f"Save Quiz Status: {save_res.status_code}")
        if save_res.status_code != 200:
            print(f"Save Quiz Failed: {save_res.text}")
        
        # Check Dashboard
        dash_res = await client.get("http://localhost:8000/api/student/dashboard", headers=headers)
        dash_data = dash_res.json()
        print(f"Overall Mastery: {dash_data.get('overallMastery')}%")
        
        course = None
        for c in dash_data.get('enrolledCourses', []):
            if c['id'] == "3ca8f41f-a4c9-49f5-bb14-e52ceda64c13":
                course = c
                break
        
        if course:
            print(f"Course Mastery: {course.get('mastery')}%")
        else:
            print("Course NOT FOUND in dashboard")

if __name__ == "__main__":
    asyncio.run(test_mastery())
