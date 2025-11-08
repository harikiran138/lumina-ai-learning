"""
WebSocket Service for real-time learning pathway updates and notifications.
Handles real-time updates for student progress, pathway adjustments, learning analytics,
and real-time collaboration features.
"""

from fastapi import WebSocket, WebSocketDisconnect
from typing import Dict, Set, Optional, List
import json
import asyncio
from loguru import logger
from datetime import datetime
from models import StudentProgress, LearningPathway, SkillLevel
from .pathway_generator import pathway_generator
from .base import AnalyticsSubscriber

class ConnectionManager(AnalyticsSubscriber):
    def __init__(self):
        # Store active connections by student_id
        self.student_connections: Dict[str, Set[WebSocket]] = {}
        # Store active connections by teacher_id
        self.teacher_connections: Dict[str, Set[WebSocket]] = {}
        # Store active analytics observers
        self.analytics_observers: Set[WebSocket] = set()
        # In-memory queued messages for offline users
        self._queued_messages: Dict[str, List[dict]] = {}
        # Initialize analytics service
        self.analytics = None  # Will be set by RealTimeAnalytics
        
    async def connect_student(self, websocket: WebSocket, student_id: str):
        """Connect a student websocket"""
        if websocket is None:
            raise ValueError("Invalid websocket")
        await websocket.accept()
        if student_id not in self.student_connections:
            self.student_connections[student_id] = set()
        self.student_connections[student_id].add(websocket)
        logger.info(f"Student {student_id} connected to WebSocket")
        # Deliver any queued messages
        queued = self._queued_messages.pop(student_id, [])
        for msg in queued:
            try:
                await websocket.send_json(msg)
            except Exception as e:
                logger.error(f"Error sending queued message to {student_id}: {str(e)}")

    async def connect_teacher(self, websocket: WebSocket, teacher_id: str):
        """Connect a teacher websocket"""
        if websocket is None:
            raise ValueError("Invalid websocket")
        await websocket.accept()
        if teacher_id not in self.teacher_connections:
            self.teacher_connections[teacher_id] = set()
        self.teacher_connections[teacher_id].add(websocket)
        logger.info(f"Teacher {teacher_id} connected to WebSocket")

    async def connect_analytics(self, websocket: WebSocket):
        """Connect an analytics observer"""
        if websocket is None:
            raise ValueError("Invalid websocket")
        await websocket.accept()
        self.analytics_observers.add(websocket)
        logger.info("Analytics observer connected to WebSocket")

    async def disconnect_student(self, websocket: WebSocket, student_id: str):
        """Disconnect a student websocket"""
        if student_id in self.student_connections and websocket in self.student_connections[student_id]:
            self.student_connections[student_id].remove(websocket)
            if not self.student_connections[student_id]:
                del self.student_connections[student_id]
        logger.info(f"Student {student_id} disconnected from WebSocket")

    async def disconnect_teacher(self, websocket: WebSocket, teacher_id: str):
        """Disconnect a teacher websocket"""
        if teacher_id in self.teacher_connections and websocket in self.teacher_connections[teacher_id]:
            self.teacher_connections[teacher_id].remove(websocket)
            if not self.teacher_connections[teacher_id]:
                del self.teacher_connections[teacher_id]
        logger.info(f"Teacher {teacher_id} disconnected from WebSocket")

    async def disconnect_analytics(self, websocket: WebSocket):
        """Disconnect an analytics observer"""
        if websocket in self.analytics_observers:
            self.analytics_observers.remove(websocket)
        logger.info("Analytics observer disconnected from WebSocket")

    async def broadcast_to_teachers(self, update_data: dict):
        """Broadcast update to all connected teachers."""
        message = {
            "type": "teacher_update",
            "timestamp": datetime.utcnow().isoformat(),
            "data": update_data
        }
        
        for connections in self.teacher_connections.values():
            for websocket in connections:
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting to teacher: {str(e)}")

    async def queue_message(self, user_id: str, message: dict):
        """Queue a message for a user, to be delivered when they connect."""
        queued_message = {
            "type": "queued_message",
            "timestamp": datetime.utcnow().isoformat(),
            "data": message
        }
        # If user is online deliver immediately to all connections
        if user_id in self.student_connections and self.student_connections[user_id]:
            for websocket in self.student_connections[user_id]:
                try:
                    await websocket.send_json(queued_message)
                except Exception as e:
                    logger.error(f"Error sending queued message: {str(e)}")
        else:
            # Store in in-memory queue for delivery on connect
            self._queued_messages.setdefault(user_id, []).append(queued_message)
            logger.info(f"Queued message for offline user {user_id}")

    async def send_pathway_update(self, student_id: str, update_data: dict):
        """Send pathway update to specific student"""
        if not student_id:
            raise ValueError("Student ID cannot be empty")

        if student_id in self.student_connections:
            for connection in self.student_connections[student_id]:
                try:
                    await connection.send_json({
                        "type": "pathway_update",
                        "timestamp": datetime.utcnow().isoformat(),
                        "data": update_data
                    })
                except Exception as e:
                    logger.error(f"Error sending pathway update: {str(e)}")

    async def send_progress_update(self, student_id: str, progress_data: dict):
        """Send progress update to student and their teachers"""
        # Send to student
        await self.send_pathway_update(student_id, {
            "type": "progress_update",
            "data": progress_data
        })
        
        # Send to teachers (assuming we have a way to get teacher_ids for a student)
        teacher_ids = await self._get_student_teachers(student_id)
        for teacher_id in teacher_ids:
            if teacher_id in self.teacher_connections:
                for connection in self.teacher_connections[teacher_id]:
                    try:
                        await connection.send_json({
                            "type": "student_progress",
                            "student_id": student_id,
                            "timestamp": datetime.utcnow().isoformat(),
                            "data": progress_data
                        })
                    except Exception as e:
                        logger.error(f"Error sending progress to teacher: {str(e)}")

    async def broadcast_analytics_update(self, analytics_data: dict):
        """Broadcast analytics update to all observers"""
        if analytics_data is None:
            raise ValueError("analytics_data cannot be None")

        message = {
            "type": "analytics_update",
            "timestamp": datetime.utcnow().isoformat(),
            "data": analytics_data
        }

        # Send to analytics observers
        for connection in list(self.analytics_observers):
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(f"Error broadcasting analytics to observer: {str(e)}")

        # Send to all connected students
        for conns in list(self.student_connections.values()):
            for websocket in list(conns):
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting analytics to student: {str(e)}")

        # Send to all connected teachers
        for conns in list(self.teacher_connections.values()):
            for websocket in list(conns):
                try:
                    await websocket.send_json(message)
                except Exception as e:
                    logger.error(f"Error broadcasting analytics to teacher: {str(e)}")

    async def _get_student_teachers(self, student_id: str) -> List[str]:
        """Get list of teacher IDs for a student"""
        # This should be implemented based on your data model
        from db import get_db
        from models import StudentTeacherRelation
        
        db = next(get_db())
        relations = db.query(StudentTeacherRelation).filter(
            StudentTeacherRelation.student_id == student_id
        ).all()
        
        return [relation.teacher_id for relation in relations]

class RealTimePathwayService:
    def __init__(self):
        self.connection_manager = ConnectionManager()

    async def queue_message(self, user_id: str, message: dict):
        """Queue a message for delivery to a user."""
        await self.connection_manager.queue_message(user_id, message)

    async def send_pathway_update(self, student_id: str, update_data: dict):
        """Send pathway update to a student."""
        if not student_id:
            raise ValueError("Student ID cannot be empty")
            
        await self.connection_manager.send_pathway_update(student_id, update_data)

    async def broadcast_analytics_update(self, update_data: dict):
        """Broadcast analytics update to all analytics observers."""
        if not update_data:
            raise ValueError("Update data cannot be empty")
            
        await self.connection_manager.broadcast_analytics_update(update_data)
        
    async def handle_student_connection(self, websocket: WebSocket, student_id: str):
        """Handle student WebSocket connection"""
        try:
            await self.connection_manager.connect_student(websocket, student_id)
            
            # Send initial pathway state
            initial_pathway = await self._get_current_pathway(student_id)
            if initial_pathway:
                await self.connection_manager.send_pathway_update(
                    student_id, 
                    {"pathway": initial_pathway}
                )
            
            # Listen for updates
            while True:
                try:
                    data = await websocket.receive_json()
                    await self._handle_student_message(student_id, data)
                except WebSocketDisconnect:
                    await self.connection_manager.disconnect_student(websocket, student_id)
                    break
                except Exception as e:
                    logger.error(f"Error handling student message: {str(e)}")
                    
        except Exception as e:
            logger.error(f"Error in student connection handler: {str(e)}")
            try:
                await self.connection_manager.disconnect_student(websocket, student_id)
            except:
                pass

    async def _get_current_pathway(self, student_id: str) -> Optional[dict]:
        """Get current learning pathway for student"""
        try:
            from db import get_db
            db = next(get_db())
            
            pathway = db.query(LearningPathway).filter(
                LearningPathway.student_id == student_id,
                LearningPathway.is_active == True
            ).first()
            
            if pathway:
                return {
                    "id": pathway.id,
                    "skills": pathway.skills,
                    "progress": pathway.progress,
                    "next_step": await pathway_generator.get_next_recommended_step(
                        student_id,
                        pathway.skills
                    )
                }
            return None
            
        except Exception as e:
            logger.error(f"Error getting current pathway: {str(e)}")
            return None

    async def _handle_student_message(self, student_id: str, message: dict):
        """Handle incoming messages from student connection"""
        try:
            message_type = message.get("type")
            
            if message_type == "progress_update":
                # Handle progress update
                await self._update_student_progress(
                    student_id, 
                    message.get("data", {})
                )
            
            elif message_type == "request_recommendation":
                # Handle recommendation request
                pathway = await self._get_current_pathway(student_id)
                if pathway:
                    next_step = await pathway_generator.get_next_recommended_step(
                        student_id,
                        pathway["skills"]
                    )
                    await self.connection_manager.send_pathway_update(
                        student_id,
                        {"next_step": next_step}
                    )
            
            elif message_type == "analytics_request":
                # Handle analytics request
                analytics = await self._generate_student_analytics(student_id)
                await self.connection_manager.send_pathway_update(
                    student_id,
                    {"analytics": analytics}
                )
        
        except Exception as e:
            logger.error(f"Error handling message: {str(e)}")

    async def _update_student_progress(self, student_id: str, progress_data: dict):
        """Update student progress and notify relevant parties"""
        try:
            from db import get_db
            db = next(get_db())
            
            # Update progress in database
            progress = StudentProgress(
                student_id=student_id,
                skill_id=progress_data.get("skill_id"),
                score=progress_data.get("score", 0),
                completed_at=datetime.utcnow()
            )
            db.add(progress)
            
            # Update skill level if provided
            if "skill_level" in progress_data:
                skill_level = db.query(SkillLevel).filter(
                    SkillLevel.student_id == student_id,
                    SkillLevel.skill_id == progress_data["skill_id"]
                ).first()
                
                if skill_level:
                    skill_level.level = progress_data["skill_level"]
                else:
                    skill_level = SkillLevel(
                        student_id=student_id,
                        skill_id=progress_data["skill_id"],
                        level=progress_data["skill_level"]
                    )
                    db.add(skill_level)
            
            db.commit()
            
            # Send progress update to student and teachers
            await self.connection_manager.send_progress_update(
                student_id,
                progress_data
            )
            
            # Generate and broadcast analytics update
            analytics = await self._generate_student_analytics(student_id)
            await self.connection_manager.broadcast_analytics_update(analytics)
            
        except Exception as e:
            logger.error(f"Error updating progress: {str(e)}")
            db.rollback()

    async def _generate_student_analytics(self, student_id: str) -> dict:
        """Generate real-time analytics for student progress"""
        try:
            from db import get_db
            db = next(get_db())
            
            # Get recent progress entries
            progress_entries = db.query(StudentProgress).filter(
                StudentProgress.student_id == student_id
            ).order_by(StudentProgress.completed_at.desc()).limit(50).all()
            
            # Calculate analytics
            total_skills = len(set(entry.skill_id for entry in progress_entries))
            avg_score = sum(entry.score for entry in progress_entries) / len(progress_entries) if progress_entries else 0
            completion_rate = len([e for e in progress_entries if e.score >= 70]) / total_skills if total_skills > 0 else 0
            
            return {
                "student_id": student_id,
                "total_skills_attempted": total_skills,
                "average_score": avg_score,
                "completion_rate": completion_rate,
                "recent_activities": len(progress_entries),
                "generated_at": datetime.utcnow().isoformat()
            }
            
        except Exception as e:
            logger.error(f"Error generating analytics: {str(e)}")
            return {}

# Global instance
realtime_pathway_service = RealTimePathwayService()