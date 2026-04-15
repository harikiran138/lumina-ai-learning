# Analytics & Reporting

> **File:** `08-features/06-analytics-reporting.md`
> **Related:** [[03-agents/05-reporting-agent]], [[02-roles/03-instructor]]
> **Last Updated:** 2026-04-15

Analytics dashboards and reports available to Teacher, Faculty, HOD, and Institution Admin.

---

## Teacher Analytics Dashboard

Available at `/app/teacher/analytics` for each course the Teacher owns.

### Per-Student Knowledge Trace View
Table showing every student in the course, their mastery per KC (coloured LOW/MED/HIGH), and trend (improving / flat / declining over last 4 weeks).

Teacher can click any student to see their full knowledge trace history: a timeline of BKT+DKT mastery updates keyed to each quiz submission.

### AI Queue Metrics
- Total queue items this week: APPROVED / REJECTED / ESCALATED / PENDING counts
- Average wait time (CREATED_AT → APPROVED_AT) for approved items
- Most-asked question topics (KC-level aggregation)

### Dropout Risk Widget
List of students with HIGH risk badge this week. Clicking a student shows:
- Full SHAP waterfall chart (which features drove the risk score up/down)
- Feature values: attendance rate, submission rate, login frequency, quiz trend
- Last login date
- One-click "Send welfare check message" to student

### Attendance Analytics
- Class-level attendance rate per session (line chart over semester)
- Per-student attendance heatmap (rows = students, columns = sessions)
- Students below threshold (red-flagged list)

---

## Faculty Analytics Dashboard

Available at `/app/faculty/analytics` — aggregated across all courses in their department.

- Course-level average mastery per KC (identifies which KCs are hardest department-wide)
- Course-level dropout risk distribution (pie chart: HIGH/MED/LOW counts)
- Escalated queue items pending Faculty decision
- Teacher performance: avg queue response time per Teacher in department

---

## HOD Dashboard

Available at `/app/hod/analytics`.

- Department-level dropout risk trend (week-over-week count of HIGH-risk students)
- Overall attendance rate per course per week
- Queue health: unresolved ESCALATED items older than 24 hours
- Faculty-level escalation counts (which Faculty members are handling most escalations)

---

## Institution Admin Analytics

Available at `/app/admin/analytics`.

- Institution-wide student count, active students, dropout count this semester
- Department breakdown of all above metrics
- AI usage metrics: total agent invocations, Claude API cost estimate, Guardian block rate
- Storage usage (MinIO bucket sizes)

---

## Report Export

Teachers and above can export any analytics view as CSV or PDF:
- `GET /api/analytics/export?type=knowledge_trace&course_id=&format=csv`
- `GET /api/analytics/export?type=attendance&course_id=&format=pdf`

All exports are scoped to the requesting user's institution_id and role scope. A Teacher cannot export data from a course they don't own. Exports are logged to `audit_logs`.

---

## SHAP Waterfall Chart

The SHAP waterfall chart for a student's dropout risk shows each feature's contribution to the final risk score. Features that pushed the score higher are shown in red; features that pushed it lower are in blue. The base value (average prediction across all students) is shown at the left.

This chart is available to Teacher, Faculty, and HOD only. Students and Parents see only the risk badge (HIGH/MEDIUM/LOW).
