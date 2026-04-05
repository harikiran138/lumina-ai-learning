import asyncio
import os
import sys
from typing import Any, Dict

import pytest
import pytest_asyncio
from httpx import ASGITransport, AsyncClient


BACKEND_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))

if BACKEND_ROOT not in sys.path:
    sys.path.insert(0, BACKEND_ROOT)

os.environ["SECURE_COOKIES"] = "false"
os.environ["TESTING"] = "true"
os.environ["LUMINA_FORCE_LOCAL_DB"] = "1"

from app.main import app as lumina_app
from app.database.supabase_manager import clear_global_mock_tables, supabase_db


class LifespanManager:
    """
    Lightweight fallback for `asgi_lifespan.LifespanManager`.
    """

    def __init__(self, app: Any):
        self.app = app
        self._receive_queue: "Any" = asyncio.Queue()
        self._startup_complete = asyncio.Event()
        self._shutdown_complete = asyncio.Event()
        self._task: Optional[asyncio.Task] = None
        self._error: Optional[BaseException] = None

    async def __aenter__(self):
        self._task = asyncio.create_task(self._run())
        await self._receive_queue.put({"type": "lifespan.startup"})
        await asyncio.wait_for(self._startup_complete.wait(), timeout=10)
        if self._error:
            raise self._error
        return self.app

    async def __aexit__(self, exc_type, exc, tb):
        await self._receive_queue.put({"type": "lifespan.shutdown"})
        await asyncio.wait_for(self._shutdown_complete.wait(), timeout=10)
        if self._task:
            await self._task
        if self._error and exc is None:
            raise self._error

    async def _run(self):
        scope = {"type": "lifespan", "asgi": {"version": "3.0", "spec_version": "2.0"}}
        try:
            await self.app(scope, self._receive, self._send)
        except BaseException as exc:  # pragma: no cover - surfacing startup/shutdown failures
            self._error = exc
            self._startup_complete.set()
            self._shutdown_complete.set()

    async def _receive(self):
        return await self._receive_queue.get()

    async def _send(self, message: Dict[str, Any]):
        message_type = message.get("type")
        if message_type == "lifespan.startup.complete":
            self._startup_complete.set()
        elif message_type == "lifespan.shutdown.complete":
            self._shutdown_complete.set()
        elif message_type == "lifespan.startup.failed":
            self._error = RuntimeError(str(message))
            self._startup_complete.set()
            self._shutdown_complete.set()
        elif message_type == "lifespan.shutdown.failed":
            self._error = RuntimeError(str(message))
            self._shutdown_complete.set()


@pytest.fixture(autouse=True)
def reset_test_state():
    clear_global_mock_tables()
    supabase_db.get_client(force_new=True)
    lumina_app.dependency_overrides.clear()
    yield
    lumina_app.dependency_overrides.clear()
    clear_global_mock_tables()


@pytest.fixture
def app():
    return lumina_app


@pytest.fixture
def local_db():
    return supabase_db.get_client(force_new=True)


@pytest_asyncio.fixture
async def async_client(app):
    transport = ASGITransport(app=app)
    async with LifespanManager(app):
        async with AsyncClient(
            transport=transport,
            base_url="http://test",
            timeout=10.0,
        ) as client:
            yield client


@pytest_asyncio.fixture
async def ac(async_client):
    yield async_client
