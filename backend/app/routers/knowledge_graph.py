from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.database.supabase_manager import supabase_db
from app.store.local_store import LocalJsonStore
from app.core.logging import structlog
from .auth import get_current_user

log = structlog.get_logger()
router = APIRouter()


class KnowledgeNodePayload(BaseModel):
    concept: str
    difficulty: str = Field(default="beginner")
    prerequisites: List[str] = Field(default_factory=list)
    metadata: Dict[str, Any] = Field(default_factory=dict)


class KnowledgeGraphUpsert(BaseModel):
    nodes: List[KnowledgeNodePayload]


@router.get("/{course_id}")
async def list_knowledge_nodes(course_id: str, current_user: dict = Depends(get_current_user)):
    if current_user.get("role") not in {"teacher", "admin", "student"}:
        raise HTTPException(status_code=403, detail="Access denied")

    client = supabase_db.get_client()
    if client:
        try:
            rows = client.table("knowledge_nodes").select("*").eq("course_id", course_id).execute().data
            return rows
        except Exception as exc:
            log.warning("knowledge_nodes_fetch_failed", course_id=course_id, error=str(exc))

    store = LocalJsonStore()
    payload = store.read()
    return [node for node in payload.get("knowledge_nodes", []) if node.get("course_id") == course_id]


@router.post("/{course_id}/nodes")
async def upsert_knowledge_nodes(
    course_id: str,
    payload: KnowledgeGraphUpsert,
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") not in {"teacher", "admin"}:
        raise HTTPException(status_code=403, detail="Teacher access required")

    rows = [
        {
            "course_id": course_id,
            "concept": node.concept,
            "difficulty": node.difficulty,
            "prerequisites": node.prerequisites,
            "metadata": node.metadata,
        }
        for node in payload.nodes
    ]

    client = supabase_db.get_client()
    if client:
        try:
            client.table("knowledge_nodes").upsert(rows, on_conflict="course_id,concept").execute()
            return {"status": "success", "count": len(rows), "source": "supabase"}
        except Exception as exc:
            log.warning("knowledge_nodes_upsert_failed", course_id=course_id, error=str(exc))

    store = LocalJsonStore()
    db = store.read()
    existing = [node for node in db.get("knowledge_nodes", []) if node.get("course_id") != course_id]
    db["knowledge_nodes"] = existing + rows
    store.write(db)
    return {"status": "success", "count": len(rows), "source": "local"}
