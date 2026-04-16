"""
ModelRegistry — thread-safe singleton for lazy ML model loading.

Rules:
  - Models are loaded ONLY when first requested (never at startup)
  - TrOCR is always unloaded immediately after use (too large to keep)
  - FAISS behaviour controlled by env var FAISS_KEEP_IN_MEMORY
  - BKT and XGBoost stay loaded after first use (small footprint)

Usage:
    from ml_services.model_registry import ModelRegistry

    # In a Celery task:
    registry = ModelRegistry.get()
    bkt = registry.load_bkt()
    result = bkt.predict(...)

    # For TrOCR — always unload after task:
    trocr = registry.load_trocr()
    text = trocr["processor"].batch_decode(...)
    registry.unload("trocr")        # MANDATORY after every grading task
"""

import gc
import os
import threading
import logging

log = logging.getLogger(__name__)

FAISS_KEEP_IN_MEMORY = os.getenv("FAISS_KEEP_IN_MEMORY", "true").lower() == "true"
TROCR_LOAD_ON_DEMAND = os.getenv("TROCR_LOAD_ON_DEMAND", "true").lower() == "true"


class ModelRegistry:
    """
    Singleton model cache with lazy loading and explicit unload support.
    Thread-safe via per-key locks.
    """

    _instance: "ModelRegistry | None" = None
    _global_lock = threading.Lock()

    def __init__(self):
        self._models: dict = {}
        self._locks: dict[str, threading.Lock] = {}

    def _lock_for(self, key: str) -> threading.Lock:
        if key not in self._locks:
            with self._global_lock:
                if key not in self._locks:
                    self._locks[key] = threading.Lock()
        return self._locks[key]

    @classmethod
    def get(cls) -> "ModelRegistry":
        """Return the singleton instance."""
        if cls._instance is None:
            with cls._global_lock:
                if cls._instance is None:
                    cls._instance = cls()
        return cls._instance

    # ── BKT Model ──────────────────────────────────────────────────────────────
    def load_bkt(self):
        """Load BKT (Bayesian Knowledge Tracing) model. Stays in memory."""
        key = "bkt"
        with self._lock_for(key):
            if key not in self._models:
                import pickle
                model_path = os.path.join(
                    os.path.dirname(__file__), "models", "bkt.pkl"
                )
                if os.path.exists(model_path):
                    log.info("Loading BKT model from %s", model_path)
                    with open(model_path, "rb") as f:
                        self._models[key] = pickle.load(f)
                else:
                    # Fallback: import class-based BKT
                    from learner_profile.models.bkt import BKTModel
                    self._models[key] = BKTModel()
                    log.info("BKT model initialised (no pkl found — fresh instance)")
        return self._models[key]

    # ── XGBoost Dropout Predictor ──────────────────────────────────────────────
    def load_dropout(self):
        """Load XGBoost dropout risk model. Stays in memory."""
        key = "xgb_dropout"
        with self._lock_for(key):
            if key not in self._models:
                try:
                    import xgboost as xgb
                    model_path = os.path.join(
                        os.path.dirname(__file__), "models", "dropout.json"
                    )
                    booster = xgb.Booster()
                    booster.load_model(model_path)
                    self._models[key] = booster
                    log.info("XGBoost dropout model loaded")
                except Exception as exc:
                    log.warning("XGBoost load failed (%s) — returning None", exc)
                    return None
        return self._models[key]

    # ── TrOCR (on-demand only) ─────────────────────────────────────────────────
    def load_trocr(self, model_name: str = "microsoft/trocr-large-handwritten"):
        """
        Load TrOCR processor + model.
        ALWAYS call registry.unload("trocr") after your task completes.
        """
        key = "trocr"
        with self._lock_for(key):
            if key not in self._models:
                from transformers import TrOCRProcessor, VisionEncoderDecoderModel
                import torch
                log.info("Loading TrOCR model: %s", model_name)
                processor = TrOCRProcessor.from_pretrained(model_name)
                model = VisionEncoderDecoderModel.from_pretrained(model_name)
                device = "cuda" if torch.cuda.is_available() else "cpu"
                model = model.to(device)
                model.eval()
                self._models[key] = {"processor": processor, "model": model, "device": device}
                log.info("TrOCR loaded on device: %s", device)
        return self._models[key]

    # ── FAISS Index ────────────────────────────────────────────────────────────
    def load_faiss(self, index_path: str = "models/faiss.index"):
        """
        Load FAISS vector index.
        If FAISS_KEEP_IN_MEMORY=false, caller should unload("faiss") after query.
        """
        key = "faiss"
        with self._lock_for(key):
            if key not in self._models:
                import faiss
                full_path = os.path.join(os.path.dirname(__file__), index_path)
                if os.path.exists(full_path):
                    log.info("Loading FAISS index from %s", full_path)
                    self._models[key] = faiss.read_index(full_path)
                else:
                    log.warning("FAISS index not found at %s — returning None", full_path)
                    return None
        return self._models[key]

    # ── Unload ──────────────────────────────────────────────────────────────────
    def unload(self, key: str) -> bool:
        """
        Explicitly free a model from memory and run GC.
        Returns True if the model was loaded and is now freed.
        """
        with self._lock_for(key):
            if key in self._models:
                del self._models[key]
                gc.collect()
                try:
                    import torch
                    if torch.cuda.is_available():
                        torch.cuda.empty_cache()
                except ImportError:
                    pass
                log.info("Model unloaded: %s", key)
                return True
        return False

    def loaded_models(self) -> list[str]:
        """Return list of currently loaded model keys (for /health endpoint)."""
        return list(self._models.keys())
