import asyncio
import os
import socket
from dotenv import load_dotenv

# Force IPv4
old_getaddrinfo = socket.getaddrinfo
def new_getaddrinfo(*args, **kwargs):
    responses = old_getaddrinfo(*args, **kwargs)
    return [res for res in responses if res[0] == socket.AF_INET]
socket.getaddrinfo = new_getaddrinfo

load_dotenv("/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/.env")

from app.store.user_store import UserStore

async def test():
    print("Testing user fetch login...")
    email = "admin@lumina.ai"
    store = UserStore()
    try:
        print("Querying database...")
        user = await store.get_user_by_email(email)
        print("Success:", user)
    except Exception as e:
        print("Error:", e)

if __name__ == "__main__":
    asyncio.run(test())

