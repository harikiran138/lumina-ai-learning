import time
from fastapi import Request
import logging

logger = logging.getLogger("audit")

async def audit_log_middleware(request: Request, call_next):
    """
    Writes an audit record for all state-changing operations (POST, PUT, PATCH, DELETE).
    """
    start_time = time.time()
    
    response = await call_next(request)
    
    if request.method in ["POST", "PUT", "PATCH", "DELETE"]:
        duration = time.time() - start_time
        user = getattr(request.state, "user", "anonymous")
        institution_id = getattr(request.state, "institution_id", "none")
        
        logger.info(
            f"AUDIT: user={user} institution={institution_id} method={request.method} "
            f"path={request.url.path} status={response.status_code} duration={duration:.3f}s"
        )
        
    return response
