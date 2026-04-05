from typing import Any, Optional, Generic, TypeVar, List
from pydantic import BaseModel
from fastapi.responses import JSONResponse

T = TypeVar("T")

class BaseResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[str] = None
    message: Optional[str] = None
    path: Optional[str] = None
    meta: Optional[dict] = None

def success_response(data: Any = None, message: str = "Operation successful", meta: dict = None) -> dict:
    return {
        "success": True,
        "data": data,
        "message": message,
        "meta": meta or {}
    }

def error_response(
    error: str, 
    message: str = "An error occurred", 
    status_code: int = 400, 
    path: str = None,
    detail: Any = None
) -> JSONResponse:
    content = {
        "success": False,
        "error": error,
        "message": message,
        "path": path
    }
    if detail:
        content["detail"] = detail
        
    return JSONResponse(
        status_code=status_code,
        content=content
    )
