# Teacher Real-Time Dashboard

Last updated: 2026-03-14

## Purpose

This document defines the teacher control plane for Lumina.

Teachers should not only see charts.
They should be able to answer, in one screen:

- who needs help right now
- what concept they are struggling with
- what the AI recommends next
- why that recommendation was made
- what action the teacher can take immediately

## Current Repo Reality

Status: `implemented foundation, missing live intervention layer`

What exists:

- teacher dashboard UI in `frontend/web/src/app/teacher/dashboard/page.tsx`
- dashboard aggregates in `backend/app/store/analytics_store.py`
- teacher stats endpoint in `backend/app/assessment/api/router.py`
- intervention read API in `backend/app/routers/personalization.py`

What the current dashboard already shows:

- summary cards
- priority queue
- course health
- assignment workload
- student momentum

What is not yet present:

- live per-concept heatmap
- drilldown into current question and current misconception
- teacher override of next question or pathway
- direct intervention actions from the queue

## Dashboard Layers

## 1. Class summary strip

Shows:

- active students now
- students needing attention
- upcoming deadlines
- grading queue
- average mastery

The screenshots also imply these top-line buckets:

- struggling right now
- at-risk this week
- growing consistently

## 2. Concept heatmap

Target-state display:

- rows: concepts or concept clusters
- columns: students or student groups
- cell color: mastery plus confidence
- badges: recent drop, overload, unresolved misconception

## 3. Intervention queue

Shows the highest-priority teacher actions first.

Each card should include:

- student
- course
- concept
- urgency
- confidence
- evidence
- recommended action

## 4. Student detail drawer

When teacher clicks a student, show:

- current lesson or question
- concept mastery map
- recent answers
- cognitive load
- explanation modes that worked recently
- current AI recommendation

This aligns with the screenshot claim that a teacher should be able to see:

- current question the learner is on right now
- mastery per concept, not just overall
- growth velocity state
- last five answers
- top lag zones
- AI's current recommendation

## 5. Teacher action center

Target teacher actions:

- send message
- assign remediation resource
- lower or raise difficulty band
- mark concept for manual review
- override the next question
- override the next pathway step
- schedule follow-up

To match the screenshots more literally, this action center should also support:

- one-click encouragement
- watchlist only
- send a quick tip
- shift learner to easier or harder track

## Data Model

### Proposed intervention object

The repo already has `InterventionRecommendation`.
It should be expanded into the main teacher action contract.

```json
{
  "id": "int-123",
  "user_id": "student-123",
  "course_id": "course-123",
  "topic_id": "newtons_second_law",
  "priority": "high",
  "status": "open",
  "recommended_action": "Send a worked example using sports motion",
  "reason": "Repeated incorrect answers and rising cognitive load",
  "confidence": 0.76,
  "evidence": {
    "mastery": 0.38,
    "cognitive_load": 0.81,
    "recent_attempts": 4,
    "explanation_mode_that_helped": "analogy"
  }
}
```

### Proposed student dashboard card contract

```json
{
  "student_id": "student-123",
  "name": "Arjun",
  "current_topic": "newtons_second_law",
  "current_mastery": 0.42,
  "growth_velocity": -0.03,
  "cognitive_load": 0.79,
  "lag_zones": ["newtons_second_law", "force_vectors"],
  "best_explanation_mode": "real_world",
  "recommended_next_action": "send analogy + worked example",
  "teacher_actions": ["message", "override_question", "assign_resource"]
}
```

## Queue Ranking Logic

The intervention queue should combine urgency and expected actionability.

### Proposed score

```python
queue_priority = (
    0.30 * risk_score
    + 0.20 * concept_severity
    + 0.15 * low_mastery_confidence_gap
    + 0.15 * overload_risk
    + 0.10 * deadline_proximity
    + 0.10 * teacher_actionability
)
```

### Ranking rules

- unresolved high-risk interventions rise to the top
- learners who are stuck despite repeated AI support rise to the top
- low-confidence AI recommendations should still appear, but clearly marked for teacher judgment

## Class-Level Insight Panels

The screenshots show a broader class-intelligence layer, not only per-student alerts.

Teacher-facing class insight panels should include:

- which concept has `60%+` of the class confused
- which explanation mode the class currently responds best to
- which student pairs or support clusters learn well together
- class dropout-risk score, refreshed on a regular schedule
- average time-to-mastery per concept
- predictive list of learners likely to fail or stall next week
- auto-generated weekly report per student and for the whole class

## Refresh Model

The screenshots imply a truly live dashboard. The repo is not there yet.

### Current likely model

- request/response polling from dashboard data endpoints

### Target model

- websocket or SSE updates for:
  - new intervention created
  - mastery drop
  - high cognitive load
  - authenticity flag
  - assignment submission received

## Current Implementation Map

| Area | Current status |
| --- | --- |
| Summary cards | Implemented |
| Priority queue | Implemented in aggregate form |
| Student momentum list | Implemented |
| Intervention API | Implemented basic read path |
| Per-concept heatmap | Missing |
| Real-time transport | Missing |
| Teacher override actions | Missing |
| Explanation-style visibility | Missing |

## Implementation Targets In This Repo

| Goal | File targets |
| --- | --- |
| enrich teacher overview with intervention evidence and concept detail | `backend/app/store/analytics_store.py` |
| expose teacher action APIs | `backend/app/routers/personalization.py`, new teacher action routes |
| add heatmap and intervention action UI | `frontend/web/src/app/teacher/dashboard/page.tsx` |
| feed learner KPIs and explanation history into queue generation | `backend/app/services/personalization_service.py` |

## Definition Of Done

The teacher dashboard is ready when:

- it surfaces per-concept, per-student risk and mastery
- interventions include evidence and confidence
- teachers can act directly from the queue
- teacher actions are logged and measured for downstream impact

## Recommended Companion Docs

- `docs/VISION_ALIGNMENT_AUDIT.md`
- `docs/STUDENT_KPI_ENGINE.md`
- `docs/AGENT_BUILD_BACKLOG.md`
