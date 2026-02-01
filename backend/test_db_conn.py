from pymongo import MongoClient
import sys

uri = "mongodb+srv://Vercel-Admin-lumina_database:hari1388@lumina-database.dt7c2xn.mongodb.net/?retryWrites=true&w=majority"

try:
    client = MongoClient(uri, serverSelectionTimeoutMS=5000)
    # The ismaster command is cheap and does not require auth.
    client.admin.command('ismaster')
    print("Connection Successful")
except Exception as e:
    print(f"Connection Failed: {e}")
    sys.exit(1)
