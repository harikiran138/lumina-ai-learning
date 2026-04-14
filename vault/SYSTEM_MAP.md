# System Map (Human View)

The Lumina system is a multi-domain ecosystem where signals from one domain drive intelligence and action in others.

## 🗺 Functional Domains

### 1. Learning (Student)
- **Primary Goal**: Course completion, mastery gain, and streak maintenance.
- **Output Signals**: Mastery levels, activity hours, quiz performance.
- → [[Features/Student/Overview]] | [[Features/Student/Backend]] | [[Features/Student/Frontend]] | [[Features/Student/API]] | [[Features/Student/DEBUG]]

### 2. Intelligence (AI Engine)
- **Primary Goal**: Semantic routing, personalized tutoring, and gap detection.
- **Input Signals**: Student prompt, course context, struggle detection.
- **Output Signals**: A2UI payload, intervention alerts.
- → [[Features/AI/Overview]] | [[Features/AI/Backend]] | [[Features/AI/Frontend]] | [[Features/AI/API]] | [[Features/AI/DEBUG]]

### 3. Teaching (Faculty)
- **Primary Goal**: Classroom orchestration, grading, and intervention.
- **Input Signals**: Intervention alerts, handwritten assignments (OCR).
- **Output Signals**: Verified grades, manual intervention notes.
- → [[Features/Faculty/Overview]] | [[Features/Faculty/Backend]] | [[Features/Faculty/Frontend]] | [[Features/Faculty/API]] | [[Features/Faculty/DEBUG]]

### 4. Governance (Admin/HOD)
- **Primary Goal**: Accountability, resource allocation, and auditing.
- **Input Signals**: Teacher requests, AI audit logs.
- **Output Signals**: Approved assignments, policy enforcement.
- → [[Features/Governance/Overview]] | [[Features/Governance/Backend]] | [[Features/Governance/Frontend]] | [[Features/Governance/API]] | [[Features/Governance/DEBUG]]

### 5. Support (Parent/Mentor)
- **Primary Goal**: Holistic advocacy and goal alignment.
- **Input Signals**: Student progress summary.
- **Output Signals**: Goal targets, motivational signals.
- → [[Features/Support/Overview]] | [[Features/Support/Backend]] | [[Features/Support/Frontend]] | [[Features/Support/API]] | [[Features/Support/DEBUG]]

---

## 🏗 The Foundation: Auth & Security
Underpinning all domains is the **Identity & Access** layer. It ensures that every signal and output is securely mapped to a verified institutional identity.
- → [[Features/Auth/Overview]] | [[Features/Auth/Backend]] | [[Features/Auth/Frontend]] | [[Features/Auth/API]] | [[Features/Auth/DEBUG]]

---

## 🔄 Interaction Matrix
- **Student → AI**: Prompting and response cycle.
- **AI → Faculty**: Struggle detection creates intervention alerts.
- **Faculty → HOD**: Assignment requests for governance gatekeeping.
- **DB → Parent**: Daily progress digests for support loop.

---
[[START_HERE]] | [[DECISION_FLOW]] | [[USE_CASES]]
