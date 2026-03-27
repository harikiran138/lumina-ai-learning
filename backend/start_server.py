import socket
import sys

# FORCE IPv4 to prevent IPv6 blackhole hanging (Mac/Supabase bug)
old_getaddrinfo = socket.getaddrinfo
def new_getaddrinfo(*args, **kwargs):
    try:
        responses = old_getaddrinfo(*args, **kwargs)
        ipv4_only = [res for res in responses if res[0] == socket.AF_INET]
        return ipv4_only if ipv4_only else responses
    except Exception as e:
        return old_getaddrinfo(*args, **kwargs)

socket.getaddrinfo = new_getaddrinfo

import uvicorn

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
