import os
import importlib.util
import sys
import asyncio
from app.database.manager import db

MIGRATIONS_DIR = os.path.join(os.path.dirname(__file__), "migrations")


async def run_migrations():
    print("🚀 Running Lumina Database Migrations...")

    await db.connect()
    _db = db.get_db()
    if _db is None:
        print("❌ Error: Could not connect to database")
        return

    # Create migrations tracking collection
    migrations_col = _db["migrations"]

    # Get all migration files
    if not os.path.exists(MIGRATIONS_DIR):
        os.makedirs(MIGRATIONS_DIR)
        print("📁 Created migrations directory")
        return

    migration_files = sorted(
        [f for f in os.listdir(MIGRATIONS_DIR) if f.endswith(".py") and f[0].isdigit()]
    )

    applied_migrations = [m["name"] async for m in migrations_col.find({}, {"name": 1})]

    for filename in migration_files:
        if filename in applied_migrations:
            continue

        print(f"  - Applying {filename}...")
        try:
            # Load and run the migration
            file_path = os.path.join(MIGRATIONS_DIR, filename)
            spec = importlib.util.spec_from_file_location("migration", file_path)
            module = importlib.util.module_from_spec(spec)
            spec.loader.exec_module(module)

            if hasattr(module, "up"):
                # Pass the async db object
                await module.up(_db)

            # Record success
            await migrations_col.insert_one({"name": filename, "applied_at": os.times()[4]})
            print("    ✅ Success")
        except Exception as e:
            print(f"    ❌ Failed: {e}")
            break

    print("✅ All migrations processed")


if __name__ == "__main__":
    # Ensure app is in path
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))
    asyncio.run(run_migrations())
