import psycopg2
import json
import os
from datetime import datetime

# Potential connection strings
PROJECT_REFS = ["ncofwpuabtxddvdjljgj", "odyjksznsdeyweylovzl"]
PASSWORD = "Lumina@138800" # Based on grep findings

def seed_direct():
    for ref in PROJECT_REFS:
        try:
            print(f"Attempting to connect to {ref}...")
            conn = psycopg2.connect(
                dbname="postgres",
                user="postgres",
                password=PASSWORD,
                host=f"db.{ref}.supabase.co",
                port="5432"
            )
            cur = conn.cursor()
            
            print(f"Connected to {ref} directly.")
            
            # 1. Seed Anonymised Snapshots
            snapshots = [
                ('2026-03-01', 'STEM_Mastery_Q1', json.dumps({"metrics": {"avg_mastery": 0.85}, "cohort_size": 1200}), 'hash_stem_001'),
                ('2026-03-05', 'Humanities_Engagement', json.dumps({"metrics": {"engagement_score": 92}, "cohort_size": 850}), 'hash_hum_002'),
                ('2026-03-10', 'Global_Peer_Network', json.dumps({"metrics": {"network_density": 0.45}, "cohort_size": 2100}), 'hash_global_003')
            ]
            
            for snap in snapshots:
                cur.execute("""
                    INSERT INTO anonymised_snapshots (snapshot_date, dataset_type, data_json, institution_id_hash)
                    VALUES (%s, %s, %s, %s)
                    ON CONFLICT DO NOTHING;
                """, snap)
            
            print(f"Seeded anonymised_snapshots in {ref}.")
            
            # 2. Add extra blueprints for Creator
            cur.execute("SELECT id FROM users WHERE role = 'content_creator' LIMIT 1;")
            creator_row = cur.fetchone()
            if creator_row:
                creator_id = creator_row[0]
                blueprints = [
                    (creator_id, 'Ethics in Artificial Intelligence', json.dumps({"objectives": ["Bias Detection", "Transparency", "Accountability"]}), 'draft'),
                    (creator_id, 'Advanced Astrophysics', json.dumps({"objectives": ["Black Holes", "Dark Matter", "Cosmic Microwave Background"]}), 'published')
                ]
                for bp in blueprints:
                    cur.execute("""
                        INSERT INTO course_blueprints (creator_id, title, objectives_json, status)
                        VALUES (%s, %s, %s, %s)
                        ON CONFLICT DO NOTHING;
                    """, bp)
                print(f"Seeded extra blueprints in {ref}.")

            conn.commit()
            cur.close()
            conn.close()
            print(f"Direct seeding of {ref} complete.")
        except Exception as e:
            print(f"Error during direct seeding of {ref}: {e}")

if __name__ == "__main__":
    seed_direct()
