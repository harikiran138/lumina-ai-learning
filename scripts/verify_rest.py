import os
import requests
from dotenv import load_dotenv

load_dotenv("backend/.env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

def verify_via_rest():
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}"
    }
    
    tables_to_check = [
        'video_analyses', 
        'flashcards', 
        'student_flashcard_progress', 
        'student_risk_scores',
        'support_tickets'
    ]
    
    print(f"Verifying tables via REST API at {url}")
    
    for table in tables_to_check:
        # We try to query the table with a limit of 0 to see if it exists
        # If it doesn't exist, PostgREST returns 404
        endpoint = f"{url}/rest/v1/{table}?select=id&limit=1"
        try:
            response = requests.get(endpoint, headers=headers)
            if response.status_code == 200:
                print(f"Table '{table}': EXISTS (200)")
            elif response.status_code == 404:
                print(f"Table '{table}': MISSING (404)")
            else:
                print(f"Table '{table}': ERROR ({response.status_code}) - {response.text}")
        except Exception as e:
            print(f"Table '{table}': EXCEPTION - {e}")

if __name__ == "__main__":
    verify_via_rest()
