import asyncio
from app.database.supabase_manager import supabase_db

async def x():
    client = supabase_db.get_client()
    try:
        sub = client.table('submissions').select('*').limit(1).execute()
        print('Submissions Columns:', list(sub.data[0].keys()) if sub.data else 'No data')
    except Exception as e:
        print('Submissions Error:', e)
        
    try:
        prog = client.table('progress').select('*').limit(1).execute()
        print('Progress Columns:', list(prog.data[0].keys()) if prog.data else 'No data')
    except Exception as e:
        print('Progress Error:', e)

if __name__ == "__main__":
    asyncio.run(x())
