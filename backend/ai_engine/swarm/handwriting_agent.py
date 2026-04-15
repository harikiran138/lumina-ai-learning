import asyncio
import threading
from typing import Any, Dict, Optional

from PIL import Image

from app.services.ocr_service import ocr_service


class HandwritingAgent:
    """
    Compatibility adapter over the current OCR service.
    """

    def analyze(self, file_path: str, answer_key: Optional[str] = None) -> Dict[str, Any]:
        image = Image.open(file_path)
        result_holder: Dict[str, Any] = {}

        def _run_ocr() -> None:
            result_holder["result"] = asyncio.run(ocr_service.extract_text(image, method="auto"))

        try:
            asyncio.get_running_loop()
        except RuntimeError:
            _run_ocr()
        else:
            thread = threading.Thread(target=_run_ocr, daemon=True)
            thread.start()
            thread.join()

        result = result_holder["result"]

        return {
            "extracted_text": result.text,
            "confidence": result.confidence,
            "is_flagged": result.is_flagged,
            "model_used": result.model_used,
            "answer_key_used": bool(answer_key),
        }
