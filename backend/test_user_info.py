import requests

base_url = 'http://localhost:8000'
login_payload = {'username': 'student@lumina.com', 'password': 'student123'}

try:
    # 1. Login
    res = requests.post(f'{base_url}/api/auth/token', data=login_payload, timeout=30)  # nosec B113
    token = res.json()['access_token']
    headers = {'Authorization': f'Bearer {token}'}
    print("Logged in.")

    # 2. Test User
    user_res = requests.get(f'{base_url}/api/student/test-user', headers=headers, timeout=30)  # nosec B113
    print(f"User Info: {user_res.text}")

except Exception as e:
    print(f"Error: {e}")
