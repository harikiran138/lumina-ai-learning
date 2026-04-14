# Debug Playbook: Student Learning

Use this guide to diagnose issues with the student experience, including progress tracking and personalization.

## 🚨 Common Failure Scenarios

### 1. Streak Reset Unexpectly
- **Symptoms**: Student sees "0 Day Streak" despite studying yesterday.
- **Check**:
    - **Logic**: Check [student_store.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/store/student_store.py) for streak calculation.
    - **Timezone**: Verify if the `last_activity_at` timestamp was recorded in UTC vs local time.
- **Resolution**: Adjust the `last_activity_at` in the `student_stats` table if a timezone mismatch occurred.

### 2. Mastery Level Mismatch
- **Symptoms**: Student completes a module but mastery (BKT/DKT) does not increase.
- **Check**:
    - **API**: [ai_tutor.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/ai_tutor.py) - check `update_mastery` endpoint.
    - **Logic**: Verify if the `correctness_threshold` was met for the mastery gain trigger.
- **Backend File**: [personalization.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/personalization.py)

### 3. Pathway Generation Error (Looping)
- **Symptoms**: Student sees the same knowledge nodes repeatedly.
- **Check**: `pathway_agent` logic. Verify if completed nodes are being excluded from the next recommendation.

## 🛠 Step-by-Step Debug Path
1. **Initial Assessment**: `SELECT * FROM student_stats WHERE student_id = '...'`.
2. **Activity Trace**: `SELECT * FROM activity_logs WHERE user_id = '...' ORDER BY created_at DESC`.
3. **Logic Audit**: 
    - [student_store.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/store/student_store.py) (Data Access)
    - [student.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/student.py) (API Layer)

## 📊 Logs to Watch
- `mastery_calculation_error`: Issues with the probabilistic model.
- `streak_update_skipped`: Occurs if activity is detected within the 24-hour buffer.

---
[[IMPACT]] | [[DECISION_FLOW]] | [[Features/Student/Overview]]
