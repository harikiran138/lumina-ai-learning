# Agent Job Flow Diagram

> **File:** `10-diagrams/03-agent-job-flow.md`
> **Related:** [[03-agents/06-agent-orchestration]], [[04-data-flow/04-ai-agent-job-flow]]
> **Last Updated:** 2026-04-15

Mermaid diagrams for the LangGraph agent graph and the full TILA queue state machine.

---

## LangGraph Agent Graph

```mermaid
flowchart TD
    Entry([Request enters AI Engine]) --> Router{route_by_task_type}

    Router -- task=tutor --> TutorNode["Tutor Node\nClaude Sonnet 4.6\nRAG-grounded Socratic answer"]
    Router -- task=assessment --> AssessmentNode["Assessment Node\nGemini 1.5 Flash\nQuiz / rubric generation"]
    Router -- task=pathway --> PathwayNode["Pathway Node\nPPO PyTorch\nNext KC recommendation"]

    TutorNode --> GuardianNode
    AssessmentNode --> GuardianNode
    PathwayNode --> GuardianNode

    GuardianNode["Guardian Node\nClaude Haiku 4.5\nSafety + quality gate"]

    GuardianNode --> RouteG{guardian.decision}
    RouteG -- PASS --> PersistNode["Persist Node\nWrite to PostgreSQL\nNotify Teacher via Redis"]
    RouteG -- FLAG --> PersistNode
    RouteG -- BLOCK --> BlockLog["Log to guardian_block_log\nNotify student: 'I can't help with that'"]

    PersistNode --> End([Job complete])
    BlockLog --> End
```

---

## AI Queue State Machine

```mermaid
stateDiagram-v2
    [*] --> QUEUED : Student submits question\n(agent_jobs table)

    QUEUED --> PENDING : Guardian PASS or FLAG\n(ai_answer_queue inserted)
    QUEUED --> BLOCKED : Guardian BLOCK\n(never enters queue)

    PENDING --> APPROVED : Teacher/Faculty/HOD approves
    PENDING --> REJECTED : Teacher/Faculty/HOD rejects
    PENDING --> ESCALATED : Teacher escalates to Faculty

    ESCALATED --> APPROVED : Faculty/HOD approves
    ESCALATED --> REJECTED : Faculty/HOD rejects
    ESCALATED --> ESCALATED : Faculty escalates to HOD\n(escalated_to changes)

    QUEUED --> FAILED : Agent error / timeout

    APPROVED --> [*] : Answer delivered to student\nQ+A indexed in FAISS
    REJECTED --> [*] : Student notified to rephrase
    BLOCKED --> [*] : Generic refusal shown
    FAILED --> [*] : Retry prompt shown to student
```

---

## BKT+DKT Knowledge Trace Update

```mermaid
flowchart LR
    A[Student submits quiz] --> B[FastAPI auto-grades MCQs]
    B --> C[BackgroundTask: BKT+DKT update]

    C --> D["BKT update per KC\np_mastery_posterior =\nBayesian update(prior, correct)"]
    C --> E["DKT inference\nLSTM reads full event sequence\n→ mastery vector over all KCs"]

    D --> F["combined_mastery =\n0.5 × BKT + 0.5 × DKT"]
    E --> F

    F --> G[UPDATE knowledge_trace table]
    G --> H[BackgroundTask: PPO Pathway Agent]
    H --> I[New KC recommendation written\nto student_pathway_log]
    I --> J[Dashboard 'Next Lesson' widget updates]

    G --> K[BackgroundTask: FSRS update]
    K --> L["For each quiz question:\nrating = 3 if correct else 1\nnew_stability = FSRS(stability, rating)\nnext_review_at = now + stability_days"]
    L --> M[UPDATE fsrs_card_state table]
```

---

## Dropout Prediction Pipeline

```mermaid
flowchart TD
    Cron["Weekly Cron\nSunday 02:00 IST"] --> FV["Build feature vectors\nper student per course"]

    FV --> F1[attendance_rate_7d]
    FV --> F2[submission_rate_7d]
    FV --> F3[avg_quiz_score_trend]
    FV --> F4[login_frequency_7d]
    FV --> F5[mastery_avg + mastery_trend]
    FV --> F6[days_since_last_login]
    FV --> F7[flashcard_review_rate]

    F1 & F2 & F3 & F4 & F5 & F6 & F7 --> XGB["XGBoost inference\n→ risk_score 0.0-1.0"]

    XGB --> SHAP["SHAP values\nper feature per student"]
    XGB --> Label{risk_label}
    Label -- score ≥ 0.7 --> HIGH["HIGH\n→ Alert Teacher + Faculty + HOD"]
    Label -- 0.4-0.7 --> MED["MEDIUM\n→ Logged only"]
    Label -- score < 0.4 --> LOW["LOW\n→ Logged only"]

    HIGH --> DB[INSERT dropout_predictions\nINSERT dropout_alerts]
    MED --> DB
    LOW --> DB

    HIGH --> Notif["In-platform notification\nto Teacher"]
```
