import asyncio
import os
import sys
import uuid

# Add the current directory to the search path for imports
sys.path.append(os.getcwd())

from app.store.user_store import UserStore

async def verify():
    store = UserStore()
    email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    password = "SafePassword123!"
    full_name = "Test User"
    
    try:
        user = await store.create_user(
            email=email,
            password=password,
            full_name=full_name,
            role="student"
        )
        with open("verify_result.txt", "w") as f:
            f.write(f"SUCCESS: role={user.get('role')}")
        
    except Exception as e:
        with open("verify_result.txt", "w") as f:
            f.write(f"FAILED: {str(e)}")

if __name__ == "__main__":
    asyncio.run(verify())
