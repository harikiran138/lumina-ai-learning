from fastapi import BackgroundTasks
import logging

logger = logging.getLogger("background_tasks")

async def run_ai_agent_task(payload: dict):
    """
    Wrapper for asynchronous LLM calls.
    Ensures all AI logic runs outside the sync API request cycle.
    """
    # Import here to avoid circular dependencies
    from app.background.ai_agent_runner import process_queue_item
    item_id = payload.get("id")
    if item_id:
        await process_queue_item(item_id)
    logger.info(f"Triggered background AI task: {payload}")

async def run_ocr_task(file_path: str):
    """
    Wrapper for TrOCR pipeline calls.
    """
    # from app.background.ocr_runner import process_handwriting
    # await process_handwriting(file_path)
    logger.info(f"Triggered background OCR task for {file_path}")
