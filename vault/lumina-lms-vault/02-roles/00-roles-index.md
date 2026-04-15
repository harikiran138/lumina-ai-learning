# Roles Index

> **File:** `02-roles/00-roles-index.md`
> **Related:** [[02-roles/06-role-permissions-matrix]], [[06-auth/02-rbac]]
> **Last Updated:** 2026-04-15

All 11 roles in Lumina, their position in the hierarchy, and their primary function.

---

## Role Hierarchy

```
Super Admin (SA)
└── Institution Admin (IA)
    └── HOD
        ├── Faculty
        │   └── Teacher
        │       └── Student
        │           ├── Peer Tutor (limited write)
        │           └── (Mentor reads Student data)
        └── Support Ring
            ├── Counselor
            ├── Mentor
            └── Parent / Guardian
Researcher (external lane — anonymised access only)
```

## Role Summary Table

| Role | Code | Provisions | Data Scope | Primary Function |
|---|---|---|---|---|
| Super Admin | SA | IA | All institutions | Platform governance, institution lifecycle |
| Institution Admin | IA | HOD, Faculty, Teacher | One institution, all depts | College management, teacher onboarding |
| HOD | HOD | Faculty, Teacher (within dept) | One department | Department governance, curriculum approval |
| Faculty | FAC | — | One department's courses | Academic oversight, escalation handling |
| Teacher | TCH | — | Own course_ids only | Content delivery, AI queue approval |
| Student | STU | — | Own progress only | Learning, submitting assignments |
| Mentor | MNT | — | Assigned mentees (summary only) | Academic guidance |
| Peer Tutor | PT | — | Own enrolled courses (peer channel only) | Peer collaboration |
| Counselor | CNS | — | Encrypted welfare notes | Student wellbeing |
| Parent / Guardian | PAR | — | Own child's grades + attendance | Progress monitoring |
| Researcher | RES | — | k-anonymised snapshots (k≥5) | Educational research |

## Key Distinctions

**Teacher vs Faculty** — Teacher is the day-to-day operator: manages the AI queue, grades submissions, takes attendance, creates flashcards. Faculty is the senior academic oversight role: handles escalations from Teachers, reviews curriculum health, reports to HOD. In small colleges the same person may hold both roles, but the permission scopes are distinct.

**Peer Tutor vs Student** — A Peer Tutor is a Student granted extra write access to the peer discussion channel within their own enrolled course. They cannot access any backend data; they have no teacher-level functions.

**Counselor isolation** — The Counselor role is the only role whose primary data (counselling session notes) is encrypted such that no other role — including Super Admin — can read plaintext content. Counselors can flag welfare severity levels to HOD without exposing session content.

**Parent access model** — Parent accounts are created by Institution Admin and linked to a specific Student account via the `parent_child_links` table. The link must have `verified_by_admin = TRUE` before any data is accessible. Parents see: grade summaries, attendance percentages, dropout risk badges (not SHAP details). Parents cannot see: AI tutor interactions, knowledge trace internals, wellbeing notes.

## Detailed Role Files

- [[02-roles/01-super-admin]]
- [[02-roles/02-institution-admin]]
- [[02-roles/03-instructor]]
- [[02-roles/04-content-author]]
- [[02-roles/05-learner]]
- [[02-roles/06-role-permissions-matrix]]
