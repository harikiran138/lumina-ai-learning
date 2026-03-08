from typing import Dict, List
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog

log = structlog.get_logger()


class AnalyticsStore:
    """
    Supabase store for Analytics and Aggregated Dashboard Data.
    """

    def __init__(self):
        self.client = supabase_db.get_client()

    @property
    def sessions_collection(self):
        return self.client.table("assessment_sessions")

    @property
    def user_data_collection(self):
        return self.client.table("user_data")

    async def get_teacher_dashboard_stats(self) -> Dict:
        """
        Calculates global stats for the teacher dashboard from Supabase.
        Calculates average mastery across all students and sessions.
        """
        try:
            # Note: Fetching all might be heavy for large DBs, 
            # ideally we'd use a Supabase RPC here. Doing in-memory for now.
            response = self.sessions_collection.select("student_id, current_difficulty").execute()
            data = response.data
            
            if not data:
                return {"avg_mastery": 0, "total_students": 0, "total_sessions": 0}
                
            total_sessions = len(data)
            unique_students = len(set(d.get("student_id") for d in data if d.get("student_id")))
            
            difficulties = [d.get("current_difficulty", 0) for d in data if d.get("current_difficulty") is not None]
            avg_mastery = (sum(difficulties) / len(difficulties)) * 100 if difficulties else 0
            
            return {
                "avg_mastery": round(avg_mastery, 2),
                "total_students": unique_students,
                "total_sessions": total_sessions
            }
        except Exception as e:
            log.error("teacher_stats_aggregation_failed", error=str(e))
            return {"avg_mastery": 0, "total_students": 0, "total_sessions": 0}

    async def get_student_dashboard_stats(self, student_id: str) -> Dict:
        """
        Calculates personalized stats for a student dashboard.
        """
        try:
            response = self.sessions_collection.select("current_difficulty, topic, timestamp").eq("student_id", student_id).execute()
            data = response.data
            
            if not data:
                return {"avg_score": 0, "total_sessions": 0, "topic_count": 0, "latest_activity": None}
                
            total_sessions = len(data)
            topics = set(d.get("topic") for d in data if d.get("topic"))
            
            scores = [d.get("current_difficulty", 0) for d in data if d.get("current_difficulty") is not None]
            avg_score = (sum(scores) / len(scores)) * 100 if scores else 0
            
            timestamps = [d.get("timestamp") for d in data if d.get("timestamp")]
            latest_activity = max(timestamps) if timestamps else None
            
            return {
                "avg_score": round(avg_score, 2),
                "total_sessions": total_sessions,
                "topic_count": len(topics),
                "latest_activity": latest_activity
            }
        except Exception as e:
            log.error("student_stats_aggregation_failed", student_id=student_id, error=str(e))
            return {"avg_score": 0, "total_sessions": 0, "topic_count": 0}

    async def get_student_full_dashboard(self, student_id: str) -> Dict:
        """
        Mirroring getStudentDashboard from data.ts
        Aggregates enrolled courses, progress, streaks, and achievements.
        """
        try:
            progress_response = self.client.table("progress").select("*").eq("userId", student_id).execute()
            progress_data = progress_response.data
            
            enrolled_courses = []
            if progress_data:
                # Fetch courses in one go
                course_ids = [str(p.get("courseId")) for p in progress_data if p.get("courseId")]
                
                if course_ids:
                    courses_response = self.client.table("courses").select("*").in_("id", course_ids).execute()
                    courses_map = {str(c.get("id")): c for c in courses_response.data}
                    
                    for p in progress_data:
                        cid = str(p.get("courseId"))
                        if cid in courses_map:
                            course = courses_map[cid]
                            enrolled_courses.append({
                                "id": cid,
                                "name": course.get("name"),
                                "description": course.get("description"),
                                "thumbnail": course.get("thumbnail"),
                                "progress": p.get("progress", 0),
                                "mastery": p.get("mastery", 0),
                                "streak": p.get("streak", 0),
                                "lastAccessed": p.get("lastAccessed"),
                                "hoursSpent": p.get("hoursSpent", 0)
                            })

            # Calculate Aggregates
            current_streak = max([c.get("streak", 0) for c in enrolled_courses] + [0])
            avg_mastery = (
                round(sum([c.get("mastery", 0) for c in enrolled_courses]) / len(enrolled_courses))
                if enrolled_courses
                else 0
            )
            total_hours = sum([c.get("hoursSpent", 0) for c in enrolled_courses])

            # Get User Badges
            users_response = self.client.table("users").select("badges").eq("id", student_id).execute()
            badges = []
            if users_response.data and "badges" in users_response.data[0]:
                badges = users_response.data[0]["badges"]

            return {
                "currentStreak": current_streak,
                "enrolledCourses": enrolled_courses,
                "overallMastery": avg_mastery,
                "totalHours": total_hours,
                "badges": badges or [],
            }
        except Exception as e:
            log.error("student_full_dashboard_failed", student_id=student_id, error=str(e))
            return {}

    async def get_top_performing_topics(self, limit: int = 5) -> List[Dict]:
        """Aggregation for global trends"""
        try:
            response = self.sessions_collection.select("topic, current_difficulty").execute()
            data = response.data
            
            if not data:
                return []
                
            topic_stats = {}
            for d in data:
                topic = d.get("topic")
                diff = d.get("current_difficulty")
                if topic and diff is not None:
                    if topic not in topic_stats:
                        topic_stats[topic] = {"sum": 0, "count": 0}
                    topic_stats[topic]["sum"] += diff
                    topic_stats[topic]["count"] += 1
                    
            results = [
                {"_id": topic, "avg_difficulty": stats["sum"] / stats["count"]}
                for topic, stats in topic_stats.items()
            ]
            
            results.sort(key=lambda x: x["avg_difficulty"], reverse=True)
            return results[:limit]
        except Exception as e:
            log.error("top_topics_aggregation_failed", error=str(e))
            return []
