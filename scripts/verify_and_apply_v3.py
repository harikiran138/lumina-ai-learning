import os
import socket
import psycopg2
from dotenv import load_dotenv

# Path handling for Mac local environment
env_path = 'backend/.env'
load_dotenv(env_path)

# Supavisor Pooler Details (Session Mode usually on 5432, Transaction on 6543)
# We try 6543 first as it often bypasses ISPs blocking 5432.
host = "aws-1-ap-northeast-1.pooler.supabase.com"
port = 6543
password = os.getenv("POSTGRES_PASSWORD", "LuminaAI2026") # Fallback to known default
user = "postgres.odyjksznsdeyweylovzl"
dbname = "postgres"

# FORCE IPv4 to avoid IPv6 routing issues
old_getaddrinfo = socket.getaddrinfo
def new_getaddrinfo(*args, **kwargs):
    responses = old_getaddrinfo(*args, **kwargs)
    return [res for res in responses if res[0] == socket.AF_INET]
socket.getaddrinfo = new_getaddrinfo

def apply_missing_schema():
    print(f"Connecting to Supabase Pooler at {host}:{port} via IPv4...")
    try:
        conn = psycopg2.connect(
            host=host,
            port=port,
            user=user,
            password=password,
            dbname=dbname,
            sslmode='require',
            connect_timeout=10
        )
        conn.autocommit = True
        cur = conn.cursor()
        
        print("Connected successfully. Applying missing tables...")
        
        # 1. Support Tickets (from 015)
        cur.execute("""
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
        """)
        print("Table 'support_tickets' verified/created.")
        
        # 2. Onboarding Fields (from 016)
        try:
            cur.execute("ALTER TABLE public.users ADD COLUMN IF NOT EXISTS is_onboarded boolean DEFAULT false;")
            cur.execute("ALTER TABLE public.users ADD COLUMN IF NOT EXISTS user_type text;")
            print("Columns 'is_onboarded', 'user_type' verified/added to 'users'.")
        except Exception as e:
            print(f"Note: Error adding users columns (might already exist): {e}")

        # 3. Auth Auditing (from 017)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS public.auth_audit_log (
              id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
              user_id uuid REFERENCES public.users(id),
              action text NOT NULL,
              metadata jsonb,
              ip_address text,
              created_at timestamptz DEFAULT now()
            );
        """)
        print("Table 'auth_audit_log' verified/created.")

        cur.close()
        conn.close()
        print("\nSUCCESS: All missing schema components applied.")
        
    except Exception as e:
        print(f"\nCRITICAL FAILURE: {e}")
        if "password authentication failed" in str(e):
            print("ERROR: Database password 'LuminaAI2026' is incorrect for this remote project.")
        elif "timeout" in str(e) or "route to host" in str(e):
            print("ERROR: Connection timed out or no route. Port 6543 might also be blocked from this host.")

if __name__ == "__main__":
    apply_missing_schema()
