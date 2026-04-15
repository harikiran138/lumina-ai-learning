
import asyncio
from app.dependencies import get_user_store

async def test():
    store = get_user_store()
    print(f"Store type: {type(store)}")
    print(f"Store DB type: {type(store.db)}")
    try:
        user = await store.get_user_by_email("test@example.com")
        print("Success calling get_user_by_email")
    except Exception as e:
        print(f"Error calling get_user_by_email: {e}")

if __name__ == "__main__":
    asyncio.run(test())
