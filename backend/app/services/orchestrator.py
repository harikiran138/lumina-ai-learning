"""
orchestrator.py — Master Adaptive Intelligence Orchestrator

This is the central pipeline. Every student answer flows through here.

on_student_answer() pipeline:
  1. capture_behavior()       → merge frontend signals into answer payload
  2. analyze_answer()         → multi-dimensional analysis (40/30/20/10)
  3. update_knowledge_models() → BKT update + DKT sequence update
  4. compute_kpis()           → KPISnapshot recompute
  5. detect_lag()             → identify struggling concepts
  6. update_style_model()     → RL reward to explanation style engine
  7. detect_traits()          → update student trait profile
  8. generate_next_question() → BKT/ZPD adaptive selection
  9. update_dashboard()       → log intervention if needed
  10. log_pipeline()          → orchestrator_log for debug/monitoring

Returns: OrchestratorResult (full state + next question + debug trace)
"""

from __future__ import annotations

import asyncio
import logging
import time
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

# ─── Result types ─────────────────────────────────────────────────────────────

@dataclass
class OrchestratorResult:
    # Answer analysis
    learning_score:    float
    correctness:       float
    depth:             float
    effort:            float
    growth_delta:      float

    # Authenticity
    authenticity_score: float
    probe_question:     Optional[str]

    # Knowledge state
    mastery_after:      float
    dkt_knowledge:      float
    lag_concepts:       List[str]
    mastered_concepts:  List[str]

    # Next adaptive step
    next_question:      Optional[Dict[str, Any]]
    next_question_type: str            # mcq | fill_blank | short_answer | long_answer | teach_back

    # Student state
    kpi_snapshot:       Dict[str, Any]
    traits:             Dict[str, Any]

    # Intervention
    intervention_triggered: bool
    intervention_reason:    Optional[str]

    # Timing
    pipeline_latency_ms: int

    # Debug trace (only populated in debug mode)
    debug_trace: Dict[str, Any] = field(default_factory=dict)


# ─── Orchestrator ─────────────────────────────────────────────────────────────

class AdaptiveOrchestrator:
    """
    Runs the full adaptive intelligence pipeline after every student answer.
    Designed to be async and complete in <300 ms in normal operation.
    """

    def __init__(self, db: Any):
        self._db = db

        # Lazily initialised sub-engines
        self._personalization_svc  = None
        self._dkt:   "DKTEngine"   = None   # type: ignore
        self._traits: "TraitEngine" = None  # type: ignore
        self._adaptive: "AdaptiveEngine" = None  # type: ignore
        self._spaced: "SpacedRepetitionScheduler" = None  # type: ignore
        self._analysis_engine = None

    # ── Lazy loader helpers ────────────────────────────────────────────────

    def _get_personalization_svc(self):
        if not self._personalization_svc:
            from app.services.personalization_service import PersonalizationService
            self._personalization_svc = PersonalizationService(db=self._db)
        return self._personalization_svc

    def _get_dkt(self):
        if not self._dkt:
            from app.services.dkt_engine import DKTEngine
            self._dkt = DKTEngine(db=self._db)
        return self._dkt

    def _get_traits(self):
        if not self._traits:
            from app.services.trait_detector import TraitEngine
            self._traits = TraitEngine(db=self._db)
        return self._traits

    def _get_adaptive(self):
        if not self._adaptive:
            from app.services.adaptive_engine import AdaptiveEngine
            self._adaptive = AdaptiveEngine(db=self._db)
        return self._adaptive

    def _get_analysis(self):
        if not self._analysis_engine:
            from app.services.answer_analysis import answer_analysis_engine
            self._analysis_engine = answer_analysis_engine
        return self._analysis_engine

    # ── Main entry point ──────────────────────────────────────────────────

    async def on_student_answer(
        self,
        *,
        user_id:          str,
        course_id:        str,
        topic_id:         str,
        question_id:      str,
        question_text:    str,
        answer_text:      str,
        is_correct:       bool,
        difficulty:       str       = "medium",
        correct_answer:   str       = "",

        # Timing
        time_taken_s:     float     = 0.0,
        correction_count: int       = 0,

        # From behavior tracker batch
        behavior_signals: Dict[str, Any] = None,

        # Session context
        session_id:       str       = "",
        exclude_q_ids:    List[str] = None,

        # Debug mode exposes full trace
        debug_mode:       bool      = False,

        # Current user context (for scoped DB calls)
        current_user:     Dict[str, Any] = None,
    ) -> OrchestratorResult:

        t_start = time.perf_counter()
        behavior_signals = behavior_signals or {}
        exclude_q_ids    = exclude_q_ids    or []
        current_user     = current_user     or {"id": user_id}

        # ── Step 1: Load current BKT mastery for this concept ─────────────
        mastery_before = await self._get_concept_mastery(user_id, course_id, topic_id)

        # ── Step 2: Analyze answer (multi-dimensional) ────────────────────
        answer_history = await self._get_answer_history(user_id, topic_id)
        analysis = self._get_analysis().analyze(
            answer_text      = answer_text,
            is_correct       = is_correct,
            difficulty       = difficulty,
            topic            = topic_id,
            question_text    = question_text,
            time_taken_s     = time_taken_s,
            correction_count = correction_count,
            behavior_signals = behavior_signals,
            mastery_before   = mastery_before,
            mastery_after    = mastery_before,  # Will update after BKT below
            answer_history   = answer_history,
        )

        # ── Step 3: Update knowledge models (BKT + DKT) ──────────────────
        bkt_result, dkt_result = await asyncio.gather(
            self._update_bkt(user_id, course_id, topic_id, is_correct, mastery_before, analysis.dimensions.learning_score),
            self._get_dkt().update(user_id, topic_id, is_correct),
        )
        mastery_after = bkt_result.get("mastery_after", mastery_before)

        # Re-run growth_delta with actual mastery_after
        growth_raw = mastery_after - mastery_before
        growth_delta = max(0.0, min(1.0, (growth_raw + 0.2) / 0.4))
        analysis.dimensions.growth_delta = round(growth_delta, 4)

        lag_concepts     = dkt_result.get("lag_concepts", [])
        mastered_conc    = dkt_result.get("mastered_concepts", [])
        dkt_knowledge    = dkt_result.get("knowledge_updated", mastery_after)

        # ── Step 4: Persist answer analytics record ───────────────────────
        await self._save_answer_analytics(
            user_id, course_id, topic_id, question_id,
            analysis, time_taken_s, correction_count,
            behavior_signals, difficulty, mastery_before, mastery_after
        )

        # ── Step 5: Record event → triggers KPI recompute ─────────────────
        from app.personalization.schemas import LearningEventType, QuizResultPayload
        score_pct = round(analysis.dimensions.learning_score * 100, 1)

        await self._get_personalization_svc().record_event(
            user_id,
            LearningEventType.ASSESSMENT_ANSWER,
            payload={
                "is_correct":          is_correct,
                "topic":               topic_id,
                "difficulty":          difficulty,
                "score":               score_pct,
                "learning_score":      analysis.dimensions.learning_score,
                "authenticity_score":  analysis.authenticity.score,
                "time_taken":          time_taken_s,
                "answer_text":         answer_text[:500],
                "correction_count":    correction_count,
                "session_id":          session_id,
                "question_id":         question_id,
            },
            source="orchestrator",
            course_id=course_id,
            topic_id=topic_id,
            role=current_user.get("role", "student"),
        )

        # ── Step 6: Load fresh KPI snapshot ───────────────────────────────
        kpi_snapshot = await self._get_kpi_snapshot(user_id)

        # ── Step 7: Update RL explanation style model ─────────────────────
        await self._update_explanation_style(user_id, analysis.dimensions.learning_score)

        # ── Step 8: Update student traits (async, fire-and-forget) ────────
        trait_task = asyncio.create_task(
            self._get_traits().update_traits(user_id)
        )

        # ── Step 9: Generate next adaptive question ───────────────────────
        next_q = await self._get_adaptive().select_next_question(
            user_id      = user_id,
            course_id    = course_id,
            topic_id     = topic_id if lag_concepts else None,
            exclude_ids  = exclude_q_ids + [question_id],
        )

        # ── Step 10: Intervention check ───────────────────────────────────
        intervention_triggered, intervention_reason = await self._check_interventions(
            user_id, course_id, kpi_snapshot,
            analysis.authenticity.score, lag_concepts,
            mastery_after, is_correct
        )

        # ── Step 11: Log pipeline execution ──────────────────────────────
        t_end = time.perf_counter()
        latency_ms = int((t_end - t_start) * 1000)

        await self._log_pipeline(
            user_id, course_id, question_id, latency_ms,
            analysis.dimensions.learning_score, analysis.authenticity.score,
            intervention_triggered
        )

        # Collect traits (may already be done)
        try:
            traits = await asyncio.wait_for(trait_task, timeout=0.5)
        except asyncio.TimeoutError:
            traits = {}

        # ── Build result ──────────────────────────────────────────────────
        result = OrchestratorResult(
            learning_score      = analysis.dimensions.learning_score,
            correctness         = analysis.dimensions.correctness,
            depth               = analysis.dimensions.depth,
            effort              = analysis.dimensions.effort,
            growth_delta        = analysis.dimensions.growth_delta,
            authenticity_score  = analysis.authenticity.score,
            probe_question      = analysis.probe_question,
            mastery_after       = mastery_after,
            dkt_knowledge       = dkt_knowledge,
            lag_concepts        = lag_concepts,
            mastered_concepts   = mastered_conc,
            next_question       = next_q,
            next_question_type  = analysis.question_type_rec,
            kpi_snapshot        = kpi_snapshot,
            traits              = traits,
            intervention_triggered = intervention_triggered,
            intervention_reason    = intervention_reason,
            pipeline_latency_ms    = latency_ms,
        )

        if debug_mode:
            result.debug_trace = {
                "answer_analysis":    analysis.debug_trace,
                "bkt":                bkt_result,
                "dkt":                dkt_result,
                "mastery_before":     mastery_before,
                "mastery_after":      mastery_after,
                "answer_history_len": len(answer_history),
                "pipeline_steps":     [
                    "behavior_capture",
                    "answer_analysis",
                    "bkt_update",
                    "dkt_update",
                    "answer_analytics_persist",
                    "personalization_event",
                    "kpi_recompute",
                    "style_update",
                    "trait_update",
                    "next_question_select",
                    "intervention_check",
                    "pipeline_log",
                ],
            }

        return result

    # ── Private helpers ───────────────────────────────────────────────────

    async def _get_concept_mastery(
        self, user_id: str, course_id: str, topic_id: str
    ) -> float:
        try:
            r = (
                await self._db.table("learner_profiles")
                .select("mastery_state")
                .eq("user_id", user_id)
                .maybe_single()
                .execute()
            )
            if r and r.data and r.data.get("mastery_state"):
                ms = r.data["mastery_state"]
                if topic_id in ms:
                    return float(ms[topic_id].get("score", 0.1))
        except Exception:
            pass
        # Fallback to skill_mastery
        try:
            r = (
                await self._db.table("skill_mastery")
                .select("mastery_score")
                .eq("user_id", user_id)
                .eq("course_id", course_id)
                .eq("skill_name", topic_id)
                .maybe_single()
                .execute()
            )
            if r and r.data:
                return float(r.data.get("mastery_score", 0.1))
        except Exception:
            pass
        return 0.1

    async def _update_bkt(
        self, user_id: str, course_id: str, topic_id: str,
        is_correct: bool, mastery_before: float, learning_score: float
    ) -> Dict[str, Any]:
        """
        BKT update using existing skill_mastery table.
        Uses the KnowledgeTracer from Analytics-Agent as the math engine.
        """
        from Analytics_Agent.analytics_agent.models.knowledge import KnowledgeTracer

        tracer = KnowledgeTracer()
        bkt_result = tracer.predict(
            features={},
            context={
                "concept_id":       topic_id,
                "is_correct":       is_correct,
                "current_p_mastery": mastery_before,
            }
        )
        mastery_after = bkt_result.get("probability", mastery_before)

        # Blend BKT result with learning score for richer update
        mastery_after = round(
            0.7 * mastery_after + 0.3 * (mastery_before + (learning_score - 0.5) * 0.2),
            4
        )
        mastery_after = max(0.0, min(1.0, mastery_after))

        # Update skill_mastery row
        try:
            update_data = {
                "mastery_score":     mastery_after,
                "last_assessed":     datetime.now(timezone.utc).isoformat(),
                "bkt_p_l0":          mastery_before,
            }
            existing = (
                await self._db.table("skill_mastery")
                .select("id, assessment_count")
                .eq("user_id", user_id)
                .eq("course_id", course_id)
                .eq("skill_name", topic_id)
                .maybe_single()
                .execute()
            )
            if existing and existing.data:
                count = int(existing.data.get("assessment_count") or 0) + 1
                update_data["assessment_count"] = count
                await (
                    self._db.table("skill_mastery")
                    .update(update_data)
                    .eq("id", existing.data["id"])
                    .execute()
                )
            else:
                await (
                    self._db.table("skill_mastery")
                    .insert({
                        "user_id":    user_id,
                        "course_id":  course_id,
                        "skill_name": topic_id,
                        "assessment_count": 1,
                        **update_data,
                    })
                    .execute()
                )
        except Exception as exc:
            logger.warning("orchestrator_bkt_persist_failed", error=str(exc))

        return {
            "mastery_before": mastery_before,
            "mastery_after":  mastery_after,
            "delta":          round(mastery_after - mastery_before, 4),
            "bkt_raw":        bkt_result,
        }

    async def _get_answer_history(
        self, user_id: str, topic_id: str, limit: int = 5
    ) -> List[str]:
        """Fetches last N answer texts for semantic fingerprint comparison."""
        try:
            r = (
                await self._db.table("answer_analytics")
                .select("answer_text")
                .eq("user_id", user_id)
                .eq("topic_id", topic_id)
                .order("created_at", desc=True)
                .limit(limit)
                .execute()
            )
            return [row["answer_text"] for row in (r.data or []) if row.get("answer_text")]
        except Exception:
            return []

    async def _save_answer_analytics(
        self, user_id, course_id, topic_id, question_id,
        analysis, time_taken_s, correction_count,
        behavior, difficulty, mastery_before, mastery_after
    ) -> None:
        try:
            await (
                self._db.table("answer_analytics")
                .insert({
                    "user_id":            user_id,
                    "course_id":          course_id,
                    "topic_id":           topic_id,
                    "question_id":        question_id,
                    "is_correct":         analysis.dimensions.correctness >= 0.5,
                    "learning_score":     analysis.dimensions.learning_score,
                    "correctness":        analysis.dimensions.correctness,
                    "depth_score":        analysis.dimensions.depth,
                    "effort_score":       analysis.dimensions.effort,
                    "growth_delta":       analysis.dimensions.growth_delta,
                    "authenticity_score": analysis.authenticity.score,
                    "authenticity_signals": {
                        "keystroke_burst":    analysis.authenticity.keystroke_burst,
                        "think_time_ratio":   analysis.authenticity.think_time_ratio,
                        "correction_pattern": analysis.authenticity.correction_pattern,
                        "vocabulary_jump":    analysis.authenticity.vocabulary_jump,
                        "semantic_drift":     analysis.authenticity.semantic_drift,
                        "probe_validated":    analysis.authenticity.probe_validated,
                    },
                    "time_taken_s":       time_taken_s,
                    "correction_count":   correction_count,
                    "answer_length":      len(str(analysis)),
                    "paste_count":        behavior.get("paste_count", 0),
                    "idle_count":         behavior.get("idle_count", 0),
                    "difficulty":         difficulty,
                    "mastery_before":     mastery_before,
                    "mastery_after":      mastery_after,
                    "probe_triggered":    analysis.probe_question is not None,
                    "next_q_type":        analysis.question_type_rec,
                })
                .execute()
            )
        except Exception as exc:
            logger.warning("orchestrator_save_analytics_failed", error=str(exc))

    async def _get_kpi_snapshot(self, user_id: str) -> Dict[str, Any]:
        try:
            r = (
                await self._db.table("learner_profiles")
                .select("kpi_snapshot")
                .eq("user_id", user_id)
                .maybe_single()
                .execute()
            )
            if r and r.data and r.data.get("kpi_snapshot"):
                return r.data["kpi_snapshot"]
        except Exception:
            pass
        return {}

    async def _update_explanation_style(self, user_id: str, learning_score: float) -> None:
        """Reward the last explanation mode with the learning score delta."""
        try:
            r = (
                await self._db.table("learner_profiles")
                .select("explanation_profile")
                .eq("user_id", user_id)
                .maybe_single()
                .execute()
            )
            if not r or not r.data:
                return
            exp_profile_raw = r.data.get("explanation_profile") or {}
            last_plan = exp_profile_raw.get("last_plan") or {}
            mode = last_plan.get("mode")
            if not mode:
                return

            # Update effectiveness for the mode that was just used
            strategies = exp_profile_raw.get("strategies") or {}
            if mode not in strategies:
                strategies[mode] = {
                    "mode_name": mode,
                    "effectiveness_score": 0.5,
                    "total_uses": 0,
                    "success_count": 0,
                }
            s = strategies[mode]
            alpha = 0.2
            s["effectiveness_score"] = round(
                (1 - alpha) * float(s["effectiveness_score"]) + alpha * learning_score,
                4
            )
            s["total_uses"] = int(s.get("total_uses", 0)) + 1
            if learning_score >= 0.7:
                s["success_count"] = int(s.get("success_count", 0)) + 1

            exp_profile_raw["strategies"] = strategies
            await (
                self._db.table("learner_profiles")
                .update({"explanation_profile": exp_profile_raw})
                .eq("user_id", user_id)
                .execute()
            )
        except Exception as exc:
            logger.warning("orchestrator_style_update_failed", error=str(exc))

    async def _check_interventions(
        self,
        user_id: str,
        course_id: str,
        kpi_snapshot: Dict[str, Any],
        authenticity: float,
        lag_concepts: List[str],
        mastery: float,
        is_correct: bool,
    ) -> tuple[bool, Optional[str]]:
        """
        Triggers an intervention if any threshold is breached.
        Returns (triggered, reason).
        """
        reasons = []

        growth_vel = float(kpi_snapshot.get("growth_velocity", 1.0))
        engagement = float(kpi_snapshot.get("engagement_score", 1.0))
        lag_score  = float(kpi_snapshot.get("lag_zone_score", 0.0))

        if authenticity < 0.4:
            reasons.append("low_authenticity")
        if growth_vel < 0.15 and engagement > 0.3:
            reasons.append("zero_growth_velocity")
        if lag_score > 0.6:
            reasons.append("high_lag_zone")
        if mastery < 0.3 and not is_correct:
            reasons.append("repeated_failure")
        if len(lag_concepts) >= 3:
            reasons.append("multiple_lag_concepts")

        if not reasons:
            return False, None

        # Log intervention
        reason_str = ", ".join(reasons)
        try:
            from app.personalization.schemas import InterventionPriority, InterventionStatus
            priority = (
                "critical" if "low_authenticity" in reasons or len(reasons) >= 3
                else "high" if len(reasons) >= 2
                else "medium"
            )
            await (
                self._db.table("intervention_logs")
                .insert({
                    "user_id":            user_id,
                    "course_id":          course_id,
                    "type":               "ai_triggered",
                    "priority":           priority,
                    "status":             "open",
                    "reason":             reason_str,
                    "recommended_action": self._intervention_action(reasons),
                    "created_at":         datetime.now(timezone.utc).isoformat(),
                })
                .execute()
            )
        except Exception as exc:
            logger.warning("orchestrator_intervention_log_failed", error=str(exc))

        return True, reason_str

    @staticmethod
    def _intervention_action(reasons: List[str]) -> str:
        if "low_authenticity" in reasons:
            return "Review student for academic integrity concern. Consider oral verification."
        if "zero_growth_velocity" in reasons:
            return "Student is not progressing. Assign remediation content or schedule 1:1."
        if "high_lag_zone" in reasons:
            return "Student is stuck in lag zone. Reduce difficulty and provide worked examples."
        return "Monitor student progress — multiple risk signals detected."

    async def _log_pipeline(
        self,
        user_id: str, course_id: str, question_id: str,
        latency_ms: int, learning_score: float,
        authenticity: float, intervention: bool,
    ) -> None:
        try:
            await (
                self._db.table("orchestrator_log")
                .insert({
                    "user_id":             user_id,
                    "course_id":           course_id,
                    "question_id":         question_id,
                    "latency_ms":          latency_ms,
                    "learning_score":      round(learning_score, 4),
                    "authenticity_score":  round(authenticity, 4),
                    "intervention":        intervention,
                    "created_at":          datetime.now(timezone.utc).isoformat(),
                })
                .execute()
            )
        except Exception:
            pass  # Logging failure should never break the pipeline
