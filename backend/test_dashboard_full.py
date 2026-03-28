import requests

base_url = 'http://localhost:8000'
login_payload = {'username': 'student@lumina.com', 'password': 'student123'}

try:
    # 1. Login
    res = requests.post(f'{base_url}/api/auth/token', data=login_payload)  # nosec B113
    token = res.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    print("Logged in.")

    # 2. Get Courses to find one to log activity for
    # We already know courseId: 3ca8f41f-a4c9-49f5-bb14-e52ceda64c13
    course_id = "3ca8f41f-a4c9-49f5-bb14-e52ceda64c13"

    # 3. Log Activity (10 minutes)
    log_res = requests.post(  # nosec B113
        f'{base_url}/api/student/log-activity',
        headers=headers,
        json={'course_id': course_id, 'duration_minutes': 10}
    )
    print(f"Log Activity Status: {log_res.status_code}")
    print(f"Log Activity Response: {log_res.text}")

    # 4. Fetch Dashboard
    dash_res = requests.get(f'{base_url}/api/student/dashboard', headers=headers)  # nosec B113
    print(f"Dashboard Response: {dash_res.text}")
    
    dashboard = dash_res.json()
    print("--- Results ---")
    print(f"Streak: {dashboard.get('currentStreak')}")
    print(f"Hours: {dashboard.get('totalHours')}")
    print(f"Enrolled Courses Count: {len(dashboard.get('enrolledCourses', []))}")
    if dashboard.get('enrolledCourses'):
        print(f"First Course Name: {dashboard['enrolledCourses'][0].get('name')}")

except Exception as e:
    print(f"Error: {e}")
