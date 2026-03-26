import asyncio
import os
from dotenv import load_dotenv

# load backend env
load_dotenv('backend/.env')

from backend.app.store.institution_store import InstitutionStore

async def main():
    store = InstitutionStore()
    insts = await store.list_institutions()
    print("ALL INSTS:", insts)
    primary = await store.get_primary_institution()
    print("PRIMARY:", primary)

if __name__ == "__main__":
    asyncio.run(main())
