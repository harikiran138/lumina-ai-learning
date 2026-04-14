# Student Support: Backend Architecture

The support domain focuses on external stakeholder integration (Parents) and automated learner advocacy.

## 🛤 Code Traceability
- **Primary Router**: [parent.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/parent.py)
- **Primary Store**: [student_store.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/store/student_store.py)
- **Key Functions**:
    - `generate_parent_link_code()`: Generates unique `LUM-XXXXXX` codes ([student_store.py:L219](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/store/student_store.py#L219)).
    - `link_student()`: Validates code and establishes FK relationship ([parent.py]).
    - `get_parent_link_status()`: Verifies current connection state.

## 🔗 Parent-Student Linking Logic (Verifiable Logic)
The linking process is a security-first protocol ensuring only authorized parents access student data.

1.  **Code Generation**: Student triggers code generation in their support settings.
    - Code Format: `LUM-` followed by 6 alphanumeric characters.
    - Default Expiry: **24 hours**.
2.  **Activation**: Parent enters the code via `POST /api/parent/link`.
3.  **Verification**:
    - Checks `parent_student_links` table for matching code.
    - Ensures `status == 'pending'` and `expires_at > now`.
4.  **Relationship Establishment**: Updates status to `linked` and sets `parent_id` on the link record ([student_store.py:L267](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/store/student_store.py#L267)).

## 📋 Goal Alignment Flow
1. **Parent** sets a learning goal via the Parent Dashboard.
2. **Logic**: Persisted in student metadata.
3. **Traceability**: [parent.py] manages the goal update endpoints.
4. **Impact**: The AI Tutor incorporates parent-set goals into its `SAFE_INSTANT` prompt construction.

## ⚠️ Failure Points & Risk Analysis

### Failure Points
- **Linking Code Expiry Race Condition**: If a parent enters a code exactly at the 24-hour mark, token validation may fail due to clock drift between the application and database.
- **Dangling Links**: If a student is deleted or unenrolled, parent links in `parent_student_links` must be explicitly cleaned up to prevent orphaned data access.
- **Notification Silence**: Failures in the [notifications.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/notifications.py) service will prevent parents from receiving critical "Struggle Alerts," breaking the advocacy loop.

### Risk Level: LOW
- **Reasoning**: The Support domain is a downstream advocacy layer. While its failure impacts parent engagement and student motivation, it does not interrupt the core learning or administrative functions of the institution.

