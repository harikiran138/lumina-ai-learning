from slowapi import Limiter
from slowapi.util import get_remote_address

# Initialize global limiter
# Uses client IP address for identification
limiter = Limiter(key_func=get_remote_address)
