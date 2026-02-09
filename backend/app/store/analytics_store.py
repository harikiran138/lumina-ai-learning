from typing import Dict, List
from app.database.manager import db
from app.core.logging import structlog

log = structlog.get_logger()


class AnalyticsStore:
    """
    MongoDB store for Analytics and Aggregated Dashboard Data.
    All methods are ASYNC.
    """

    def __init__(self):
        pass

    @property
    def sessions_collection(self):
        return db.get_collection("assessment_sessions")

    @property
    def user_data_collection(self):
        return db.get_collection("user_data")

    async def get_teacher_dashboard_stats(self) -> Dict:
        """
        Uses MongoDB aggregation to calculate global stats for the teacher dashboard.
        Calculates average mastery across all students and sessions.
        """
        collection = self.sessions_collection
        if collection is None:
            return {"avg_mastery": 0, "total_students": 0, "error": "DB disconnected"}

        pipeline = [
            {
                "$group": {
                    "_id": None,
                    "avg_mastery": {"$avg": "$current_difficulty"},
                    "unique_students": {"$addToSet": "$student_id"},
                    "total_sessions": {"$count": {}},
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "avg_mastery": {"$multiply": ["$avg_mastery", 100]},
                    "total_students": {"$size": "$unique_students"},
                    "total_sessions": 1,
                }
            },
        ]

        try:
            cursor = collection.aggregate(pipeline)
            result = await cursor.to_list(length=1)
            if result:
                return result[0]
            return {"avg_mastery": 0, "total_students": 0, "total_sessions": 0}
        except Exception as e:
            log.error("teacher_stats_aggregation_failed", error=str(e))
            return {"avg_mastery": 0, "total_students": 0, "total_sessions": 0}

    async def get_student_dashboard_stats(self, student_id: str) -> Dict:
        """
        Calculates personalized stats for a student dashboard.
        """
        collection = self.sessions_collection
        if collection is None:
            return {}

        pipeline = [
            {"$match": {"student_id": student_id}},
            {
                "$group": {
                    "_id": "$student_id",
                    "avg_score": {"$avg": "$current_difficulty"},
                    "total_sessions": {"$count": {}},
                    "topics_covered": {"$addToSet": "$topic"},
                    "latest_activity": {"$max": "$timestamp"},
                }
            },
            {
                "$project": {
                    "_id": 0,
                    "avg_score": {"$multiply": ["$avg_score", 100]},
                    "total_sessions": 1,
                    "topic_count": {"$size": "$topics_covered"},
                    "latest_activity": 1,
                }
            },
        ]

        try:
            cursor = collection.aggregate(pipeline)
            result = await cursor.to_list(length=1)
            if result:
                return result[0]
            return {"avg_score": 0, "total_sessions": 0, "topic_count": 0}
        except Exception as e:
            log.error("student_stats_aggregation_failed", student_id=student_id, error=str(e))
            return {"avg_score": 0, "total_sessions": 0, "topic_count": 0}

    async def get_student_full_dashboard(self, student_id: str) -> Dict:
        """
        Mirroring getStudentDashboard from data.ts
        Aggregates enrolled courses, progress, streaks, and achievements.
        """
        progress_col = db.get_collection("progress")
        if progress_col is None:
            return {}

        # 1. Aggregate Enrolled Courses with Details
        pipeline = [
            {"$match": {"userId": student_id}},
            {
                "$lookup": {
                    "from": "courses",
                    "let": {"courseIdObj": {"$toObjectId": "$courseId"}},
                    "pipeline": [{"$match": {"$expr": {"$eq": ["$_id", "$$courseIdObj"]}}}],
                    "as": "courseDetails",
                }
            },
            {"$unwind": "$courseDetails"},
            {
                "$project": {
                    "id": {"$toString": "$courseDetails._id"},
                    "name": "$courseDetails.name",
                    "description": "$courseDetails.description",
                    "thumbnail": "$courseDetails.thumbnail",
                    "progress": {"$ifNull": ["$progress", 0]},
                    "mastery": {"$ifNull": ["$mastery", 0]},
                    "streak": {"$ifNull": ["$streak", 0]},
                    "lastAccessed": "$lastAccessed",
                    "hoursSpent": {"$ifNull": ["$hoursSpent", 0]},
                }
            },
        ]

        try:
            cursor = progress_col.aggregate(pipeline)
            enrolled_courses = await cursor.to_list(length=100)

            # 2. Calculate Aggregates
            current_streak = max([c.get("streak", 0) for c in enrolled_courses] + [0])
            avg_mastery = (
                round(sum([c.get("mastery", 0) for c in enrolled_courses]) / len(enrolled_courses))
                if enrolled_courses
                else 0
            )
            total_hours = sum([c.get("hoursSpent", 0) for c in enrolled_courses])

            # 3. Get User Badges
            users_col = db.get_collection("users")
            user = await users_col.find_one({"_id": student_id})
            badges = user.get("badges", []) if user else []

            return {
                "currentStreak": current_streak,
                "enrolledCourses": enrolled_courses,
                "overallMastery": avg_mastery,
                "totalHours": total_hours,
                "badges": badges,
            }
        except Exception as e:
            log.error("student_full_dashboard_failed", student_id=student_id, error=str(e))
            return {}

    async def get_top_performing_topics(self, limit: int = 5) -> List[Dict]:
        """Aggregation for global trends"""
        collection = self.sessions_collection
        if collection is None:
            return []

        pipeline = [
            {"$group": {"_id": "$topic", "avg_difficulty": {"$avg": "$current_difficulty"}}},
            {"$sort": {"avg_difficulty": -1}},
            {"$limit": limit},
        ]
        cursor = collection.aggregate(pipeline)
        return await cursor.to_list(length=limit)
