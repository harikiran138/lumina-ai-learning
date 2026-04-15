# Dropout Prediction & Analytics

> **File:** `03-agents/05-reporting-agent.md`
> **Related:** [[03-agents/00-agents-index]], [[08-features/06-analytics-reporting]]
> **Last Updated:** 2026-04-15

Lumina's analytics system centres on XGBoost dropout prediction with SHAP explainability, running on a weekly cron schedule.

---

## Purpose

Predict which students are at risk of failing or dropping out of a course before it is too late to intervene, and give Teachers and Faculty actionable explanations via SHAP feature contributions.

## Model

**XGBoost** classifier (binary: at-risk / not-at-risk per student per course per week), with **SHAP** (SHapley Additive exPlanations) for per-prediction explainability.

## Trigger

Weekly cron job — runs every Sunday at 02:00 IST for all institutions.

## Feature Vector (per student per course per week)

| Feature | Type | Description |
|---|---|---|
| `attendance_rate_7d` | float | % of sessions attended in last 7 days |
| `attendance_rate_30d` | float | % of sessions attended in last 30 days |
| `submission_rate_7d` | float | % of assignments submitted on time in last 7 days |
| `submission_rate_30d` | float | % of assignments submitted on time in last 30 days |
| `avg_quiz_score_7d` | float | Mean quiz score in last 7 days |
| `avg_quiz_score_trend` | float | Slope of quiz scores over last 4 weeks |
| `login_frequency_7d` | integer | Number of platform logins in last 7 days |
| `flashcard_review_rate` | float | % of due FSRS cards reviewed in last 7 days |
| `tutor_questions_7d` | integer | Number of AI tutor questions submitted in last 7 days |
| `community_posts_7d` | integer | Number of community posts/replies in last 7 days |
| `mastery_avg` | float | Mean BKT+DKT mastery across all course KCs |
| `mastery_trend` | float | Slope of average mastery over last 4 weeks |
| `days_since_last_login` | integer | Days elapsed since last platform login |

## Output Schema

```json
{
  "institution_id": "uuid",
  "course_id": "uuid",
  "student_id": "uuid",
  "week_start": "date",
  "risk_score": "float (0.0–1.0)",
  "risk_label": "LOW|MEDIUM|HIGH",
  "shap_values": {
    "attendance_rate_7d": "float",
    "submission_rate_7d": "float",
    "avg_quiz_score_trend": "float",
    "days_since_last_login": "float"
  },
  "top_risk_factors": ["string (human-readable SHAP explanations)"]
}
```

**Risk label thresholds:**
- LOW: score < 0.4
- MEDIUM: 0.4 ≤ score < 0.7
- HIGH: score ≥ 0.7

## Alert Dispatch

When `risk_label = 'HIGH'`:
1. Alert is inserted into `dropout_alerts` table
2. Teacher for the course receives an in-platform notification: "3 students in [Course] are at high dropout risk this week"
3. Faculty receives a department-level summary
4. HOD receives a department aggregate: "7 students across 3 courses are high risk"

## Data Visibility by Role

| Role | Sees |
|---|---|
| Teacher | Full SHAP details for students in their courses |
| Faculty | SHAP details for all students in their department |
| HOD | Department aggregate risk counts; SHAP details on request |
| Student | Risk badge only (LOW/MEDIUM/HIGH) — no score, no SHAP |
| Mentor | Risk badge for assigned mentees |
| Parent | Risk badge only |
| Researcher | Anonymised aggregate risk distributions |

## Model Retraining

XGBoost is retrained monthly on the previous 6 months of outcome data (did the "at-risk" student actually fail/withdraw?). Ground truth labels are derived from final grade records. Feature importance is reviewed by the Faculty after each retraining.

## Logging

Every prediction batch logs to `dropout_prediction_log`:
- `run_id`, `institution_id`, `run_at`
- Count of students scored
- Count of HIGH/MEDIUM/LOW predictions
- Model version used
- Retraining date of model used
