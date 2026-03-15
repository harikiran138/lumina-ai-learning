from fastapi import APIRouter, Depends, HTTPException, status
from typing import List, Dict, Any, Optional
from pydantic import BaseModel
from .auth import get_current_user
from app.store.researcher_store import ResearcherStore
from app.dependencies import get_researcher_store

router = APIRouter()

class QueryRequest(BaseModel):
    query_text: str

@router.get("/snapshots")
async def get_research_snapshots(
    current_user: dict = Depends(get_current_user),
    store: ResearcherStore = Depends(get_researcher_store)
):
    if current_user.get("role") != "researcher":
        raise HTTPException(status_code=403, detail="Forbidden")
    return await store.get_snapshots()

@router.post("/query")
async def log_research_query(
    request: QueryRequest,
    current_user: dict = Depends(get_current_user),
    store: ResearcherStore = Depends(get_researcher_store)
):
    if current_user.get("role") != "researcher":
        raise HTTPException(status_code=403, detail="Forbidden")
    
    query = await store.log_query(current_user["id"], request.query_text)
    if not query:
        raise HTTPException(status_code=500, detail="Failed to log research query")
    return {"status": "success", "query": query}
