import os
import httpx
import socket
from dotenv import load_dotenv

# Force IPv4 to prevent IPv6 blackhole hanging
old_getaddrinfo = socket.getaddrinfo
def new_getaddrinfo(*args, **kwargs):
    responses = old_getaddrinfo(*args, **kwargs)
    return [res for res in responses if res[0] == socket.AF_INET]
socket.getaddrinfo = new_getaddrinfo

load_dotenv("/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/.env")

url = os.getenv("SUPABASE_URL") + "/rest/v1/users?select=*"
headers = {
    "apikey": os.getenv("SUPABASE_SERVICE_ROLE_KEY"),
    "Authorization": f"Bearer {os.getenv('SUPABASE_SERVICE_ROLE_KEY')}"
}

print(f"Fetching from {url}...")
try:
    response = httpx.get(url, headers=headers, timeout=5.0)
    print("Response status:", response.status_code)
except Exception as e:
    print("Error:", e)
