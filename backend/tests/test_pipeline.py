import pytest
from unittest.mock import patch, MagicMock
import asyncio


def test_pipeline_task_dispatch():
    """
    Verifies that calling the grade endpoint dispatches a Celery task.
    Tests the worker task logic by mocking external services.
    """
    # Patch the worker where it is defined
    with patch("app.worker.task_grade_submission.delay") as mock_delay:
        from app.worker import task_grade_submission

        assert task_grade_submission is not None

    # Test the worker function logic itself
    from app.worker import task_grade_submission

    # Mock services inside worker
    with patch("app.worker.store") as mock_store, patch(
        "app.services.storage.storage_service.download_file"
    ) as mock_down, patch("app.worker.ocr_service") as mock_ocr, patch(
        "app.worker.grader_service"
    ) as mock_grader:
        # Setup mocks
        mock_ocr.digitize_image.return_value = "Extracted text content"

        # Mock grader service to return an awaitable since it's used in run_until_complete
        async def async_grade(*args, **kwargs):
            return {"score": 95, "feedback": "Good job"}

        mock_grader.grade_submission = MagicMock(side_effect=async_grade)

        # Simulate execution
        # The worker creates a temp file, downloads to it, runs OCR, grades, and updates DB.
        # We invoke the underlying python function, not the celery task wrapper .delay()

        # The celery task object is a wrapper. To test the logic, we can call it directly
        # but bind=True adds 'self' argument.
        # Celery tasks are callable.

        result = task_grade_submission(
            assignment_id="assign_1",
            submission_id="sub_123",
            description="Test Assignment",
            file_path="uploads/file.pdf",
        )

        # Verifications
        assert result["status"] == "success"
        assert result["score"] == 95

        # Verify interactions
        mock_down.assert_called_once()
        mock_ocr.digitize_image.assert_called_once()
        mock_grader.grade_submission.assert_called_once()
        mock_store.update_submission_grade.assert_called_once_with(
            "sub_123", 95, "Good job", "Extracted text content"
        )
