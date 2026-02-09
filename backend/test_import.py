import sys
import os

# Add current directory to path
sys.path.append(os.getcwd())

try:
    from app.store.redis_client import redis_client  # noqa: F401

    print("Import successful!")
except Exception as e:
    print(f"Import failed: {e}")
except SystemExit as e:
    print(f"SystemExit: {e}")
