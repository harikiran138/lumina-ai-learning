from typing import Dict, List
from app.database.supabase_manager import supabase_db
from app.core.logging import structlog
from app.store.local_store import LocalJsonStore

log = structlog.get_logger()


class AnalyticsStore:
    """
    Supabase store for Analytics and Aggregated Dashboard Data.
    """

    def __init__(self):
        self.client = supabase_db.get_client()
        self.local = LocalJsonStore()

    @property
    def sessions_collection(self):
        if self.client is None:
            return None
        return self.client.table("assessment_sessions")

    @property
    def user_data_collection(self):
        if self.client is None:
            return None
        return self.client.table("user_data")

    async def get_teacher_dashboard_stats(self, teacher_id: str) -> Dict:
        """
        Calculates stats for a specific teacher's dashboard.
        Aggregates data only for courses owned by this teacher.
        """
        if self.client is None:
            payload = self.local.read()
            courses = [c for c in payload["courses"] if c.get("teacher_id") == teacher_id]
            course_ids = [c.get("id") for c in courses]
            progress_data = [
                p for p in payload["progress"] if p.get("courseId") in course_ids
            ]
            if not course_ids:
                return {
                    "avg_mastery": 0,
                    "total_students": 0,
                    "active_courses": 0,
                    "pending_assignments": 0,
                }

            total_students = len({p.get("userId") for p in progress_data if p.get("userId")})
            avg_mastery = (
                sum(p.get("mastery", 0) for p in progress_data) / len(progress_data)
                if progress_data
                else 0
            )
            return {
                "avg_mastery": round(avg_mastery, 2),
                "total_students": total_students,
                "active_courses": len(course_ids),
                "pending_assignments": 0,
            }

        try:
            # 1. Get courses owned by this teacher
            courses_res = self.client.table("courses").select("id").eq("teacher_id", teacher_id).execute()
            course_ids = [c["id"] for c in courses_res.data]
            
            if not course_ids:
                return {
                    "avg_mastery": 0,
                    "total_students": 0,
                    "active_courses": 0,
                    "pending_assignments": 0
                }

            # 2. Get progress for those specific courses
            progress_res = self.client.table("progress").select("mastery, userId").in_("courseId", course_ids).execute()
            progress_data = progress_res.data
            
            if not progress_data:
                return {
                    "avg_mastery": 0,
                    "total_students": 0,
                    "active_courses": len(course_ids),
                    "pending_assignments": 0
                }

            total_students = len(set(p["userId"] for p in progress_data))
            avg_mastery = sum(p.get("mastery", 0) for p in progress_data) / len(progress_data)
            
            return {
                "avg_mastery": round(avg_mastery, 2),
                "total_students": total_students,
                "active_courses": len(course_ids),
                "pending_assignments": 0  # Placeholder for future logic
            }
        except Exception as e:
            log.error("teacher_stats_aggregation_failed", teacher_id=teacher_id, error=str(e))
            return {"avg_mastery": 0, "total_students": 0, "active_courses": 0}

    async def get_admin_dashboard_stats(self) -> Dict:
        """
        Calculates high-level system-wide stats for administration.
        """
        if self.client is None:
            payload = self.local.read()
            students = [u for u in payload["users"] if u.get("role") == "student"]
            teachers = [u for u in payload["users"] if u.get("role") == "teacher"]
            return {
                "totalUsers": len(payload["users"]),
                "totalCourses": len(payload["courses"]),
                "studentCount": len(students),
                "teacherCount": len(teachers),
                "systemStatus": "limited",
                "activeSessions": 0,
            }

        try:
            users_res = self.client.table("users").select("id, role", count="exact").execute()
            courses_res = self.client.table("courses").select("id", count="exact").execute()
            
            total_users = users_res.count if users_res.count is not None else len(users_res.data)
            total_courses = courses_res.count if courses_res.count is not None else len(courses_res.data)
            
            students = [u for u in users_res.data if u.get("role") == "student"]
            teachers = [u for u in users_res.data if u.get("role") == "teacher"]
            
            return {
                "totalUsers": total_users,
                "totalCourses": total_courses,
                "studentCount": len(students),
                "teacherCount": len(teachers),
                "systemStatus": "healthy",
                "activeSessions": 12, # Placeholder or live session count
            }
        except Exception as e:
            log.error("admin_stats_aggregation_failed", error=str(e))
            return {
                "totalUsers": 0,
                "totalCourses": 0,
                "systemStatus": "degraded"
            }

    async def get_student_dashboard_stats(self, student_id: str) -> Dict:
        """
        Calculates personalized stats for a student dashboard.
        """
        if self.client is None:
            payload = self.local.read()
            progress_data = [p for p in payload["progress"] if p.get("userId") == student_id]
            if not progress_data:
                return {"avg_score": 0, "total_sessions": 0, "topic_count": 0, "latest_activity": None}

            avg_score = (
                sum(item.get("mastery", 0) for item in progress_data) / len(progress_data)
                if progress_data
                else 0
            )
            latest_activity = max(
                (item.get("lastAccessed") for item in progress_data if item.get("lastAccessed")),
                default=None,
            )
            return {
                "avg_score": round(avg_score, 2),
                "total_sessions": len(progress_data),
                "topic_count": len({item.get("courseId") for item in progress_data if item.get("courseId")}),
                "latest_activity": latest_activity,
            }

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
        if self.client is None:
            payload = self.local.read()
            progress_data = [p for p in payload["progress"] if p.get("userId") == student_id]
            if not progress_data:
                return {
                    "currentStreak": 0,
                    "enrolledCourses": [],
                    "overallMastery": 0,
                    "totalHours": 0,
                    "badges": [],
                }

            courses_map = {str(item.get("id")).lower(): item for item in payload["courses"]}
            enrolled_courses = []
            for p in progress_data:
                cid = p.get("courseId") or p.get("courseid") or p.get("course_id")
                if not cid:
                    continue
                course = courses_map.get(str(cid).lower())
                if not course:
                    continue
                course_name = (
                    course.get("course_name")
                    or course.get("title")
                    or course.get("name")
                    or "Untitled Course"
                )
                enrolled_courses.append(
                    {
                        "id": str(cid).lower(),
                        "name": course_name,
                        "title": course_name,
                        "code": course.get("course_code") or course.get("code"),
                        "description": course.get("description"),
                        "thumbnail": course.get("thumbnail"),
                        "progress": p.get("progress", 0),
                        "mastery": p.get("mastery", 0),
                        "streak": p.get("streak", 0),
                        "lastAccessed": p.get("lastAccessed") or p.get("lastaccessed"),
                        "hoursSpent": p.get("hoursSpent", 0) or p.get("hours_spent", 0) or 0,
                    }
                )

            current_streak = max([c.get("streak", 0) for c in enrolled_courses] + [0])
            avg_mastery = (
                round(sum([c.get("mastery", 0) for c in enrolled_courses]) / len(enrolled_courses))
                if enrolled_courses
                else 0
            )
            total_hours = sum([c.get("hoursSpent", 0) for c in enrolled_courses])
            user = next((item for item in payload["users"] if item.get("id") == student_id), None)
            return {
                "currentStreak": current_streak,
                "enrolledCourses": enrolled_courses,
                "overallMastery": avg_mastery,
                "totalHours": total_hours,
                "badges": (user or {}).get("badges", []),
            }

        try:
            progress_response = self.client.table("progress").select("*").eq("userId", student_id).execute()
            progress_data = progress_response.data
            
            log.info("dashboard_progress_check", student_id=student_id, count=len(progress_data) if progress_data else 0)
            
            enrolled_courses = []
            if not progress_data:
                return {
                    "currentStreak": 0,
                    "enrolledCourses": [],
                    "overallMastery": 0,
                    "totalHours": 0,
                    "badges": []
                }

            # Fetch courses in one go
            # Use lowercase keys for fallback as well
            course_ids = []
            for p in progress_data:
                cid = p.get("courseId") or p.get("courseid") or p.get("course_id")
                if cid:
                    course_ids.append(str(cid))
            
            courses_map = {}
            if course_ids:
                courses_response = self.client.table("courses").select("*").in_("id", course_ids).execute()
                # Store in map with lowercase ID string
                for c in courses_response.data:
                    cid_str = str(c.get("id") or c.get("ID")).lower()
                    courses_map[cid_str] = c
            
            for p in progress_data:
                cid = p.get("courseId") or p.get("courseid") or p.get("course_id")
                if not cid:
                    continue
                    
                cid_str = str(cid).lower()
                if cid_str in courses_map:
                    course = courses_map[cid_str]
                    course_name = course.get("course_name") or course.get("title") or course.get("name") or "Untitled Course"
                    
                    enrolled_courses.append({
                        "id": cid_str,
                        "name": course_name,
                        "title": course_name,
                        "code": course.get("course_code") or course.get("code"),
                        "description": course.get("description"),
                        "thumbnail": course.get("thumbnail"),
                        "progress": p.get("progress", 0),
                        "mastery": p.get("mastery", 0),
                        "streak": p.get("streak", 0),
                        "lastAccessed": p.get("lastAccessed") or p.get("lastaccessed"),
                        "hoursSpent": p.get("hoursSpent", 0) or p.get("hours_spent", 0) or p.get("hoursspent", 0)
                    })
                else:
                    log.warning("course_not_found_in_map", course_id=cid_str, available_ids=list(courses_map.keys()))

            # Calculate Aggregates
            current_streak = max([c.get("streak", 0) for c in enrolled_courses] + [0])
            avg_mastery = (
                round(sum([c.get("mastery", 0) for c in enrolled_courses]) / len(enrolled_courses))
                if enrolled_courses
                else 0
            )
            total_hours = sum([c.get("hoursSpent", 0) for c in enrolled_courses])

            # Get User Badges
            # Note: users.badges column does not exist currently
            badges = []

            return {
                "currentStreak": current_streak,
                "enrolledCourses": enrolled_courses,
                "overallMastery": avg_mastery,
                "totalHours": total_hours,
                "badges": badges,
            }
        except Exception as e:
            log.error("student_full_dashboard_failed", student_id=student_id, error=str(e), traceback=True)
            return {}

    async def get_top_performing_topics(self, limit: int = 5) -> List[Dict]:
        """Aggregation for global trends"""
        if self.client is None:
            return []
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
