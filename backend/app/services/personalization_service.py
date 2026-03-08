import hashlib
from datetime import datetime
from typing import Any, Dict, List, Optional

from app.core.logging import structlog
from app.personalization.schemas import (
    ConceptMastery,
    EngagementSummary,
    InterventionPriority,
    InterventionRecommendation,
    InterventionStatus,
    LearnerProfileRecord,
    LearningEventRecord,
    LearningEventType,
    PerformanceSummary,
    RiskSummary,
)
from app.store.personalization_store import PersonalizationStore
from learner_profile.analysis.cognitive_load import CognitiveLoadEstimator
from learner_profile.models.bkt import BKTModel

log = structlog.get_logger()


class PersonalizationService:
    """
    Updates the canonical learner profile from events generated across the LMS.
    """

    def __init__(self):
        self.store = PersonalizationStore()
        self.bkt = BKTModel()
        self.cognitive_load = CognitiveLoadEstimator()

    def _default_profile(self, user_id: str, role: str = "student") -> LearnerProfileRecord:
        return LearnerProfileRecord(user_id=user_id, role=role)

    def _risk_from_profile(self, profile: LearnerProfileRecord) -> RiskSummary:
        reasons: List[str] = []
        score = 0.0

        if profile.performance_summary.recent_average_score < 60:
            score += 0.35
            reasons.append("recent scores are low")
        if len(profile.weak_topics) >= 3:
            score += 0.25
            reasons.append("multiple weak topics detected")
        if profile.behavior_signals.get("cognitive_load", 50) > 75:
            score += 0.2
            reasons.append("high cognitive load detected")
        if profile.engagement_summary.total_tutor_interactions >= 5 and profile.performance_summary.recent_average_score < 50:
            score += 0.1
            reasons.append("frequent help requests with limited progress")
        if profile.engagement_summary.last_activity_at is None:
            score += 0.05
            reasons.append("limited recent activity")

        score = min(1.0, score)
        if score >= 0.75:
            level = "critical"
        elif score >= 0.5:
            level = "high"
        elif score >= 0.25:
            level = "medium"
        else:
            level = "low"

        return RiskSummary(
            risk_level=level,
            risk_score=score,
            confidence=0.7 if reasons else 0.4,
            reasons=reasons,
            last_evaluated_at=datetime.utcnow(),
        )

    def _ensure_mastery(self, profile: LearnerProfileRecord, topic_id: str) -> ConceptMastery:
        if topic_id not in profile.mastery_state:
            profile.mastery_state[topic_id] = ConceptMastery()
        return profile.mastery_state[topic_id]

    def _update_mastery_from_score(
        self,
        profile: LearnerProfileRecord,
        topic_id: str,
        score_pct: float,
        source: str,
        attempts: int = 1,
    ):
        mastery = self._ensure_mastery(profile, topic_id)
        normalized = max(0.0, min(1.0, score_pct / 100.0))
        previous = mastery.score
        mastery.score = round((previous * 0.6) + (normalized * 0.4), 4)
        mastery.confidence = round(min(1.0, mastery.confidence + 0.05), 4)
        mastery.attempts += attempts
        if normalized >= 0.7:
            mastery.successes += 1
        mastery.last_assessed_at = datetime.utcnow()
        mastery.last_source = source

        weak_topics = set(profile.weak_topics)
        if mastery.score < 0.6:
            weak_topics.add(topic_id)
        elif topic_id in weak_topics and mastery.score >= 0.7:
            weak_topics.remove(topic_id)
        profile.weak_topics = sorted(list(weak_topics))

    def _update_mastery_from_binary(
        self, profile: LearnerProfileRecord, topic_id: str, is_correct: bool, source: str
    ):
        mastery = self._ensure_mastery(profile, topic_id)
        mastery.score = round(self.bkt.update_mastery(mastery.score or self.bkt.p_l0, is_correct), 4)
        mastery.confidence = round(min(1.0, mastery.confidence + 0.04), 4)
        mastery.attempts += 1
        mastery.successes += 1 if is_correct else 0
        mastery.last_assessed_at = datetime.utcnow()
        mastery.last_source = source

        weak_topics = set(profile.weak_topics)
        if mastery.score < 0.6:
            weak_topics.add(topic_id)
        elif mastery.score >= 0.7 and topic_id in weak_topics:
            weak_topics.remove(topic_id)
        profile.weak_topics = sorted(list(weak_topics))

    def _stable_topic_code(self, topic_id: str) -> int:
        digest = hashlib.sha256(topic_id.encode("utf-8")).hexdigest()
        return int(digest[:8], 16) % 1000

    def _blend_recent_average(self, current_value: float, new_value: float, has_history: bool) -> float:
        if not has_history or current_value <= 0:
            return round(new_value, 2)
        return round((current_value * 0.7) + (new_value * 0.3), 2)

    async def _maybe_create_intervention(
        self,
        profile: LearnerProfileRecord,
        event: LearningEventRecord,
        confidence: float = 0.7,
    ):
        if profile.risk_summary.risk_level not in {"high", "critical"} and not (
            event.event_type == LearningEventType.ASSIGNMENT_GRADED
            and event.payload.get("score", 100) < 60
        ):
            return

        recommendation = InterventionRecommendation(
            user_id=profile.user_id,
            course_id=event.course_id,
            topic_id=event.topic_id,
            priority=(
                InterventionPriority.CRITICAL
                if profile.risk_summary.risk_level == "critical"
                else InterventionPriority.HIGH
            ),
            status=InterventionStatus.OPEN,
            recommended_action=(
                "Schedule teacher review and assign remediation practice"
                if event.event_type == LearningEventType.ASSIGNMENT_GRADED
                else "Review weak topics and provide guided support"
            ),
            reason=", ".join(profile.risk_summary.reasons) or "low performance detected",
            confidence=confidence,
            evidence={
                "event_type": event.event_type.value,
                "topic_id": event.topic_id,
                "payload": event.payload,
                "weak_topics": profile.weak_topics,
                "risk_score": profile.risk_summary.risk_score,
            },
        )
        await self.store.upsert_intervention(recommendation)

    def _refresh_cognitive_load(self, profile: LearnerProfileRecord, recent_events: List[LearningEventRecord]):
        event_payloads = []
        for event in recent_events[-5:]:
            payload = dict(event.payload)
            payload.setdefault("timestamp", event.created_at)
            event_payloads.append(payload)
        profile.behavior_signals["cognitive_load"] = round(
            self.cognitive_load.estimate_load(event_payloads), 2
        )

    async def get_profile(self, user_id: str, role: str = "student") -> LearnerProfileRecord:
        profile = await self.store.get_profile(user_id)
        if profile:
            return profile

        profile = self._default_profile(user_id, role=role)
        return await self.store.upsert_profile(profile)

    async def get_legacy_state(self, user_id: str, role: str = "student") -> Dict[str, Any]:
        profile = await self.get_profile(user_id, role=role)
        mastery_scores = {
            topic: mastery.score for topic, mastery in profile.mastery_state.items()
        }
        interaction_history = [
            {
                "concept_id": event.topic_id or "general",
                "correct": bool(event.payload.get("is_correct") or event.payload.get("score", 0) >= 70),
                "timestamp": event.created_at.isoformat() if isinstance(event.created_at, datetime) else event.created_at,
            }
            for event in await self.store.list_events(user_id, limit=20)
            if event.event_type in {
                LearningEventType.QUIZ_RESULT,
                LearningEventType.ASSESSMENT_ANSWER,
                LearningEventType.ASSIGNMENT_GRADED,
            }
        ]
        return {
            "user_id": profile.user_id,
            "mastery": mastery_scores,
            "mastery_scores": mastery_scores,
            "mastery_levels": mastery_scores,
            "behavior_label": profile.behavior_signals.get("behavior_label", "neutral"),
            "pathway_state": profile.metadata.get("pathway_state", "exploring"),
            "assignments": profile.assignment_summary.get("recent_assignments", []),
            "notes": profile.metadata.get("notes", []),
            "weak_topics": profile.weak_topics,
            "recent_average": profile.performance_summary.recent_average_score,
            "engagement_score": min(
                100,
                int(
                    profile.engagement_summary.total_minutes
                    + (profile.engagement_summary.current_streak * 5)
                    + (profile.engagement_summary.total_lessons_completed * 2)
                ),
            ),
            "skill_sequence": profile.metadata.get("skill_sequence", []),
            "correct_sequence": profile.metadata.get("correct_sequence", []),
            "interaction_history": interaction_history,
            "cognitive_load": profile.behavior_signals.get("cognitive_load", 50),
            "risk_summary": profile.risk_summary.model_dump(mode="json"),
        }

    async def record_event(
        self,
        user_id: str,
        event_type: LearningEventType,
        payload: Optional[Dict[str, Any]] = None,
        source: str = "system",
        course_id: Optional[str] = None,
        topic_id: Optional[str] = None,
        session_id: Optional[str] = None,
        role: str = "student",
    ) -> LearnerProfileRecord:
        payload = payload or {}
        topic_id = topic_id or payload.get("topic") or payload.get("topic_id")

        event = LearningEventRecord(
            user_id=user_id,
            event_type=event_type,
            source=source,
            course_id=course_id or payload.get("course_id"),
            topic_id=topic_id,
            session_id=session_id or payload.get("session_id"),
            payload=payload,
        )
        await self.store.append_event(event)

        profile = await self.get_profile(user_id, role=role)
        profile.updated_at = datetime.utcnow()
        profile.metadata["last_event_type"] = event_type.value
        profile.metadata["last_event_at"] = event.created_at.isoformat()

        engagement = profile.engagement_summary
        performance = profile.performance_summary

        if event_type == LearningEventType.LESSON_COMPLETED:
            engagement.total_lessons_completed += 1
            engagement.last_activity_at = datetime.utcnow()

        elif event_type == LearningEventType.ACTIVITY_LOGGED:
            engagement.total_minutes = round(engagement.total_minutes + float(payload.get("duration_minutes", 0)), 2)
            engagement.last_activity_at = datetime.utcnow()
            if "streak" in payload:
                engagement.current_streak = payload.get("streak", engagement.current_streak)

        elif event_type == LearningEventType.QUIZ_RESULT:
            engagement.total_quiz_attempts += 1
            score = float(payload.get("score", 0))
            performance.quiz_average = round(
                (performance.quiz_average * max(engagement.total_quiz_attempts - 1, 0) + score)
                / max(engagement.total_quiz_attempts, 1),
                2,
            )
            performance.recent_average_score = self._blend_recent_average(
                performance.recent_average_score,
                score,
                engagement.total_quiz_attempts > 1,
            )
            performance.low_score_count += 1 if score < 60 else 0
            performance.high_score_count += 1 if score >= 85 else 0
            if topic_id:
                self._update_mastery_from_score(profile, topic_id, score, event_type.value)
            profile.metadata.setdefault("skill_sequence", [])
            profile.metadata.setdefault("correct_sequence", [])
            if topic_id:
                profile.metadata["skill_sequence"].append(self._stable_topic_code(topic_id))
                profile.metadata["correct_sequence"].append(1 if score >= 70 else 0)

        elif event_type == LearningEventType.ASSESSMENT_ANSWER:
            if topic_id:
                self._update_mastery_from_binary(profile, topic_id, bool(payload.get("is_correct")), event_type.value)

        elif event_type == LearningEventType.ASSESSMENT_COMPLETED:
            engagement.total_assessments_completed += 1
            accuracy = float(payload.get("accuracy", 0)) * (100 if float(payload.get("accuracy", 0)) <= 1 else 1)
            performance.assessment_average = round(
                (performance.assessment_average * max(engagement.total_assessments_completed - 1, 0) + accuracy)
                / max(engagement.total_assessments_completed, 1),
                2,
            )
            performance.recent_average_score = self._blend_recent_average(
                performance.recent_average_score,
                accuracy,
                engagement.total_assessments_completed > 1 or performance.recent_average_score > 0,
            )
            if topic_id:
                self._update_mastery_from_score(profile, topic_id, accuracy, event_type.value)

        elif event_type == LearningEventType.ASSIGNMENT_SUBMITTED:
            engagement.total_assignment_submissions += 1
            profile.assignment_summary["last_submission_at"] = datetime.utcnow().isoformat()

        elif event_type == LearningEventType.ASSIGNMENT_GRADED:
            score = float(payload.get("score", 0))
            count = int(profile.assignment_summary.get("graded_count", 0)) + 1
            current_avg = float(profile.assignment_summary.get("average_score", 0))
            profile.assignment_summary["graded_count"] = count
            profile.assignment_summary["average_score"] = round(
                ((current_avg * (count - 1)) + score) / count,
                2,
            )
            profile.assignment_summary.setdefault("recent_assignments", [])
            profile.assignment_summary["recent_assignments"] = (
                profile.assignment_summary["recent_assignments"]
                + [
                    {
                        "assignment_id": payload.get("assignment_id"),
                        "score": score,
                        "feedback": payload.get("feedback"),
                        "graded_at": datetime.utcnow().isoformat(),
                    }
                ]
            )[-10:]
            performance.assignment_average = round(profile.assignment_summary["average_score"], 2)
            performance.recent_average_score = self._blend_recent_average(
                performance.recent_average_score,
                score,
                count > 1 or performance.recent_average_score > 0,
            )
            if topic_id:
                self._update_mastery_from_score(profile, topic_id, score, event_type.value)

        elif event_type == LearningEventType.TUTOR_INTERACTION:
            engagement.total_tutor_interactions += 1
            tutor_summary = profile.tutor_summary
            tutor_summary["last_session_id"] = event.session_id
            tutor_summary["last_topic"] = topic_id
            tutor_summary["last_recommendation"] = payload.get("recommendation")
            tutor_summary["last_behavior"] = payload.get("behavior")
            tutor_summary["total_sessions"] = int(tutor_summary.get("total_sessions", 0)) + 1

        elif event_type == LearningEventType.NOTE_ADDED:
            notes = profile.metadata.get("notes", [])
            notes.append(
                {
                    "content": payload.get("content", ""),
                    "created_at": datetime.utcnow().isoformat(),
                }
            )
            profile.metadata["notes"] = notes[-20:]

        elif event_type == LearningEventType.PROFILE_UPDATED:
            profile.metadata["profile_updates"] = int(profile.metadata.get("profile_updates", 0)) + 1

        recent_events = await self.store.list_events(user_id, limit=10)
        self._refresh_cognitive_load(profile, recent_events)
        if profile.behavior_signals["cognitive_load"] > 75:
            profile.behavior_signals["behavior_label"] = "overloaded"
        elif performance.recent_average_score >= 80:
            profile.behavior_signals["behavior_label"] = "focused"
        elif performance.recent_average_score < 50 and engagement.total_tutor_interactions > 0:
            profile.behavior_signals["behavior_label"] = "frustrated"
        else:
            profile.behavior_signals["behavior_label"] = profile.behavior_signals.get("behavior_label", "neutral")

        profile.risk_summary = self._risk_from_profile(profile)
        await self.store.upsert_profile(profile)
        await self._maybe_create_intervention(profile, event)
        return profile

    async def get_interventions(self, user_id: Optional[str] = None):
        return await self.store.list_interventions(user_id=user_id)


_service_instance: Optional[PersonalizationService] = None


def get_personalization_service() -> PersonalizationService:
    global _service_instance
    if _service_instance is None:
        _service_instance = PersonalizationService()
    return _service_instance
