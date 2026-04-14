# Student Experience: Overview

The **Student Experience** domain is the heart of the Lumina LMS. It provides an adaptive, AI-augmented environment where students manage their academic journey, interact with tutors, and track their progress in real-time.

## 🎯 Purpose
- **Academic Management**: Course enrollment, schedule tracking, and grade monitoring.
- **Personalized Learning**: AI-driven lesson paths and tutor interactions.
- **Assessment Cycle**: Quiz taking, rapid grading, and feedback visualization.
- **Support Links**: Direct connection to parents and mentors via specialized codes.

## 🧩 Core Components
- **Backend Router**: `backend/app/routers/student.py`
- **Data Engine**: `backend/app/store/student_store.py`
- **AI Orchestrator**: `backend/app/services/personalized_tutor.py`
- **Frontend Dashboard**: `frontend/web/src/app/(student)/dashboard/page.tsx`

## 📊 Key Data Points
1. **Enrollment Hub**: Tracks active vs completed courses.
2. **Activity Stream**: Real-time log of lessons viewed, notes taken, and AI tutor queries.
3. **KPIs**: Overall GPA, attendance consistency, and "Focus Score" from AI analysis.

### 🔗 Related Paths
- [[Features/AI/Backend|Adaptive Tutor Logic]]
- [[Features/Support/Backend|Parent Advocacy Linking]]
- [[DECISION_FLOW|Struggle Detection Flow]]

---
[[START_HERE]] | [[Student/API]] | [[Student/Backend]] | [[Student/Frontend]] | [[Student/Flow]]
