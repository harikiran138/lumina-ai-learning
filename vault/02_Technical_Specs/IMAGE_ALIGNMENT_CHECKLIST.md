# Image Alignment Checklist

Last updated: 2026-03-14

## Purpose

This document is a screenshot-to-documentation crosswalk.

Use it to verify that the ideas shown in the recent vision images are actually represented somewhere in Lumina's written documentation.

It does **not** mean every feature is implemented in code.

For implementation accuracy, use:

- `docs/VISION_ALIGNMENT_AUDIT.md`

## Coverage Table

| Image theme | Covered in docs? | Primary location |
| --- | --- | --- |
| adaptive intelligence loop | Yes | `docs/STUDENT_INTELLIGENCE_LOOP.md` |
| five-step answer -> update -> next question -> path adjust -> teacher update loop | Yes | `docs/STUDENT_INTELLIGENCE_LOOP.md` |
| platform-wide learning loop | Yes | `docs/STUDENT_INTELLIGENCE_LOOP.md` |
| 8 explanation modes | Yes | `docs/EXPLANATION_STYLE_ENGINE.md` |
| mode trigger examples from screenshots | Yes | `docs/EXPLANATION_STYLE_ENGINE.md` |
| observe / reward / explore / persist style-learning loop | Yes | `docs/EXPLANATION_STYLE_ENGINE.md` |
| 6 question formats | Yes | `docs/QUESTION_DIVERSITY_ENGINE.md` |
| answer-conditioned question #2 generation | Yes | `docs/QUESTION_DIVERSITY_ENGINE.md` |
| 6-signal authenticity detection | Yes | `docs/AUTHENTICITY_AND_ORIGINALITY_ENGINE.md` |
| supportive follow-up probe flow | Yes | `docs/AUTHENTICITY_AND_ORIGINALITY_ENGINE.md` |
| KPI dashboard concepts `M,V,L,E,S,C,P,R` | Yes | `docs/STUDENT_KPI_ENGINE.md` |
| screenshot formulas for BKT, growth, lag, style, answer score | Yes | `docs/STUDENT_KPI_ENGINE.md`, `docs/QUESTION_DIVERSITY_ENGINE.md` |
| response-pattern archetypes | Yes | `docs/STUDENT_KPI_ENGINE.md`, `docs/QUESTION_DIVERSITY_ENGINE.md` |
| teacher heatmap and intervention queue | Yes | `docs/TEACHER_REAL_TIME_DASHBOARD.md` |
| teacher action center and override controls | Yes | `docs/TEACHER_REAL_TIME_DASHBOARD.md` |
| class-level teacher insight cards | Yes | `docs/TEACHER_REAL_TIME_DASHBOARD.md` |
| personalized Student A vs Student B style pathways | Yes | `docs/PERSONALIZED_COURSE_ARCHITECTURE.md` |
| skeleton-vs-target-state accuracy check | Yes | `docs/VISION_ALIGNMENT_AUDIT.md` |

## Important Reality Check

The documentation now covers the screenshot concepts directly.

But the repo itself is still mixed across:

- implemented foundation
- partial integration
- target-state design

Use `docs/VISION_ALIGNMENT_AUDIT.md` before claiming any screenshot feature is already live.
