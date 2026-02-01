import asyncio
import functools

def run_async(coro):
    """
    Safely run an async coroutine from a synchronous context.
    Specifically useful for Celery workers.
    """
    try:
        loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
    
    return loop.run_until_complete(coro)
