"""
dkt_engine.py — Deep Knowledge Tracing (Lightweight Sequence Model)

Implements a practical DKT approximation without requiring PyTorch/TensorFlow:

Architecture:
  - Maintains a "hidden state" vector per student (concept_id → float)
  - Each interaction updates the state using an exponential decay model
    that approximates LSTM gating behavior:
      h_t = gate * h_{t-1} + (1 - gate) * x_t
    where gate = sigmoid(recency_weight)
  - Concept dependencies: performance on a concept boosts related concepts
  - Predicts next-step performance using the current hidden state

The hidden state is persisted per student in the `dkt_states` table (JSONB).

For production-scale DKT with real LSTM, connect the FastAPI ML service
on port 9000 — this engine serves as the CPU-resident fallback.
"""

from __future__ import annotations

import math
import logging
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional, Tuple

logger = logging.getLogger(__name__)

# ─── Constants ─────────────────────────────────────────────────────────────────

# Forgetting rate: how quickly un-practiced concepts decay
DECAY_RATE = 0.03          # per day

# Gate weight: how much the new observation shifts the hidden state
LEARNING_RATE = 0.25       # LSTM-like update gate

# Concept dependency strength (co-occurrence bonus)
DEPENDENCY_STRENGTH = 0.15

# Prerequisite graph: concept_id → list of concepts it unlocks / is related to
# In a real system this would be fetched from the knowledge graph (Neo4j)
# Here we define a generic dependency strength; actual relationships come from DB
DEFAULT_RELATED_BONUS = 0.08

# ─── Sigmoid ──────────────────────────────────────────────────────────────────

def _sigmoid(x: float) -> float:
    return 1.0 / (1.0 + math.exp(-x))


# ─── Decay ────────────────────────────────────────────────────────────────────

def _apply_decay(value: float, days_since: float) -> float:
    """Ebbinghaus-inspired exponential decay of knowledge retention."""
    if days_since <= 0:
        return value
    return value * math.exp(-DECAY_RATE * days_since)


# ─── DKT State ────────────────────────────────────────────────────────────────

class DKTState:
    """
    Lightweight hidden state for one student.
    state: {concept_id: float (0-1 knowledge probability)}
    timestamps: {concept_id: ISO timestamp of last update}
    sequence: list of (concept_id, correct, timestamp) tuples (last 50)
    """

    def __init__(self, raw: Optional[Dict[str, Any]] = None):
        raw = raw or {}
        self.state:      Dict[str, float]  = raw.get("state", {})
        self.timestamps: Dict[str, str]    = raw.get("timestamps", {})
        self.sequence:   List[Dict]        = raw.get("sequence", [])

    def to_dict(self) -> Dict[str, Any]:
        return {
            "state":      self.state,
            "timestamps": self.timestamps,
            "sequence":   self.sequence[-50:],  # keep last 50 interactions
        }

    def get_knowledge(self, concept_id: str) -> float:
        """Returns decayed knowledge probability for a concept."""
        raw_val = self.state.get(concept_id, 0.1)
        ts_str = self.timestamps.get(concept_id)
        if ts_str:
            try:
                ts = datetime.fromisoformat(ts_str)
                if ts.tzinfo is None:
                    ts = ts.replace(tzinfo=timezone.utc)
                days = (datetime.now(timezone.utc) - ts).total_seconds() / 86400
                return max(0.05, _apply_decay(raw_val, days))
            except ValueError:
                pass
        return raw_val

    def update(
        self,
        concept_id: str,
        observation: float,   # 1.0 = correct, 0.0 = incorrect
        related_concepts: Optional[List[str]] = None,
    ) -> float:
        """
        LSTM-like update:
          h_t = gate * h_{t-1} + (1 - gate) * obs
        Returns updated knowledge probability.
        """
        h_prev = self.get_knowledge(concept_id)

        # Gate: higher current knowledge → stronger retention
        gate = _sigmoid(h_prev * 4.0 - 2.0)  # sigmoid centred at 0.5

        h_new = gate * h_prev + (1.0 - gate) * (LEARNING_RATE * observation + (1 - LEARNING_RATE) * h_prev)

        # Ensure monotonic improvement on correct answer
        if observation >= 0.5:
            h_new = max(h_new, h_prev + 0.02)

        h_new = round(max(0.0, min(1.0, h_new)), 4)
        self.state[concept_id] = h_new

        now_iso = datetime.now(timezone.utc).isoformat()
        self.timestamps[concept_id] = now_iso

        # Record in sequence
        self.sequence.append({
            "concept": concept_id,
            "correct": observation >= 0.5,
            "value": h_new,
            "ts": now_iso,
        })

        # Propagate partial boost to related concepts
        if related_concepts:
            boost = DEFAULT_RELATED_BONUS if observation >= 0.5 else -DEFAULT_RELATED_BONUS * 0.3
            for rel in related_concepts:
                current = self.state.get(rel, 0.1)
                self.state[rel] = round(max(0.0, min(1.0, current + boost)), 4)

        return h_new

    def predict_next(self, concept_id: str) -> float:
        """
        Predict probability of correct answer on this concept next time.
        Uses the current hidden state + simple sequence pattern.
        """
        current = self.get_knowledge(concept_id)

        # Check recent sequence for this concept
        recent = [
            e for e in self.sequence[-20:]
            if e["concept"] == concept_id
        ]
        if not recent:
            return current

        # Trend: is the student improving or declining on this concept?
        if len(recent) >= 2:
            last_values = [r["value"] for r in recent[-3:]]
            trend = (last_values[-1] - last_values[0]) / max(len(last_values) - 1, 1)
            prediction = current + trend * 0.5
        else:
            prediction = current

        return round(max(0.05, min(0.99, prediction)), 4)

    def get_all_predictions(self) -> Dict[str, float]:
        """Returns predicted performance for all tracked concepts."""
        return {
            concept_id: self.predict_next(concept_id)
            for concept_id in self.state
        }

    def get_lag_concepts(self, threshold: float = 0.45) -> List[str]:
        """Returns concept IDs where predicted knowledge is below threshold."""
        return [
            cid for cid, val in self.state.items()
            if self.get_knowledge(cid) < threshold
        ]

    def get_mastered_concepts(self, threshold: float = 0.75) -> List[str]:
        """Returns concept IDs the student has likely mastered."""
        return [
            cid for cid, val in self.state.items()
            if self.get_knowledge(cid) >= threshold
        ]


# ─── DKT Engine (DB-backed) ───────────────────────────────────────────────────

class DKTEngine:
    """
    Manages DKT state persistence per student.
    States are stored in dkt_states table as JSONB.
    """

    def __init__(self, db: Any):
        self._db = db
        self._cache: Dict[str, DKTState] = {}

    async def _load(self, user_id: str) -> DKTState:
        if user_id in self._cache:
            return self._cache[user_id]
        try:
            result = (
                await self._db.table("dkt_states")
                .select("state_data")
                .eq("user_id", user_id)
                .maybe_single()
                .execute()
            )
            raw = result.data.get("state_data") if result and result.data else None
            state = DKTState(raw)
        except Exception as exc:
            logger.warning("dkt_load_failed", user_id=user_id, error=str(exc))
            state = DKTState()

        self._cache[user_id] = state
        return state

    async def _save(self, user_id: str, state: DKTState) -> None:
        try:
            await (
                self._db.table("dkt_states")
                .upsert(
                    {
                        "user_id": user_id,
                        "state_data": state.to_dict(),
                        "updated_at": datetime.now(timezone.utc).isoformat(),
                    },
                    on_conflict="user_id",
                )
                .execute()
            )
        except Exception as exc:
            logger.warning("dkt_save_failed", user_id=user_id, error=str(exc))

    async def update(
        self,
        user_id: str,
        concept_id: str,
        is_correct: bool,
        related_concepts: Optional[List[str]] = None,
    ) -> Dict[str, Any]:
        """
        Update DKT state after an answer event.
        Returns updated state summary.
        """
        state = await self._load(user_id)
        obs = 1.0 if is_correct else 0.0
        new_knowledge = state.update(concept_id, obs, related_concepts)
        prediction = state.predict_next(concept_id)
        lag_concepts = state.get_lag_concepts()
        mastered_concepts = state.get_mastered_concepts()

        await self._save(user_id, state)

        return {
            "concept_id": concept_id,
            "knowledge_updated": new_knowledge,
            "next_prediction": prediction,
            "lag_concepts": lag_concepts,
            "mastered_concepts": mastered_concepts,
            "all_predictions": state.get_all_predictions(),
        }

    async def get_state_summary(self, user_id: str) -> Dict[str, Any]:
        """Returns full DKT state summary for the dashboard."""
        state = await self._load(user_id)
        return {
            "knowledge_state": {
                cid: {
                    "knowledge": state.get_knowledge(cid),
                    "prediction": state.predict_next(cid),
                }
                for cid in state.state
            },
            "lag_concepts":      state.get_lag_concepts(),
            "mastered_concepts": state.get_mastered_concepts(),
            "sequence_length":   len(state.sequence),
        }

    async def predict_performance(
        self, user_id: str, concept_id: str
    ) -> float:
        state = await self._load(user_id)
        return state.predict_next(concept_id)

    async def get_sequence(self, user_id: str, last_n: int = 20) -> List[Dict]:
        """Returns last N interactions for debug tracing."""
        state = await self._load(user_id)
        return state.sequence[-last_n:]
