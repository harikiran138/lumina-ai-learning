import asyncio
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).parent.parent.resolve()
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.store.user_store import UserStore

async def inspect_users():
    user_store = UserStore()
    users = await user_store.list_all_users()
    print(f"Total Users: {len(users)}")
    for u in users:
        print(f"ID: {u.get('id')} | Email: {u.get('email')} | Role: {u.get('role')} | Name: {u.get('full_name')}")

if __name__ == "__main__":
    asyncio.run(inspect_users())
