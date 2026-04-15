
import asyncio
import sys
import os

# Set up path to import app
sys.path.append(os.path.join(os.getcwd(), "backend"))

from app.dependencies import get_user_store_public
from app.store.user_store import UserStore

async def main():
    try:
        store = get_user_store_public()
        print(f"Store DB type: {type(store.db)}")
        print(f"Calling get_user_by_email...")
        user = await store.get_user_by_email("test@example.com")
        print(f"Result: {user}")
    except Exception as e:
        print(f"Caught error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(main())
