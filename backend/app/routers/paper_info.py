from fastapi import APIRouter, HTTPException
from typing import Optional, Dict, Any
import httpx

router = APIRouter()

@router.get("/{arxiv_id}")
async def get_paper_info(arxiv_id: str):
    """
    Fetch paper information from Hugging Face's API.
    """
    url = f"https://huggingface.co/api/papers/{arxiv_id}"
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(url)
            if resp.status_code == 200:
                data = resp.json()
                # Return relevant fields
                return {
                    "id": data.get("id"),
                    "title": data.get("title"),
                    "authors": data.get("authors"),
                    "summary": data.get("summary"),
                    "publishedAt": data.get("publishedAt"),
                    "upvotes": data.get("upvotes"),
                    "comments": data.get("comments"),
                    "paperUrl": f"https://huggingface.co/papers/{arxiv_id}",
                    "pdfUrl": f"https://arxiv.org/pdf/{arxiv_id}.pdf"
                }
            elif resp.status_code == 404:
                raise HTTPException(status_code=404, detail=f"Paper with arXiv ID {arxiv_id} not found on Hugging Face.")
            else:
                raise HTTPException(status_code=resp.status_code, detail=f"External API error: {resp.text}")
    except httpx.RequestError as e:
        raise HTTPException(status_code=503, detail=f"Service unavailable: {str(e)}")
