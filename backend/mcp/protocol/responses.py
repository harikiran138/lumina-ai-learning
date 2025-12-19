from pydantic import BaseModel
from typing import Any, Optional

class MCPResponse(BaseModel):
    """
    Base MCP Response Schema.
    """
    jsonrpc: str = "2.0"
    result: Optional[Any] = None
    error: Optional[dict] = None
    id: str | int
