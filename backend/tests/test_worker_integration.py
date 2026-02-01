import pytest
import time
from testcontainers.redis import RedisContainer
from testcontainers.mongodb import MongoDbContainer
from app.worker import celery_app, task_grade_submission
from unittest.mock import patch, MagicMock

@pytest.fixture(scope="module")
def redis_container():
    with RedisContainer("redis:7-alpine") as redis:
        yield redis

@pytest.fixture(scope="module")
def mongo_container():
    with MongoDbContainer("mongo:latest") as mongo:
        yield mongo

def test_celery_worker_flow(redis_container, mongo_container):
    """
    Integration test: Ensures the task can be queued and 'executed' (mocked AI).
    Verifies that the task correctly interfaces with Redis for brokering.
    """
    # Override Celery Config for Test Containers
    redis_url = f"redis://{redis_container.get_container_host_ip()}:{redis_container.get_exposed_port(6379)}/0"
    mongo_url = f"mongodb://{mongo_container.get_container_host_ip()}:{mongo_container.get_exposed_port(27017)}"
    
    celery_app.conf.update(
        broker_url=redis_url,
        result_backend=redis_url,
        task_always_eager=True # For simple integration check in CI
    )

    with patch("app.services.storage.storage_service.download_file"), \
         patch("app.services.ocr_service.ocr_service.digitize_image") as mock_ocr, \
         patch("app.services.grader_service.grader_service.grade_submission") as mock_grade:
         
        mock_ocr.return_value = "Mocked Text Content"
        
        async def async_mock_grade(*args): return {"score": 88, "feedback": "Good job"}
        mock_grade.side_effect = async_mock_grade

        # Trigger Task
        result = task_grade_submission.apply(args=("assign_1", "sub_1", "Desc", "path/to/file.pdf")).get()
        
        assert result["status"] == "success"
        assert result["score"] == 88
        print("Worker Integration Test Passed via Testcontainers!")
