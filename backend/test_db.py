from app.database.supabase_manager import supabase_db
client = supabase_db.get_client()

# Check user ID for student
users = client.table("users").select("id, email").eq("role", "student").execute().data
if users:
    student_id = users[0]["id"]
    print(f"Student: {users[0]['email']} (ID: {student_id})")
    
    # Check progress
    progress = client.table("progress").select("*").eq("user_id", student_id).execute().data
    print(f"Progress records: {len(progress)}")
    if progress:
        print(progress)
    else:
        print("No progress records found.")
else:
    print("No student found.")
