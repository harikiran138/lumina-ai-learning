from pydantic import BaseModel

class MCPRequest(BaseModel):
    """
    Base MCP Request Schema.
    """
    jsonrpc: str = "2.0"
    method: str
    params: dict = {}
    id: str | int
