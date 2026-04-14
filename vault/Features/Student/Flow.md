# Student: System Flow & Learning Loop

The student learning lifecycle is a closed-loop system where activity drives personalization and AI intervention.

## 🔄 Daily Learning Lifecycle

```mermaid
sequenceDiagram
    participant Student
    participant Dashboard as Student Dashboard (student.py)
    participant Tutor as AI Tutor (ai_tutor.py)
    participant Store as Student Store (student_store.py)
    participant DB as Supabase

    Student->>Dashboard: Open Home
    Dashboard->>Store: get_student_full_dashboard(id)
    Store->>DB: Query enrollments, progress, assignments
    DB-->>Store: Data Blob
    Store-->>Dashboard: Dashboard State
    Dashboard-->>Student: Display Status & CTA (e.g. "Practice Topic X")

    Student->>Tutor: Ask Question
    Tutor->>Tutor: _run_student_tutor_answer()
    Tutor->>DB: Update mastery (academic_store.update_mastery)
    DB-->>Tutor: Persisted
    Tutor-->>Student: AI Response + Mastery Gain

    Student->>Dashboard: Log Session
    Dashboard->>Store: log_activity(duration)
    Store->>Store: Calculate Streak (24h logic)
    Store->>DB: Update progress.streak & last_accessed
    DB-->>Store: Success
    Store-->>Dashboard: Updated Stats
```

## 🛤 Full System Traceability

| Stage | Feature | Implementation Reference |
| :--- | :--- | :--- |
| **Discovery** | Dashboard | `student.py -> get_student_dashboard` |
| **Action** | Tutoring | `student.py -> ask_tutor` |
| **Logic** | AI Orchestration | `student.py -> _run_student_tutor_answer` |
| **Persistence** | Data Layer | `student_store.py -> log_activity` |
| **Reward** | Achievements | `student.py -> _build_achievement_summary` |

## ⚙️ Streak Logic Verification
- **Test Command**: `pytest tests/test_student_store.py` (Verify `delta` boundary conditions: same-day, next-day, and gap-day).
- **Manual Verification**: Check `last_accessed` date in Supabase `enrollments` table after activity logging.
