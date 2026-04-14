# Use-Case Navigation

This module maps practical, real-world development and operational scenarios to the underlying documentation nodes. 

## 🏃 Top Scenarios

### Scenario 1: "Student submits an assignment"
Trace the journey from the UI upload to the database record.
- **UI**: [[Features/Student/Overview|Student Portal]]
- **API**: `POST /api/student/assignments/submit`
- **Logic**: [[Features/Student/Backend|Student Store Logic]]
- **Persistence**: `assignment_submissions` table

### Scenario 2: "Faculty grades handwritten work"
Trace the OCR pipeline from image ingestion to AI-suggested marks.
- **Trigger**: [[Features/Faculty/Overview|Teacher Dashboard]]
- **Service**: [[Features/Faculty/Backend|OCR Pipeline (TrOCR)]]
- **Verification**: [[Features/Faculty/Flow|Grading Review Flow]]
- **Audit**: [[Features/Governance/Backend|AI Audit Log]]

### Scenario 3: "AI adapts difficulty"
Understand how student performance signals are converted into dynamic learning paths.
- **Detection**: [[Features/AI/Overview|Classifier Logic]]
- **Engine**: [[Features/Student/Backend|FSRS Engine Logic]]
- **Flow**: [[Features/AI/Flow|A2UI Protocol Flow]]

---

## 🧭 Step-By-Step Developer Guides

### I want to add a new AI task...
1. Start here: [[Features/AI/Overview]]
2. Understand the prompt strategy: [[Features/AI/Backend]]
3. Map the asynchronous sequence: [[Features/AI/Flow]]

### I want to change the enrollment logic...
1. Start here: [[Features/Student/Overview]]
2. Edit the persistence helper: [[Features/Student/Backend]]
3. Verify the API contract: [[Features/Student/API]]

---
[[START_HERE]] | [[SYSTEM_MAP]] | [[DECISION_FLOW]]
