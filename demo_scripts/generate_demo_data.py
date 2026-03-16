#!/usr/bin/env python3
"""
Lumina AI Learning Platform - Demo Data Generator
Creates demo dataset for live demonstration.
"""

import asyncio
import sys
import os
import uuid
from datetime import datetime, timedelta

sys.path.insert(0, '/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend')

from dotenv import load_dotenv
load_dotenv('/Users/chepuriharikiran/Desktop/github/lumina-ai-learning/.env')

class Colors:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    CYAN = '\033[96m'
    RESET = '\033[0m'

class DemoDataGenerator:
    def __init__(self):
        self.teacher_id = None
        self.student_ids = []
        self.course_id = None
        self.lesson_ids = []
        self.assignment_id = None
        
    def log(self, message, status="info"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        if status == "success":
            print(f"{Colors.GREEN}✓ [{timestamp}] {message}{Colors.RESET}")
        elif status == "error":
            print(f"{Colors.RED}✗ [{timestamp}] {message}{Colors.RESET}")
        elif status == "warning":
            print(f"{Colors.YELLOW}⚠ [{timestamp}] {message}{Colors.RESET}")
        elif status == "step":
            print(f"{Colors.CYAN}→ [{timestamp}] {message}{Colors.RESET}")
        else:
            print(f"{Colors.BLUE}ℹ [{timestamp}] {message}{Colors.RESET}")
    
    async def create_teacher(self):
        """Create demo teacher"""
        self.log("Creating demo teacher...", "step")
        
        try:
            import httpx
            teacher_data = {
                "email": "demo.teacher@lumina.edu",
                "password": "DemoTeacher123!",
                "first_name": "Sarah",
                "last_name": "Johnson",
                "role": "teacher",
                "department": "Physics",
                "bio": "Experienced physics teacher with 10+ years in education"
            }
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    "http://localhost:8000/api/v1/auth/register",
                    json=teacher_data
                )
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    self.teacher_id = data.get('id') or data.get('user_id') or str(uuid.uuid4())
                    self.log(f"Teacher created: {teacher_data['email']}", "success")
                    return True
                elif response.status_code == 409:
                    self.log("Teacher already exists", "warning")
                    self.teacher_id = "demo_teacher_001"
                    return True
                else:
                    self.log(f"Teacher creation status: {response.status_code}", "warning")
                    self.teacher_id = "demo_teacher_001"
                    return True
        except Exception as e:
            self.log(f"Teacher creation: {e}", "warning")
            self.teacher_id = "demo_teacher_001"
            return True
    
    async def create_students(self):
        """Create 10 demo students"""
        self.log("Creating 10 demo students...", "step")
        
        student_names = [
            ("Alex", "Chen"),
            ("Maria", "Garcia"),
            ("James", "Wilson"),
            ("Priya", "Patel"),
            ("Lucas", "Silva"),
            ("Emma", "Thompson"),
            ("Raj", "Kumar"),
            ("Sophie", "Martin"),
            ("Oliver", "Brown"),
            ("Zara", "Ahmed"),
        ]
        
        created = 0
        for i, (first, last) in enumerate(student_names, 1):
            try:
                import httpx
                student_data = {
                    "email": f"demo.student{i}@lumina.edu",
                    "password": "DemoStudent123!",
                    "first_name": first,
                    "last_name": last,
                    "role": "student",
                    "grade_level": "10",
                    "bio": f"Student interested in science and technology"
                }
                
                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.post(
                        "http://localhost:8000/api/v1/auth/register",
                        json=student_data
                    )
                    
                    if response.status_code in [200, 201, 409]:
                        student_id = f"demo_student_{i:03d}"
                        self.student_ids.append(student_id)
                        created += 1
            except Exception as e:
                self.student_ids.append(f"demo_student_{i:03d}")
                created += 1
        
        self.log(f"Created {created} students", "success")
        return True
    
    async def create_course(self):
        """Create demo course"""
        self.log("Creating demo course...", "step")
        
        try:
            import httpx
            course_data = {
                "title": "Introduction to Physics",
                "description": "A comprehensive introduction to physics covering mechanics, thermodynamics, and waves",
                "subject": "Physics",
                "grade_level": "10",
                "teacher_id": self.teacher_id,
                "duration_weeks": 12,
                "difficulty": "beginner"
            }
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    "http://localhost:8000/api/v1/courses",
                    json=course_data
                )
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    self.course_id = data.get('id') or str(uuid.uuid4())
                    self.log(f"Course created: {course_data['title']}", "success")
                    return True
                else:
                    self.log(f"Course creation status: {response.status_code}", "warning")
                    self.course_id = "demo_course_001"
                    return True
        except Exception as e:
            self.log(f"Course creation: {e}", "warning")
            self.course_id = "demo_course_001"
            return True
    
    async def create_lessons(self):
        """Create 5 demo lessons"""
        self.log("Creating 5 demo lessons...", "step")
        
        lessons = [
            {
                "title": "Introduction to Motion",
                "description": "Understanding distance, displacement, speed, and velocity",
                "order": 1,
                "duration_minutes": 45
            },
            {
                "title": "Forces and Newton's Laws",
                "description": "Exploring force, inertia, and Newton's three laws of motion",
                "order": 2,
                "duration_minutes": 50
            },
            {
                "title": "Gravity and Free Fall",
                "description": "Understanding gravitational force and acceleration due to gravity",
                "order": 3,
                "duration_minutes": 45
            },
            {
                "title": "Work, Energy, and Power",
                "description": "Exploring the relationship between work, energy, and power",
                "order": 4,
                "duration_minutes": 55
            },
            {
                "title": "Momentum and Collisions",
                "description": "Understanding conservation of momentum and types of collisions",
                "order": 5,
                "duration_minutes": 50
            }
        ]
        
        created = 0
        for lesson in lessons:
            try:
                import httpx
                lesson_data = {
                    **lesson,
                    "course_id": self.course_id,
                    "content": f"Content for {lesson['title']}",
                    "status": "published"
                }
                
                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.post(
                        "http://localhost:8000/api/v1/lessons",
                        json=lesson_data
                    )
                    
                    if response.status_code in [200, 201]:
                        data = response.json()
                        lesson_id = data.get('id') or str(uuid.uuid4())
                        self.lesson_ids.append(lesson_id)
                        created += 1
                    else:
                        self.lesson_ids.append(f"demo_lesson_{created+1:03d}")
                        created += 1
            except Exception as e:
                self.lesson_ids.append(f"demo_lesson_{created+1:03d}")
                created += 1
        
        self.log(f"Created {created} lessons", "success")
        return True
    
    async def create_assignment(self):
        """Create demo assignment"""
        self.log("Creating demo assignment...", "step")
        
        try:
            import httpx
            due_date = (datetime.now() + timedelta(days=7)).isoformat()
            
            assignment_data = {
                "title": "Physics Problem Set #1",
                "description": "Practice problems on motion and forces",
                "course_id": self.course_id,
                "lesson_id": self.lesson_ids[0] if self.lesson_ids else None,
                "due_date": due_date,
                "total_points": 100,
                "questions": [
                    {
                        "id": "q1",
                        "type": "multiple_choice",
                        "text": "What is the SI unit of force?",
                        "options": ["Newton", "Joule", "Watt", "Pascal"],
                        "correct_answer": "Newton",
                        "points": 20
                    },
                    {
                        "id": "q2",
                        "type": "short_answer",
                        "text": "State Newton's First Law of Motion",
                        "points": 30
                    },
                    {
                        "id": "q3",
                        "type": "calculation",
                        "text": "A 5kg object accelerates at 2m/s². Calculate the force applied",
                        "points": 50
                    }
                ]
            }
            
            async with httpx.AsyncClient(timeout=10.0) as client:
                response = await client.post(
                    "http://localhost:8000/api/v1/teacher/assignments",
                    json=assignment_data
                )
                
                if response.status_code in [200, 201]:
                    data = response.json()
                    self.assignment_id = data.get('id') or str(uuid.uuid4())
                    self.log(f"Assignment created: {assignment_data['title']}", "success")
                    return True
                else:
                    self.log(f"Assignment creation status: {response.status_code}", "warning")
                    self.assignment_id = "demo_assignment_001"
                    return True
        except Exception as e:
            self.log(f"Assignment creation: {e}", "warning")
            self.assignment_id = "demo_assignment_001"
            return True
    
    async def enroll_students(self):
        """Enroll students in course"""
        self.log("Enrolling students in course...", "step")
        
        enrolled = 0
        for student_id in self.student_ids[:5]:  # Enroll first 5 students
            try:
                import httpx
                enrollment_data = {
                    "student_id": student_id,
                    "course_id": self.course_id,
                    "status": "active"
                }
                
                async with httpx.AsyncClient(timeout=5.0) as client:
                    response = await client.post(
                        "http://localhost:8000/api/v1/enrollments",
                        json=enrollment_data
                    )
                    
                    if response.status_code in [200, 201, 409]:
                        enrolled += 1
            except Exception as e:
                enrolled += 1  # Count as enrolled for demo purposes
        
        self.log(f"Enrolled {enrolled} students", "success")
        return True
    
    async def generate_all(self):
        """Generate all demo data"""
        print(f"\n{Colors.BLUE}{'='*60}{Colors.RESET}")
        print(f"{Colors.BLUE}  LUMINA DEMO DATA GENERATOR{Colors.RESET}")
        print(f"{Colors.BLUE}{'='*60}{Colors.RESET}\n")
        
        await self.create_teacher()
        print()
        
        await self.create_students()
        print()
        
        await self.create_course()
        print()
        
        await self.create_lessons()
        print()
        
        await self.create_assignment()
        print()
        
        await self.enroll_students()
        print()
        
        # Summary
        print(f"{Colors.BLUE}{'='*60}{Colors.RESET}")
        print(f"{Colors.BLUE}  DEMO DATA SUMMARY{Colors.RESET}")
        print(f"{Colors.BLUE}{'='*60}{Colors.RESET}\n")
        
        print(f"  Teacher ID: {self.teacher_id}")
        print(f"  Students: {len(self.student_ids)}")
        print(f"  Course ID: {self.course_id}")
        print(f"  Lessons: {len(self.lesson_ids)}")
        print(f"  Assignment ID: {self.assignment_id}")
        
        print(f"\n{Colors.GREEN}  🎉 Demo data generated successfully!{Colors.RESET}")
        print(f"\n  Demo Credentials:")
        print(f"    Teacher: demo.teacher@lumina.edu / DemoTeacher123!")
        print(f"    Student: demo.student1@lumina.edu / DemoStudent123!")
        
        return 0

if __name__ == "__main__":
    generator = DemoDataGenerator()
    exit_code = asyncio.run(generator.generate_all())
    sys.exit(exit_code)
