import os
import psycopg2
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    if not DATABASE_URL:
        print("DATABASE_URL not found in environment.")
        return

    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()

        print("--- Migrating Faculty to Teacher ---")

        # 1. Update users table
        cur.execute("UPDATE users SET role = 'teacher' WHERE role IN ('faculty', 'fac', 'FACULTY');")
        users_count = cur.rowcount
        print(f"Updated {users_count} users to 'teacher' role.")

        # 2. Update learner_profiles table
        cur.execute("UPDATE learner_profiles SET role = 'teacher' WHERE role IN ('faculty', 'fac', 'FACULTY');")
        profiles_count = cur.rowcount
        print(f"Updated {profiles_count} learner_profiles to 'teacher' role.")

        # 3. Update any other possible tables (checking from our list)
        # We saw teacher_assignments and teacher_requests, which are already named correctly.
        # If there were any legacy tables, we would have seen them in the table list.

        conn.commit()
        print("Migration committed successfully.")

        cur.close()
        conn.close()
    except Exception as e:
        print(f"Migration FAILED: {e}")

if __name__ == "__main__":
    migrate()
