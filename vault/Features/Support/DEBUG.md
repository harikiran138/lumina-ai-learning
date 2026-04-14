# Debug Playbook: Parental Support

Use this guide to diagnose issues with parent-student linking, progress visibility, and goal targets.

## 🚨 Common Failure Scenarios

### 1. Parent-Student Linking Failure
- **Symptoms**: Parent sees "No Students Linked" dashboard.
- **Check**:
    - **Logic**: Inspect the `parent_id` link in the `student_stats` or `user_links` table.
    - **Code Reference**: [user_store.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/store/user_store.py).
- **Resolution**: Re-generate the unique linking code (LUM-XXXXXX) for the student and have the parent re-enter it.

### 2. Goal Target Mismatch
- **Symptoms**: Parent sets a "Study 2 hours" goal, but student sees something else.
- **Check**: [parent.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/parent.py). Verify the `update_goals` endpoint is writing to the correct mapping.
- **DB Table**: `learning_goals`.

### 3. Digest Notification Missing
- **Symptoms**: Parent is not receiving the daily progress summary.
- **Check**: [notifications.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/notifications.py). Verify if the parent's email is correctly verified and notification preferences are enabled.

## 🛠 Step-by-Step Debug Path
1. **Link Verification**: 
   `SELECT student_id FROM user_links WHERE parent_id = '...' AND status = 'active';`
2. **Preference Check**: 
   Verify `notifications_enabled` in parent user settings.
3. **Logic Flow**:
    - [parent.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/parent.py) (Parent API Shell)
    - [notifications.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/notifications.py) (Email/Push Queue)

## 📊 Logs to Watch
- `parent_link_requested`: Check for failed attempts if parents can't connect.
- `goal_sync_error`: Triggered if the student store fails to reflect parent targets.

---
[[DEPENDENCY_MAP]] | [[Features/Support/Backend]] | [[Features/Support/Flow]]
