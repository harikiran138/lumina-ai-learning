
import sys
import os

# Add backend to sys.path
sys.path.append(os.getcwd())

try:
    from app import main
    print("Import successful")
except Exception as e:
    print(f"Import failed: {e}")
    import traceback
    traceback.print_exc()
