import os
import requests
from dotenv import load_dotenv

load_dotenv("backend/.env")

url = os.environ.get("SUPABASE_URL")
key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")

# Supabase has a hidden /rest/v1/rpc/exec_sql if it's there (often it's not)
# But standard way via Service Role is sometimes possible through an edge function or custom RPC if defined.
# If no exec_sql rpc is defined, this will fail.

def apply_sql_via_rest():
    headers = {
        "apikey": key,
        "Authorization": f"Bearer {key}",
        "Content-Type": "application/json"
    }
    
    # We'll try to find if there's a common RPC for SQL (often used in some local setups)
    # If not, we have to admit defeat on direct application from this restricted env.
    
    sql = """
    CREATE TABLE IF NOT EXISTS public.support_tickets (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id uuid REFERENCES public.users(id),
      subject text NOT NULL,
      description text NOT NULL,
      status text DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'resolved', 'closed')),
      priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
      category text,
      institution_id uuid REFERENCES public.institutions(id),
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS idx_support_tickets_institution ON public.support_tickets(institution_id);
    CREATE INDEX IF NOT EXISTS idx_support_tickets_user ON public.support_tickets(user_id);
    """
    
    # Try the most likely (but usually restricted) endpoint
    endpoint = f"{url}/rest/v1/rpc/exec_sql" # This is a Long Shot
    
    print(f"Attempting to apply missing table via REST RPC at {endpoint}...")
    
    try:
        response = requests.post(endpoint, headers=headers, json={"sql": sql})
        if response.status_code == 200:
            print("SUCCESS: Table applied via REST RPC.")
        else:
            print(f"FAILED: Status {response.status_code} - {response.text}")
            print("Note: This endpoint is usually disabled in production for security.")
    except Exception as e:
        print(f"EXCEPTION: {e}")

if __name__ == "__main__":
    apply_sql_via_rest()
