# Lumina Academic Architecture & Execution Flow Documentation

This document provides a comprehensive, code-verified explanation of the Lumina AI Learning platform's academic flow. It traces real execution paths across routers, services, stores, and canonical database tables.

---

## 1. Student Entry: The Onboarding Flow
The student entry flow maps a physical user to a pedagogical class via a canonical enrollment record.

*   **Trigger**: A student joins a class or is registered by an administrator.
*   **API Router**: `backend/app/routers/academic.py` (`POST /enroll`).
*   **Service Layer**: `AcademicService.enroll_student` (business logic validates course availability and batch capacity).
*   **Store Layer**: `AcademicStore.create_enrollment` (handles Supabase persistence).
*   **Database Table**: `student_enrollments` (*Mappings: student_id, class_id, course_id, status*).
*   **Frontend**: Handled by the **Class Selection** or **Admission** module in the Student Dashboard.

---

## 2. Class Creation: The Structural Flow
Classes are the primary grouping unit for students, linked to courses and departments.

*   **API Router**: `backend/app/routers/academic.py` (`POST /classes`).
*   **Triggering Role**: `admin` or `college_admin`. HODs can view but typically do not create top-level classes without admin elevation.
*   **Service Layer**: `AcademicService.create_class`.
*   **Store Layer**: `AcademicStore.create_class`.
*   **Database Table**: `classes`.
*   **Fields**: `id`, `course_id`, `name`, `batch`, `institution_id`. Note: `is_active` defaults to `true` for new classes.

---

## 3. Teacher Assignment: The Academic Authority Flow
Teachers are assigned to specific classes via an assignment record, which governs their dashboard scope.

*   **API Router**: `backend/app/routers/academic.py` (`POST /assignments`).
*   **Service Layer**: `AcademicService.assign_teacher`.
*   **Verification**: The system verifies that the teacher has been approved by the HOD/Admin before an assignment becomes active.
*   **Store Layer**: `AcademicStore.create_teacher_assignment`.
*   **Database Table**: `teacher_assignments` (*Mappings: teacher_id, class_id, course_id, status*).
*   **Access Enforcement**: The `verify_teacher_has_class_access` function (in `class_auth.py`) checks this table for every teacher-scoped request.

---

## 4. Access Control Flow
Authorization is decentralized to the dependency level and verified at the utility level.

### Identity Layer (`app.api.deps`)
- **`get_current_student`**: Extracts JWT -> Validates role `student`.
- **`get_current_teacher`**: Extracts JWT -> Validates role `teacher` (or faculty/hod/admin).
- **`get_current_hod`**: Extracts JWT -> Enriches user object with `resolved_department_id` from the `departments` table.

### Relationship Layer (`app.utils.class_auth`)
- **`verify_teacher_has_class_access`**: Queries `teacher_assignments` to ensure the teacher is mapped to the `class_id`.
- **`verify_student_in_class`**: Queries `student_enrollments` to ensure the student is active in the `class_id`.

---

## 5. HOD View Flow
The HOD's view is exclusively scoped to their department without requiring manual ID selection.

*   **Department ID Resolution**: The `get_current_hod` dependency automatically finds the HOD's `department_id` by matching the user's ID against the `hod_id` field in the `departments` table.
*   **Filtering**: Routers in `backend/app/routers/hod.py` pass this `resolved_department_id` to the `AcademicStore`.
*   **Queries**: Queries to `get_department_teachers` or `get_department_students` filter by `department_id` at the database level to ensure data isolation.

---

## 6. AI Queue: The Human-in-the-Loop Lifecycle
Tracing a student's question from submission to teacher-verified answer.

1.  **Submission**: Student calls `POST /api/ai-tutor/chat`. `AITutorStore` creates a record in `ai_answer_queue` (Status: `pending`).
2.  **Generation**: A `background_task` triggers the `AITutorService` to hit the LLM. The AI classification returns `PROVISIONAL` status.
3.  **Persistence**: The answer is saved to `ai_answer_queue.ai_answer`, but `released_to_student` remains `false`.
4.  **Teacher Discovery**: The teacher dashboard calls `GET /api/teacher/ai-queue` (routed to `ai_queue.py`), which filters pending items based on the teacher's assigned `class_id`.
5.  **Human Action**: Teacher reviews the answer. Calling `POST .../approve` triggers `AIQueueService.approve_answer`.
6.  **Finalization**: 
    - `ai_answer_queue` status is set to `approved`.
    - `released_to_student` becomes `true`.
    - The answer is copied to the `verified_answers_bank` table for future RAG (Retrieval Augmented Generation) optimization.
7.  **Real-time Delivery**: `RealtimeService` broadcasts an "answer_ready" event via WebSockets to the student's open chat window.

---

## 7. Canonical Data Model Summary

| Feature | Canonical Table | Role-Based Access Scoping |
| :--- | :--- | :--- |
| **Enrollment** | `student_enrollments` | Student -> Class |
| **Assignments** | `teacher_assignments` | Teacher -> Class |
| **AI Work** | `ai_answer_queue` | Class-based Queue |
| **Knowledge** | `verified_answers_bank` | Global Bank (Curated) |
| **Departments** | `departments` | HOD -> Dept |
