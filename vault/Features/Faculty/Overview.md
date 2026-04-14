# Faculty & Academics: Overview

The **Faculty & Academics** domain provides the tools for educators and administrators to manage the curriculum, track student performance, and coordinate institutional logistics.

## 🎯 Purpose
- **Instructional Management**: Course creation, lesson planning, and material distribution.
- **Academic Performance Tracking**: Monitoring student grades, attendance, and "Exam Readiness" metrics.
- **Communication Hub**: Direct interaction with students, parents, and department heads (HODs).
- **Gamification Control**: Setting benchmarks and awarding achievements.

## 🧩 Core Components
- **Backend Routers**: 
  - `backend/app/routers/teacher.py` (Teacher-specific actions).
  - `backend/app/routers/faculties.py` (Global faculty management).
  - `backend/app/routers/curriculum.py` (Structure management).
- **Institutional Logic**: `backend/app/routers/institutions.py`
- **Frontend Dashboard**: `frontend/web/src/app/(teacher)/dashboard/page.tsx`

## 📊 Key Responsibilities
1. **Attendance Tracking**: Managing daily logs for sections and batches.
2. **Assignment Lifecycle**: Creation, rubric definition, and review of AI-graded submissions.
3. **Curriculum Design**: Mapping units, lessons, and learning objectives to academic years.

### 🔗 Related Paths
- [[Features/Governance/Backend|Departmental Approval Cascade]]
- [[Features/AI/Flow|AI Grading & Verification Flow]]
- [[DECISION_FLOW|OCR Confusion Intervention]]

---
[[START_HERE]] | [[Faculty/API]] | [[Faculty/Backend]] | [[Faculty/Frontend]] | [[Faculty/Flow]]
