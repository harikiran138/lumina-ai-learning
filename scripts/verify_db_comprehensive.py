import os
import psycopg2
from dotenv import load_dotenv
from urllib.parse import urlparse

# Load environment variables
load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    print("❌ DATABASE_URL not found in .env")
    exit(1)

# Major tables from database_schema.sql
EXPECTED_TABLES = [
    ("public", "institutions"),
    ("public", "institution_details"),
    ("public", "programs"),
    ("public", "stakeholders"),
    ("public", "stakeholder_feedback"),
    ("public", "peos"),
    ("public", "peo_drafts"),
    ("public", "representative_stakeholders"),
    ("public", "pac_members"),
    ("public", "bos_members"),
    ("public", "program_coordinators"),
    ("public", "program_peos"),
    ("public", "program_outcomes"),
    ("public", "program_psos"),
    ("public", "audit_logs"),
    ("public", "program_visions"),
    ("public", "program_missions"),
    ("public", "curriculum_versions"),
    ("public", "curriculums"),
    ("public", "curriculum_course_outcomes"),
    ("public", "co_po_mapping"),
    ("public", "co_pso_mapping"),
    ("public", "departments"),
    ("public", "classes"),
    ("auth", "users"),
    ("auth", "sessions"),
    ("auth", "refresh_tokens")
]

def verify_database():
    print(f"--- LUMINA COMPREHENSIVE DATABASE VERIFICATION ---")
    print(f"Connecting to database...")
    
    try:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        
        print("\n[1/2] Verifying Table Existence...")
        missing_tables = []
        for schema, table in EXPECTED_TABLES:
            cur.execute(f"""
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_schema = '{schema}' 
                    AND table_name = '{table}'
                );
            """)
            exists = cur.fetchone()[0]
            if exists:
                print(f"  ✅ {schema}.{table} exists")
            else:
                print(f"  ❌ {schema}.{table} MISSING")
                missing_tables.append(f"{schema}.{table}")
        
        print("\n[2/2] Verifying Key Relationships (Foreign Keys)...")
        # Checking some critical FKs
        CRITICAL_FKS = [
            ("public", "programs", "institution_id", "public", "institutions", "id"),
            ("public", "stakeholders", "program_id", "public", "programs", "id"),
            ("public", "peos", "program_id", "public", "programs", "id"),
            ("public", "curriculums", "program_id", "public", "programs", "id"),
            ("public", "co_po_mapping", "program_id", "public", "programs", "id"),
            ("public", "departments", "institution_id", "public", "institutions", "id"),
            ("public", "classes", "program_id", "public", "programs", "id"),
        ]
        
        broken_fks = []
        for s1, t1, c1, s2, t2, c2 in CRITICAL_FKS:
            cur.execute(f"""
                SELECT count(*)
                FROM information_schema.key_column_usage kcu
                JOIN information_schema.table_constraints tc ON kcu.constraint_name = tc.constraint_name
                JOIN information_schema.referential_constraints rc ON tc.constraint_name = rc.constraint_name
                JOIN information_schema.key_column_usage kcu2 ON rc.unique_constraint_name = kcu2.constraint_name
                WHERE tc.constraint_type = 'FOREIGN KEY'
                  AND tc.table_schema = '{s1}' AND tc.table_name = '{t1}' AND kcu.column_name = '{c1}'
                  AND kcu2.table_schema = '{s2}' AND kcu2.table_name = '{t2}' AND kcu2.column_name = '{c2}';
            """)
            count = cur.fetchone()[0]
            if count > 0:
                print(f"  ✅ FK: {s1}.{t1}({c1}) -> {s2}.{t2}({c2}) established")
            else:
                print(f"  ⚠️  FK: {s1}.{t1}({c1}) -> {s2}.{t2}({c2}) NOT FOUND")
                broken_fks.append(f"{s1}.{t1}({c1}) -> {s2}.{t2}({c2})")

        print("\n--- FINAL REPORT ---")
        if not missing_tables and not broken_fks:
            print("✨ DATABASE INTEGRITY VERIFIED: ALL TABLES AND CRITICAL RELATIONSHIPS PRESENT.")
        else:
            if missing_tables:
                print(f"❌ Missing Tables: {len(missing_tables)}")
            if broken_fks:
                print(f"⚠️  Missing/Broken FKs: {len(broken_fks)}")
            print("Please run migrations or sync scripts to fix these issues.")
            
        cur.close()
        conn.close()
        return len(missing_tables) == 0
        
    except Exception as e:
        print(f"❌ Database connection error: {e}")
        return False

if __name__ == "__main__":
    verify_database()
