# MLFD Video Analysis

> **File:** `08-features/mlfd-video-analysis.md`
> **Related:** [[08-features/02-ai-course-builder]], [[02-roles/03-instructor]]
> **Last Updated:** 2026-04-15

MLFD (Multi-Level Feature Detection) video analysis is fully documented in [[08-features/02-ai-course-builder]] under the **MLFD** section.

## Quick Reference

- **Who uses it:** Teacher (upload lecture recordings for analysis)
- **What it produces:** Slide transition timeline, content density heatmap, pacing score, engagement score (0–100), suggested improvements
- **Where analysis runs:** Locally in the AI Engine — no video frames sent to any external API
- **Output stored:** MinIO `lumina-generated` bucket as HTML report
- **Trigger:** Automatic after Teacher uploads a video file to a lesson
- **API endpoint:** `POST /api/mlfd/analyse { lesson_id }` → returns `{ job_id }`; report available via `GET /api/mlfd/report/{lesson_id}` when complete
