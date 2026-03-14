# Student KPI Engine

Last updated: 2026-03-14

## Purpose

This document defines the KPI layer that sits between raw events and intelligent product behavior.

Raw events are not enough.

Agents, dashboards, and policies need stable derived signals such as:

- mastery
- readiness
- engagement quality
- cognitive load
- risk
- explanation effectiveness
- intervention lift

This file gives future agents one formula source instead of ad hoc per-feature scoring.

## Design Principles

1. Normalize all composite KPI inputs to a `0.0-1.0` range before weighting.
2. Prefer interpretable formulas over black-box scores for teacher-facing decisions.
3. Keep immediate, session, and delayed KPIs separate.
4. Store both the score and the evidence inputs used to compute it.
5. Never use a KPI for high-stakes action without confidence and fallback rules.

## Current Code Anchors

The current repo already computes parts of this engine:

- mastery blending and BKT updates in `backend/app/services/personalization_service.py`
- risk heuristics in `backend/app/services/personalization_service.py`
- cognitive load estimation in `backend/learner_profile/analysis/cognitive_load.py`
- assessment action policy in `backend/app/assessment/engine/policy_engine.py`
- teacher analytics aggregation in `backend/app/store/analytics_store.py`

This document formalizes how those pieces should be unified.

## KPI Families

| Family | Purpose | Main consumers |
| --- | --- | --- |
| Mastery KPIs | What the learner currently knows | assessment, tutor, pathway, teacher |
| Performance KPIs | How the learner is doing on scored work | teacher, risk engine, dashboard |
| Engagement KPIs | Whether the learner is actively participating | teacher, pathway, risk engine |
| Cognitive KPIs | Whether the learner is overloaded or under-challenged | tutor, pathway, intervention engine |
| Behavioral KPIs | How the learner persists, seeks help, and revises | tutor, intervention engine |
| Outcome KPIs | Whether explanations and interventions worked | tutor, teacher, analytics |

## KPI Definitions

## 1. Concept Mastery Score

Primary meaning: current estimated understanding of a concept.

### Binary response update

Use the existing BKT-style update for question-level correct or incorrect signals.

```python
mastery_next = bkt.update_mastery(mastery_prev, is_correct)
```

Current implementation anchor:

- `PersonalizationService._update_mastery_from_binary`

### Scored work update

Use the current blend for quizzes, assessments, and assignments that return a percentage score.

```python
normalized_score = clamp(score_pct / 100.0, 0.0, 1.0)
mastery_next = (mastery_prev * 0.6) + (normalized_score * 0.4)
```

Current implementation anchor:

- `PersonalizationService._update_mastery_from_score`

### Output fields

```json
{
  "score": 0.72,
  "confidence": 0.66,
  "attempts": 9,
  "successes": 6,
  "last_source": "assessment_answer"
}
```

## 2. Mastery Confidence

Primary meaning: how much evidence supports the mastery estimate.

### Proposed formula

```python
confidence = min(
    1.0,
    0.35
    + 0.15 * min(attempts, 5)
    + 0.20 * source_diversity
    + 0.15 * recency_factor
    + 0.15 * consistency_factor
)
```

Where:

- `source_diversity` increases when evidence comes from tutor checks, quizzes, assessments, and assignments
- `recency_factor` decays as evidence gets old
- `consistency_factor` rises when recent signals agree

## 2B. Growth Velocity

Primary meaning: whether mastery is improving, stalling, or regressing over time.

This is one of the key claims in the vision screenshots and should be a first-class KPI instead of an informal trend.

### Proposed formula

```python
growth_velocity = (
    mastery_now - mastery_n_sessions_ago
) / max(n_sessions, 1)
```

Interpretation:

- positive: growing
- near zero: plateau or stuck
- negative: regression or forgetting

### Storage suggestion

Store both:

- concept-level growth velocity
- overall recent growth velocity

## 2C. Lag-Zone Score

Primary meaning: which concepts are most likely blocking progress.

### Proposed formula

```python
lag_score = (
    (1.0 - concept_mastery)
    * prerequisite_depth_weight
    * confidence_gap_weight
)
```

Top lag zones should drive:

- next-question targeting
- remediation queue
- teacher intervention queue

## 3. Recent Performance Score

Primary meaning: short-horizon performance over recent graded work.

### Suggested formula

```python
recent_performance = (
    0.40 * assessment_average
    + 0.35 * assignment_average
    + 0.25 * quiz_average
)
```

Current schema anchor:

- `PerformanceSummary.recent_average_score`

## 4. Engagement Quality Score

Primary meaning: active participation quality rather than passive presence.

### Proposed formula

```python
engagement_quality = (
    0.25 * active_time_score
    + 0.20 * lesson_completion_rate
    + 0.15 * note_and_artifact_rate
    + 0.15 * tutor_turn_quality
    + 0.15 * streak_score
    + 0.10 * recency_score
)
```

Example normalized features:

- `active_time_score`: meaningful active minutes divided by target study minutes
- `lesson_completion_rate`: completed lessons divided by started lessons
- `note_and_artifact_rate`: notes, bookmarks, highlights, or saved outputs per session
- `tutor_turn_quality`: tutor turns that end in progress, not repeated confusion
- `streak_score`: current streak relative to goal
- `recency_score`: near 1.0 when active within target recency window

## 5. Cognitive Load Score

Primary meaning: estimated mental strain during current or recent work.

The repo already includes a cognitive load estimator. Future agents should standardize its inputs and output scale.

### Proposed features

```python
cognitive_load = estimator(
    response_latency_z,
    repeated_errors,
    hint_rate,
    backtracking_rate,
    abandonment_rate,
    session_length_overrun
)
```

Interpretation:

- `0.00-0.39`: low load
- `0.40-0.69`: productive load
- `0.70-1.00`: overload risk

## 6. Persistence Score

Primary meaning: whether the learner keeps trying productively after difficulty.

### Proposed formula

```python
persistence = (
    productive_retries_after_error / max(total_error_events, 1)
)
```

Productive retries:

- another attempt after an error
- viewing hint or review material
- returning to the concept later

Non-productive behaviors:

- immediate abandonment
- repeated guessing without reading or reflection

## 7. Help-Seeking Calibration Score

Primary meaning: whether the learner asks for help at healthy times.

This is not "more help is better" or "less help is better."
It measures calibration.

### Proposed formula

```python
help_seeking_calibration = 1.0 - abs(actual_help_timing - target_help_timing)
```

Where:

- `target_help_timing` can be modeled as "after one meaningful attempt" for novice concepts and "after two attempts" for familiar concepts
- repeated immediate hints or repeated silent failure both lower the score

## 8. Retention Risk Score

Primary meaning: probability the learner will forget a concept soon without review.

### Proposed formula

```python
retention_risk = 1.0 - (
    0.50 * current_mastery
    + 0.20 * mastery_confidence
    + 0.20 * recent_review_score
    + 0.10 * spacing_health
)
```

High retention risk should feed:

- review queue generation
- spaced repetition reminders
- pathway review decisions

## 8B. Authenticity Score

Primary meaning: how likely a response reflects genuine thinking rather than externally sourced text or unsupported fluency.

This should be a confidence-routing KPI, not an automatic penalty score.

### Proposed formula

```python
authenticity_score = (
    0.20 * typing_rhythm_score
    + 0.15 * edit_pattern_score
    + 0.20 * think_time_fit
    + 0.20 * lexical_consistency
    + 0.15 * semantic_fingerprint_consistency
    + 0.10 * followup_probe_success
)
```

Use cases:

- teacher review routing
- assessment confidence adjustment
- supportive follow-up probe triggering

## 9. Readiness Score

Primary meaning: whether the learner is ready to advance on a concept or lesson.

### Proposed formula

```python
readiness = (
    0.45 * concept_mastery
    + 0.20 * mastery_confidence
    + 0.15 * engagement_quality
    + 0.10 * (1.0 - cognitive_load)
    + 0.10 * (1.0 - retention_risk)
)
```

Interpretation:

- `< 0.40`: remediate
- `0.40-0.69`: guided practice
- `0.70-0.84`: ready to advance carefully
- `>= 0.85`: candidate for challenge or acceleration

## 10. Explanation Effectiveness Score

Primary meaning: whether a specific explanation strategy actually helped.

This KPI is critical because it converts tutor style from opinion into evidence.

### Proposed formula

```python
explanation_effectiveness = (
    0.35 * post_explanation_success
    + 0.20 * followup_confusion_reduction
    + 0.15 * time_to_first_correct
    + 0.15 * learner_feedback
    + 0.15 * delayed_retention_check
)
```

Signals:

- `post_explanation_success`: student succeeds on the next related attempt
- `followup_confusion_reduction`: fewer "I still don't get it" or simplification requests
- `time_to_first_correct`: faster recovery after explanation
- `learner_feedback`: explicit helpfulness feedback if collected
- `delayed_retention_check`: concept still held later

## 10B. Response Pattern Trait Label

Primary meaning: lightweight working label for how the learner currently tends to answer.

This should be treated as a dynamic label, not a permanent identity.

Examples:

- systematic thinker
- intuitive guesser
- careful verifier
- pattern matcher

Use derived features such as:

- answer orderliness
- latency variance
- MCQ versus open-ended gap
- edit and verification behavior

These labels should inform question format choice and explanation style, not final judgment.

## 11. Intervention Lift

Primary meaning: improvement after a teacher or AI intervention.

### Proposed formula

```python
intervention_lift = (
    post_intervention_readiness - pre_intervention_readiness
)
```

Store both the delta and the time window used.

Example:

```json
{
  "intervention_id": "int-123",
  "pre_readiness": 0.34,
  "post_readiness": 0.57,
  "lift": 0.23,
  "window_days": 5
}
```

## 12. Risk Score

Primary meaning: urgency of support needed.

The repo already computes a solid first-pass risk heuristic.

### Current implemented heuristic

```python
score = 0.0
if recent_average_score < 60:
    score += 0.35
if len(weak_topics) >= 3:
    score += 0.25
if cognitive_load > 75:
    score += 0.20
if total_tutor_interactions >= 5 and recent_average_score < 50:
    score += 0.10
if last_activity_at is None:
    score += 0.05
```

### Recommended upgraded formula

```python
risk_score = min(
    1.0,
    0.30 * low_performance_risk
    + 0.20 * weak_topic_density
    + 0.15 * overload_risk
    + 0.10 * disengagement_risk
    + 0.10 * poor_retention_risk
    + 0.10 * unresolved_intervention_risk
    + 0.05 * confidence_gap_risk
)
```

## KPI Threshold Bands

| KPI | Low | Medium | High |
| --- | --- | --- | --- |
| Mastery | `<0.40` | `0.40-0.79` | `>=0.80` |
| Engagement quality | `<0.45` | `0.45-0.74` | `>=0.75` |
| Cognitive load | `<0.40` | `0.40-0.69` | `>=0.70` |
| Persistence | `<0.35` | `0.35-0.69` | `>=0.70` |
| Retention risk | `<0.30` | `0.30-0.59` | `>=0.60` |
| Authenticity | `<0.45` | `0.45-0.74` | `>=0.75` |
| Explanation effectiveness | `<0.45` | `0.45-0.74` | `>=0.75` |
| Risk | `<0.25` | `0.25-0.59` | `>=0.60` |

## Storage Contract

Future agents should avoid new top-level stores when these KPIs can live inside the canonical learner profile and time-series analytics tables.

### Suggested real-time profile storage

```json
{
  "behavior_signals": {
    "cognitive_load": 0.68,
    "engagement_quality": 0.71,
    "persistence": 0.63,
    "help_seeking_calibration": 0.54,
    "growth_velocity": 0.04,
    "authenticity_score": 0.81
  },
  "performance_summary": {
    "recent_average_score": 74.2,
    "assignment_average": 76.0,
    "assessment_average": 71.5,
    "quiz_average": 75.8
  },
  "risk_summary": {
    "risk_level": "medium",
    "risk_score": 0.43,
    "confidence": 0.74
  },
  "metadata": {
    "retention_risk": 0.29,
    "lag_zones": ["newtons_second_law", "force_vectors"],
    "readiness_score": 0.58,
    "explanation_effectiveness": {
      "step_by_step": 0.81,
      "worked_example_first": 0.76,
      "socratic_prompting": 0.42
    },
    "response_pattern_trait": "careful_verifier"
  }
}
```

### Suggested historical storage

Persist time-series snapshots for:

- mastery drift
- engagement trend
- risk trend
- explanation effectiveness by strategy
- intervention lift over time

## KPI Consumers

| Consumer | KPIs it must use |
| --- | --- |
| Assessment policy engine | mastery, readiness, cognitive load |
| Tutor explanation planner | mastery, cognitive load, explanation effectiveness, help-seeking calibration, response-pattern trait |
| Pathway engine | readiness, retention risk, engagement quality, growth velocity |
| Teacher dashboard | risk, weak topics, lag zones, intervention lift, confidence, authenticity review signals |
| Automation layer | retention risk, disengagement risk, weekly trend deltas |

## Guardrails

1. A single KPI should not trigger a high-stakes action alone.
2. Show evidence and confidence for teacher-facing risk recommendations.
3. Do not treat inferred preference as a fixed trait.
4. Always keep raw evidence available for audit.
5. Decay stale KPIs over time rather than carrying old certainty forever.

## Definition Of Done

The KPI engine is ready when:

- formulas are implemented in one shared service
- tutor, pathway, assessment, and teacher flows use the same KPI projections
- each KPI has a documented threshold and storage location
- explanation and intervention outcomes are measurable over time

## Recommended Companion Docs

- `docs/STUDENT_INTELLIGENCE_LOOP.md`
- `docs/EXPLANATION_STYLE_ENGINE.md`
- `docs/AGENT_BUILD_BACKLOG.md`
