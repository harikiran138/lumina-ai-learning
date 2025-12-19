import sys
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, OperationFailure

def verify_connection(uri):
    print(f"Attempting to connect with URI: {uri}")
    try:
        client = MongoClient(uri, serverSelectionTimeoutMS=5000)
        # The ismaster command is cheap and does not require auth.
        client.admin.command('ismaster')
        print("Server available.")
        
        # Now check authentication and access
        try:
            print("Listing databases...")
            dbs = client.list_database_names()
            print(f"Successfully connected! Available databases: {dbs}")
            return True
        except OperationFailure as e:
            print(f"Authentication failed or insufficient permissions: {e}")
            return False
            
    except ConnectionFailure as e:
        print(f"Server not available: {e}")
        return False
    except Exception as e:
        print(f"An error occurred: {e}")
        return False

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python verify_db_connection.py <mongodb_uri>")
        sys.exit(1)
    
    uri = sys.argv[1]
    success = verify_connection(uri)
    sys.exit(0 if success else 1)
