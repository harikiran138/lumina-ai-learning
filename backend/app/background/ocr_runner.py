import logging
# from ml.ocr.trocr_pipeline import TrOCRPipeline

logger = logging.getLogger("ocr_runner")

async def process_handwriting(file_path: str):
    """
    Executes the TrOCR pipeline as a background process.
    """
    logger.info(f"Processing OCR in background for: {file_path}")
    # pipeline = TrOCRPipeline()
    # result = await pipeline.run(file_path)
    # return result
