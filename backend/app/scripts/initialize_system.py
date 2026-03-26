import asyncio
import os
import sys
from dotenv import load_dotenv

# Ensure the app directory is in the path
sys.path.append(os.path.join(os.getcwd(), "backend"))

load_dotenv()

from app.store.user_store import UserStore
from app.database.supabase_manager import supabase_db

async def initialize_system():
    print("🚀 Initializing Lumina AI Learning System...")
    
    await supabase_db.connect()
    user_store = UserStore()
    
    # Check if any users exist
    try:
        users = await user_store.list_all_users()
        if len(users) > 0:
            print(f"✅ System already has {len(users)} users. Skipping initialization.")
            return
        
        print("🌱 No users found. Creating system admin...")
        
        admin_email = os.getenv("SYS_ADMIN_EMAIL", "admin.system@lumina.ai")
        admin_password = os.getenv("SYS_ADMIN_PASSWORD", "Admin@123")
        admin_name = os.getenv("SYS_ADMIN_NAME", "System Admin")
        
        admin = await user_store.create_user(
            email=admin_email,
            password=admin_password,
            full_name=admin_name,
            role="admin",
            phone="+1000000000"
        )
        
        print(f"✅ System Admin created: {admin['email']}")
        print("⚠️  IMPORTANT: Please change the default password immediately after first login.")
        
    except Exception as e:
        print(f"❌ Initialization failed: {e}")
    finally:
        await supabase_db.close()

if __name__ == "__main__":
    asyncio.run(initialize_system())
