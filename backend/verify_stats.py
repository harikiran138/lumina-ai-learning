import requests
import sys

base_url = 'http://localhost:8000'
print(f"Connecting to {base_url}...")

try:
    login_payload = {'username': 'student@lumina.com', 'password': 'student123'}
    res = requests.post(f'{base_url}/api/auth/token', data=login_payload, timeout=10)
    print(f"Login Status: {res.status_code}")
    if res.status_code != 200:
        print(f"Login failed: {res.text}")
        sys.exit(1)
    
    token = res.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    print("Logged in successfully.")

    dashboard_res = requests.get(f'{base_url}/api/student/dashboard', headers=headers, timeout=10)
    print(f"Dashboard Status: {dashboard_res.status_code}")
    if dashboard_res.status_code != 200:
        print(f"Dashboard fetch failed: {dashboard_res.text}")
        sys.exit(1)

    dashboard = dashboard_res.json()
    print("--- Stats Captured ---")
    print(f"Current Streak: {dashboard.get('currentStreak')}")
    print(f"Overall Mastery: {dashboard.get('overallMastery')}")
    print(f"Total Hours: {dashboard.get('totalHours')}")

except requests.exceptions.ConnectionError:
    print("Error: Could not connect to the backend server. Is it running?")
except Exception as e:
    print(f"Unexpected error: {str(e)}")
