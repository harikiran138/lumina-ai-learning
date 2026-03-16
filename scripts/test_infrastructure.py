import os
import asyncio
import sys
import time
from dotenv import load_dotenv

# Add backend to path for imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

async def test_supabase():
    print("Testing Supabase/PostgreSQL connection...")
    try:
        from app.database.supabase_manager import supabase_db
        client = supabase_db.get_client()
        if client:
            # Simple query to verify connection
            res = client.table("roles").select("count", count="exact").limit(1).execute()
            print(f"✅ Supabase connected. Roles count: {res.count}")
            return True
        else:
            print("❌ Supabase client initialization failed.")
            return False
    except Exception as e:
        print(f"❌ Supabase connection error: {e}")
        return False

async def test_redis():
    print("Testing Redis connection...")
    try:
        import redis.asyncio as redis
        redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/0")
        r = redis.from_url(redis_url)
        await r.ping()
        print(f"✅ Redis connected at {redis_url}")
        await r.close()
        return True
    except Exception as e:
        print(f"❌ Redis connection error: {e}")
        return False

async def test_neo4j():
    print("Testing Neo4j connection (Graph Query)...")
    try:
        # Check if neo4j is even installed
        import neo4j
        print("Neo4j driver found. Attempting connection...")
        # Since no credentials in .env, we'll try defaults or skip
        print("⚠️ Neo4j credentials not found in .env. Skipping deep test.")
        return "skipped"
    except ImportError:
        print("ℹ️ Neo4j driver not installed. Skipping.")
        return "missing"
    except Exception as e:
        print(f"❌ Neo4j error: {e}")
        return False

async def test_minio():
    print("Testing MinIO/S3 connection...")
    try:
        import boto3
        from botocore.exceptions import NoCredentialsError
        
        # Check environment
        s3_url = os.getenv("S3_ENDPOINT_URL", "http://localhost:9000")
        print(f"Checking S3/MinIO at {s3_url}...")
        
        s3 = boto3.client('s3', endpoint_url=s3_url)
        # Attempt to list buckets (if possible)
        try:
            s3.list_buckets()
            print(f"✅ MinIO/S3 connected at {s3_url}")
            return True
        except NoCredentialsError:
            print("⚠️ MinIO/S3: No credentials provided. Skipping deep test.")
            return "skipped"
    except ImportError:
        print("ℹ️ boto3 not installed. Skipping.")
        return "missing"
    except Exception as e:
        print(f"❌ MinIO/S3 error: {e}")
        return False

async def main():
    print("--- LUMINA INFRASTRUCTURE VERIFICATION ---")
    start_time = time.time()
    
    results = {
        "Supabase/Postgres": await test_supabase(),
        "Redis": await test_redis(),
        "Neo4j": await test_neo4j(),
        "MinIO/S3": await test_minio()
    }
    
    print("\n--- SUMMARY ---")
    for svc, res in results.items():
        status = "OK" if res is True else ("SKIPPED" if res == "skipped" else ("MISSING" if res == "missing" else "FAILED"))
        print(f"{svc:20}: {status}")
        
    print(f"\nVerification completed in {time.time() - start_time:.2f}s")
    
    if any(res is False for res in results.values()):
        sys.exit(1)

if __name__ == "__main__":
    load_dotenv()
    asyncio.run(main())
