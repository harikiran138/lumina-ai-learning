"""
AI Queue Analytics Service

Provides metrics and insights on AI tutor queue performance:
- Decision distribution (AUTO_APPROVED vs PROVISIONAL vs PENDING)
- Response time analytics
- Teacher review SLAs
- Safety score trends
- Confidence distribution
- Student throughput
"""

from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Any
from app.database.scoped_db import ScopedSupabase
from app.core.logging import structlog

log = structlog.get_logger()


class AIQueueAnalytics:
    """Analytics for AI tutor answer queue performance."""

    def __init__(self, db: ScopedSupabase):
        self.db = db

    async def get_queue_metrics(
        self,
        days: int = 7,
        granularity: str = "daily"
    ) -> Dict[str, Any]:
        """
        Get high-level queue metrics for the last N days.
        
        Args:
            days: Number of days to analyze (default 7)
            granularity: "hourly", "daily", or "weekly"
        
        Returns:
            {
                "period_days": 7,
                "total_questions": 1250,
                "auto_approved": 875,
                "provisional": 250,
                "pending": 125,
                "auto_approved_rate": 0.70,
                "avg_response_time_seconds": 12.5,
                "avg_confidence": 0.82,
                "avg_safety_score": 0.96,
                "teacher_review_avg_latency_hours": 2.3,
                "by_period": [...]
            }
        """
        try:
            # Date range
            end_date = datetime.now(timezone.utc)
            start_date = end_date - timedelta(days=days)
            
            # Get raw metrics from queue_metrics table
            response = await self.db.client.from_("queue_metrics").select(
                "*"
            ).gte("date", start_date.date().isoformat()).lte(
                "date", end_date.date().isoformat()
            ).execute()
            
            metrics_rows = response.data or []
            
            if not metrics_rows:
                return self._empty_metrics(days)
            
            # Summarize
            totals = self._summarize_metrics(metrics_rows)
            
            # Calculate rates
            total_decisions = (
                totals["auto_approved_count"] + 
                totals["provisional_count"] + 
                totals["pending_count"]
            ) or 1
            
            # Get decision/confidence details from queue table
            decision_response = await self.db.client.from_("ai_answer_decisions").select(
                "status, confidence"
            ).gte(
                "created_at", start_date.isoformat()
            ).execute()
            
            decisions = decision_response.data or []
            avg_confidence = (
                sum(d.get("confidence", 0) for d in decisions) / len(decisions)
                if decisions else 0.0
            )
            
            # Get safety scores
            safety_response = await self.db.client.from_("ai_answer_queue").select(
                "safety_score"
            ).gte(
                "created_at", start_date.isoformat()
            ).execute()
            
            queues = safety_response.data or []
            avg_safety = (
                sum(q.get("safety_score", 0) for q in queues) / len(queues)
                if queues else 0.0
            )
            
            # Response time (from created_at to decision)
            response_times = []
            for decision in decisions:
                if decision.get("created_at") and decision.get("reviewed_at"):
                    created = datetime.fromisoformat(decision["created_at"])
                    reviewed = datetime.fromisoformat(decision["reviewed_at"])
                    response_times.append((reviewed - created).total_seconds())
            
            avg_response_time = (
                sum(response_times) / len(response_times) 
                if response_times else 0.0
            )
            
            return {
                "period_days": days,
                "total_questions": len(queues),
                "total_decisions": total_decisions,
                "auto_approved": totals["auto_approved_count"],
                "provisional": totals["provisional_count"],
                "pending": totals["pending_count"],
                "rejected": totals.get("rejected_count", 0),
                "approved": totals.get("approved_count", 0),
                "auto_approved_rate": totals["auto_approved_count"] / total_decisions if total_decisions > 0 else 0,
                "provisional_rate": totals["provisional_count"] / total_decisions if total_decisions > 0 else 0,
                "avg_response_time_seconds": round(avg_response_time, 2),
                "avg_confidence": round(avg_confidence, 4),
                "avg_safety_score": round(avg_safety, 4),
                "by_period": self._group_by_period(metrics_rows, granularity)
            }
        
        except Exception as exc:
            log.error("queue_metrics_calculation_failed", error=str(exc))
            return self._empty_metrics(days)

    async def get_decision_distribution(self) -> Dict[str, Any]:
        """
        Distribution of answer decisions.
        
        Returns:
            {
                "AUTO_APPROVED": 875,
                "PROVISIONAL": 250,
                "PENDING": 125,
                "APPROVED": 200,
                "REJECTED": 50
            }
        """
        try:
            response = await self.db.client.from_("ai_answer_decisions").select(
                "status, count('*')", count="exact"
            ).group_by("status").execute()
            
            result = {}
            for row in response.data or []:
                result[row.get("status", "UNKNOWN")] = row.get("count", 0)
            
            return result
        
        except Exception as exc:
            log.error("decision_distribution_failed", error=str(exc))
            return {}

    async def get_confidence_distribution(
        self,
        bins: int = 10
    ) -> Dict[str, Any]:
        """
        Histogram of confidence scores across all decisions.
        
        Args:
            bins: Number of histogram bins
        
        Returns:
            {
                "bins": [
                    {"range": "0.0-0.1", "count": 5},
                    {"range": "0.1-0.2", "count": 3},
                    ...
                ],
                "mean": 0.82,
                "median": 0.85,
                "std_dev": 0.12
            }
        """
        try:
            response = await self.db.client.from_("ai_answer_decisions").select(
                "confidence"
            ).execute()
            
            confidences = [d.get("confidence", 0) for d in (response.data or [])]
            
            if not confidences:
                return {"bins": [], "mean": 0, "median": 0, "std_dev": 0}
            
            # Calculate statistics
            import statistics
            mean = statistics.mean(confidences)
            median = statistics.median(confidences)
            std_dev = statistics.stdev(confidences) if len(confidences) > 1 else 0
            
            # Create bins
            bin_size = 1.0 / bins
            bins_data = []
            for i in range(bins):
                lower = i * bin_size
                upper = (i + 1) * bin_size
                count = sum(1 for c in confidences if lower <= c < upper)
                bins_data.append({
                    "range": f"{lower:.1f}-{upper:.1f}",
                    "count": count
                })
            
            return {
                "bins": bins_data,
                "mean": round(mean, 4),
                "median": round(median, 4),
                "std_dev": round(std_dev, 4)
            }
        
        except Exception as exc:
            log.error("confidence_distribution_failed", error=str(exc))
            return {}

    async def get_safety_score_distribution(
        self,
        bins: int = 10
    ) -> Dict[str, Any]:
        """Similar to confidence distribution but for safety scores."""
        try:
            response = await self.db.client.from_("ai_answer_queue").select(
                "safety_score"
            ).execute()
            
            safety_scores = [q.get("safety_score", 0) for q in (response.data or [])]
            
            if not safety_scores:
                return {"bins": [], "mean": 0, "median": 0, "std_dev": 0}
            
            import statistics
            mean = statistics.mean(safety_scores)
            median = statistics.median(safety_scores)
            std_dev = statistics.stdev(safety_scores) if len(safety_scores) > 1 else 0
            
            bin_size = 1.0 / bins
            bins_data = []
            for i in range(bins):
                lower = i * bin_size
                upper = (i + 1) * bin_size
                count = sum(1 for s in safety_scores if lower <= s < upper)
                bins_data.append({
                    "range": f"{lower:.1f}-{upper:.1f}",
                    "count": count
                })
            
            return {
                "bins": bins_data,
                "mean": round(mean, 4),
                "median": round(median, 4),
                "std_dev": round(std_dev, 4)
            }
        
        except Exception as exc:
            log.error("safety_distribution_failed", error=str(exc))
            return {}

    async def get_teacher_review_slas(self) -> Dict[str, Any]:
        """
        Teacher review SLA metrics.
        - Time from PROVISIONAL to APPROVED/REJECTED
        - Percentage meeting SLA (<1 hour)
        
        Returns:
            {
                "avg_review_latency_hours": 2.3,
                "median_review_latency_hours": 1.8,
                "sla_met_percent": 65.5,
                "pending_count": 42,
                "pending_oldest_hours": 4.2
            }
        """
        try:
            # Get PROVISIONAL answers that were reviewed
            response = await self.db.client.from_("ai_answer_decisions").select(
                "created_at, reviewed_at"
            ).eq("status", "PROVISIONAL").not_.is_("reviewed_at", "null").execute()
            
            decisions = response.data or []
            
            if not decisions:
                return {
                    "avg_review_latency_hours": 0,
                    "median_review_latency_hours": 0,
                    "sla_met_percent": 0,
                    "pending_count": 0,
                    "pending_oldest_hours": 0
                }
            
            latencies = []
            sla_met = 0
            sla_threshold = 3600  # 1 hour in seconds
            
            for decision in decisions:
                if decision.get("created_at") and decision.get("reviewed_at"):
                    created = datetime.fromisoformat(decision["created_at"])
                    reviewed = datetime.fromisoformat(decision["reviewed_at"])
                    latency = (reviewed - created).total_seconds() / 3600  # Convert to hours
                    latencies.append(latency)
                    if latency <= 1.0:  # Within 1 hour
                        sla_met += 1
            
            import statistics
            avg_latency = statistics.mean(latencies) if latencies else 0
            median_latency = statistics.median(latencies) if latencies else 0
            sla_met_pct = (sla_met / len(decisions) * 100) if decisions else 0
            
            # Get pending PROVISIONAL answers
            pending_response = await self.db.client.from_("ai_answer_decisions").select(
                "created_at"
            ).eq("status", "PROVISIONAL").is_("reviewed_at", "null").execute()
            
            pending = pending_response.data or []
            pending_count = len(pending)
            
            # Oldest pending
            oldest_hours = 0
            if pending:
                oldest_created = min([datetime.fromisoformat(p["created_at"]) for p in pending])
                oldest_hours = (datetime.now(timezone.utc) - oldest_created).total_seconds() / 3600
            
            return {
                "avg_review_latency_hours": round(avg_latency, 2),
                "median_review_latency_hours": round(median_latency, 2),
                "sla_met_percent": round(sla_met_pct, 1),
                "pending_count": pending_count,
                "pending_oldest_hours": round(oldest_hours, 2)
            }
        
        except Exception as exc:
            log.error("teacher_sla_calculation_failed", error=str(exc))
            return {}

    async def get_student_throughput(self) -> Dict[str, Any]:
        """
        Student engagement metrics.
        
        Returns:
            {
                "unique_students": 234,
                "total_questions_asked": 1250,
                "avg_questions_per_student": 5.3,
                "top_students": [
                    {"student_id": "s1", "questions": 45},
                    ...
                ]
            }
        """
        try:
            # Get unique students and their question counts
            response = await self.db.client.from_("ai_answer_queue").select(
                "student_id, count('*')", count="exact"
            ).group_by("student_id").order("count", desc=True).limit(10).execute()
            
            top_students = []
            for row in response.data or []:
                top_students.append({
                    "student_id": row.get("student_id"),
                    "questions": row.get("count", 0)
                })
            
            # Total questions
            total_response = await self.db.client.from_("ai_answer_queue").select(
                "count", count="exact"
            ).execute()
            
            total_questions = total_response.count or 0
            unique_students = len(top_students)
            avg_per_student = total_questions / unique_students if unique_students > 0 else 0
            
            return {
                "unique_students": unique_students,
                "total_questions_asked": total_questions,
                "avg_questions_per_student": round(avg_per_student, 1),
                "top_students": top_students
            }
        
        except Exception as exc:
            log.error("throughput_calculation_failed", error=str(exc))
            return {}

    # --- Helpers ---

    def _empty_metrics(self, days: int) -> Dict[str, Any]:
        """Return empty metrics structure."""
        return {
            "period_days": days,
            "total_questions": 0,
            "total_decisions": 0,
            "auto_approved": 0,
            "provisional": 0,
            "pending": 0,
            "auto_approved_rate": 0,
            "provisional_rate": 0,
            "avg_response_time_seconds": 0,
            "avg_confidence": 0,
            "avg_safety_score": 0,
            "by_period": []
        }

    def _summarize_metrics(self, rows: List[Dict]) -> Dict[str, int]:
        """Summarize metrics rows."""
        totals = {
            "auto_approved_count": 0,
            "provisional_count": 0,
            "pending_count": 0,
            "rejected_count": 0,
            "approved_count": 0
        }
        
        for row in rows:
            totals["auto_approved_count"] += row.get("auto_approved_count", 0)
            totals["provisional_count"] += row.get("provisional_count", 0)
            totals["pending_count"] += row.get("pending_count", 0)
            totals["rejected_count"] += row.get("rejected_count", 0)
            totals["approved_count"] += row.get("approved_count", 0)
        
        return totals

    def _group_by_period(self, rows: List[Dict], granularity: str) -> List[Dict]:
        """Group metrics by time period."""
        # For now, return as-is (daily grouping)
        # In a real implementation, would aggregate by granularity
        return rows[:7]  # Last 7 days
