import asyncio
import sys
from pathlib import Path

# Add backend directory to sys.path
backend_dir = Path(__file__).parent.parent.resolve()
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from app.seed import seed_data
from app.store.user_store import UserStore

async def create_demo_users():
    user_store = UserStore()
    demo_users = [
        ("admin@lumina.com", "super_admin", "System Admin"),
        ("hod@lumina.com", "hod", "Head of Department"),
        ("teacher@lumina.com", "teacher", "Master Teacher"),
        ("student@lumina.com", "student", "Demo Student")
    ]
    for email, role, name in demo_users:
        try:
            # Check if user exists
            user = await user_store.get_user_by_email(email)
            if user:
                # Sync all fields to be sure
                hashed_pw = user_store.get_password_hash("Password@123")
                updates = {
                    "password_hash": hashed_pw,
                    "name": name,
                    "full_name": name,
                    "role": role,
                    "two_factor_enabled": False,
                    "is_2fa_enabled": False,
                    "two_factor_verified": False
                }
                await user_store.update_user_fields(user["id"], updates)
                print(f"   - Synced/Reset demo {role}: {email}")
            else:
                await user_store.create_user(email=email, password="Password@123", full_name=name, role=role)
                print(f"   - Created demo {role}: {email}")
        except Exception as e:
            print(f"   - Error setting up {role} ({email}): {e}")

async def main():
    print("🚀 Starting Demo User Setup...")
    # We clear and seed to ensure a fresh state for automation
    # await seed_data(clear=True)
    await create_demo_users()
    print("DEMO_USERS_SETUP_COMPLETE")

if __name__ == "__main__":
    asyncio.run(main())
