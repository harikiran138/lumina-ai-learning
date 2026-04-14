# Debug Playbook: Faculty Teaching

Use this guide to diagnose issues with automated grading, OCR digitization, and classroom management.

## 🚨 Common Failure Scenarios

### 1. OCR Digitization Failure (Low Confidence)
- **Symptoms**: Uploaded assignment shows "Pending Audit" or has garbled text.
- **Check**:
    - **Logic**: Inspect [ocr_service.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/services/ocr_service.py). 
    - **Threshold**: Standard threshold is `0.70`. If confidence is below this, it triggers a manual audit.
- **Resolution**: Teacher must manually verify the digitization from the [Faculty Dashboard](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/vault/Features/Faculty/Overview.md).

### 2. Grading Lockout (Approval Needed)
- **Symptoms**: Grade submitted by teacher is not visible to the student.
- **Check**:
    - **Governance**: Verify if the assignment requires **HOD Approval** via [Governance/Flow](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/vault/Features/Governance/Flow.md).
    - **Status**: Check `assignments` table for `status = 'pending_hod_review'`.

### 3. Missing Intervention Alerts
- **Symptoms**: Struggling students are not appearing in the "Intervention Required" list.
- **Check**: [teacher.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/teacher.py). Verify the `struggle_detection` heuristic (usually 3+ AI assistance requests within 60 mins).

## 🛠 Step-by-Step Debug Path
1. **File Audit**: Check `data/uploads/` for the original assignment image.
2. **DB Check**: `SELECT * FROM assignment_digitization WHERE assignment_id = '...'`.
3. **Logic Audit**: 
    - [teacher.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/routers/teacher.py) (Dashboard Logic)
    - [ocr_service.py](file:///Users/chepuriharikiran/Desktop/github/lumina-ai-learning/backend/app/services/ocr_service.py) (Digitization Logic)

## 📊 Error Codes to Watch
- `OCR_ENGINE_TIMEOUT`: Failure to communicate with the TrOCR model.
- `APPROVAL_CASCADING_FAILURE`: Issue in the HOD/Admin approval chain.

---
[[IMPACT]] | [[Features/Faculty/Backend]] | [[Features/Faculty/Flow]]
