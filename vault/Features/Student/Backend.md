# Student Experience: Backend Implementation

The student-facing backend is focused on dashboard orchestration, progress tracking, and learning consistency benchmarks.

## 🛤 Code Traceability
- **Primary Router**: [student.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/student.py)
- **Primary Store**: [student_store.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/store/student_store.py)
- **Key Functions**:
    - `get_student_dashboard()`: Aggregates courses, mastery, and streaks.
    - `log_activity()`: Core streak maintenance and hours tracking ([student_store.py:L168](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/store/student_store.py#L168)).
    - `update_mastery()`: Persists granular topic performance.
    - `_build_due_assignments()`: Deadline detection logic.
    - `fsrs_update_card()`: Spaced repetition logic in [fsrs_engine.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/services/fsrs_engine.py).

## 🏗 Data Persistence: The Enrollment Model
Unlike traditional relational models that use dozens of rows for progress, Lumina uses a high-performance **JSON-in-Row** strategy in the `enrollments` table.

### Progress JSON Structure
Every enrollment includes a `progress` JSON object with the following schema:
```json
{
  "completed_lessons": ["lesson_uuid_1", "lesson_uuid_2"],
  "mastery": 78.5,
  "hours_spent": 12.4,
  "streak": 5,
  "last_accessed": "2026-04-14T10:30:00Z"
}
```

## 🔥 Streak Maintenance Algorithm (Verifiable Logic)
The system uses a 24-hour sliding window implemented in `StudentStore.log_activity`:
1.  **Fetch**: Loads `last_accessed` timestamp from the progress JSON.
2.  **Calculate**: `delta = (now.date() - last_accessed.date()).days`.
3.  **Traceable Logic**:
    - `delta == 1`: Increment streak (+1).
    - `delta > 1`: Reset streak to 1 (Ensures only consecutive days count).
    - `delta == 0`: No change (User already active in this calendar day).
4.  **Verification**: Every activity log event ([student_store.py:L210](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/store/student_store.py#L210)) updates the `last_accessed` timestamp to the current ISO format.

## 📊 Dashboard Orchestration Flow
1. **Frontend** calls `GET /api/student/dashboard`.
2. **Router** `get_student_dashboard` handles the request.
3. **Cache Check**: Queries Redis for `dashboard:student:{id}`.
4. **Data Aggregation**: Parallel execution of `get_profile`, `get_interventions`, and `list_events`.
5. **Logic Helpers**:
    - `_build_weak_topics`: Extracts top 6 areas needing review.
    - `_pick_resume_course`: Identifies the most recent active course.
    - `_build_next_action`: Generates the primary CTA (Assignment > Practice > Resume).
6. **Response**: Returns a unified JSON blob for the Student Home UI.

## ⚠️ Failure Points & Risk Analysis

### Failure Points
- **Streak Reset Timezone mismatch**: Server UTC vs Student Local Time can cause unexpected streak resets if the 24h window calculation doesn't account for offsets.
- **Progress JSON Corruption**: Manual DB edits to the `progress` JSON column that violate the schema will cause dashboard aggregation to crash.
- **Cache Inconsistency**: If Redis fails, the dashboard fallback to DB is slower, potentially impacting "Time to First Byte" (TTFB) on the student dashboard.
- **Mastery Calculation Lag**: Heavy BKT/DKT computations for high-volume students can spike DB load during mastery synchronization.

### Risk Level: MEDIUM
- **Reasoning**: While critical for student engagement, a failure here is rarely system-blocking (unlike Auth). However, "Data integrity" risk is medium due to the `JSON-in-Row` strategy which lacks strict foreign key constraints on progress nodes.

