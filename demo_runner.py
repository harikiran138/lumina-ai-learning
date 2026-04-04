import asyncio
import sys
import os

# Add backend to path so we can import app
sys.path.append(os.path.abspath("backend"))

from app.database.manager import db
from app.store.user_store import UserStore

async def main():
    print("--- Starting Lumina Demo Runner ---")
    
    # 1. Setup Demo Users
    print("\nPhase 1: Setting up demo users...")
    from scripts.setup_demo_users import setup_users
    try:
        await setup_users()
        print("✓ Demo users set up successfully.")
    except Exception as e:
        print(f"✗ Failed to set up demo users: {e}")
        # Continue anyway as they might already exist
    
    # 2. Run initial health check
    print("\nPhase 2: Running health checks...")
    # Add logic here to check if FastAPI is running or start it
    print("✓ Health checks passed (Simulated).")

    print("\n--- Demo Runner Finished ---")
    print("You can now login as admin@lumina.com with password 'password123'")

if __name__ == "__main__":
    asyncio.run(main())
