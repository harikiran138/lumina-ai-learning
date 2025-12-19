import os
import sys
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure

# URI from .env.local
MONGO_URI = "mongodb+srv://Vercel-Admin-lumina-database:VsmkyNxpyjm8VpeU@lumina-database.dt7c2xn.mongodb.net/?retryWrites=true&w=majority"

def check_mongo():
    print(f"Attempting to connect to MongoDB...")
    try:
        client = MongoClient(MONGO_URI, serverSelectionTimeoutMS=5000)
        # Force a connection verification
        client.admin.command('ping')
        print("✅ MongoDB Connection Successful!")
        
        # List databases
        dbs = client.list_database_names()
        print(f"Databases: {dbs}")
        
        # Check specific database if applicable
        db_name = "lumina-database" # inferred from URI or code
        if db_name in dbs or True: # Cloud Atlas might hide some, just try accessing
            db = client[db_name]
            collections = db.list_collection_names()
            print(f"Collections in '{db_name}': {collections}")
            
            for col_name in collections:
                count = db[col_name].count_documents({})
                print(f" - {col_name}: {count} documents")
                
                # Show sample data
                if count > 0:
                    sample = db[col_name].find_one()
                    print(f"   Sample doc: {list(sample.keys())}")
                    
    except ConnectionFailure:
        print("❌ MongoDB Connection Failed: Server not available.")
    except OperationFailure as e:
        print(f"❌ MongoDB Authentication/Operation Failed: {e}")
    except Exception as e:
        print(f"❌ An error occurred: {e}")

if __name__ == "__main__":
    check_mongo()
