import os
import sys
import asyncio

# Setup path for app import
sys.path.append(os.path.join(os.getcwd(), 'backend'))

from dotenv import load_dotenv
load_dotenv('backend/.env')

async def probe_supabase():
    try:
        from app.database.supabase_manager import supabase_db
        client = supabase_db.get_client()
        if not client:
            print("Client is None!")
            return
            
        print("Connected to Supabase client.")
        
        # Test 1: Query users (should exist)
        response = client.table("users").select("count").limit(1).execute()
        print(f"Users table check: {response.count if hasattr(response, 'count') else 'Success'}")
        
        # Test 2: Query support_tickets (the one we suspect is missing)
        try:
            response = client.table("support_tickets").select("count").limit(1).execute()
            print("Support Tickets table check: EXISTS")
        except Exception as e:
            if "does not exist" in str(e) or "404" in str(e):
                print("Support Tickets table check: MISSING")
            else:
                print(f"Support Tickets table check: ERROR - {e}")
                
    except Exception as e:
        print(f"Probing failed: {e}")

if __name__ == "__main__":
    asyncio.run(probe_supabase())
