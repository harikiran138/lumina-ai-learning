# 05 — Roles and Permissions

**Module:** Access Control & Role Definitions
**Version:** 1.0

---

## Role Summary

| Role | Count (typical institution) | Data Access | Primary Interface |
|------|----------------------------|-------------|------------------|
| Super Admin | 1–3 | Full platform | Admin panel (platform level) |
| Institution Admin | 1–5 per school | Institution-wide | Admin panel (school level) |
| Teacher | 20–100 per school | Own courses + classes | Teacher dashboard |
| Student | 200–2000 per school | Own account only | Student dashboard |
| Parent/Guardian | 1–2 per student | Own child only | Parent portal |
| Mentor/Expert | 5–50 per school | Mentee portfolio | Mentor portal |
| Peer Tutor | 10–50 per school | Tutee learning status | Peer tutor panel |
| School Counselor | 1–5 per school | Aggregate risk + students assigned | Counselor dashboard |
| Content Creator | 2–10 per school | Platform content (no student data) | Content studio |
| Researcher | 1–5 per institution | Anonymised aggregate only | Research data portal |

---

## Permission Matrix

| Feature | Super Admin | Inst. Admin | Teacher | Student | Parent | Counselor |
|---------|:-----------:|:-----------:|:-------:|:-------:|:------:|:---------:|
| View all student data | ✓ | ✓ | Own classes | Self | Own child | Assigned |
| Upload textbook/syllabus | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Generate PPT/PDF/Assignment | ✓ | ✓ | ✓ | ✗ | ✗ | ✗ |
| Verify AI answers | ✓ | ✓ | Own courses | ✗ | ✗ | ✗ |
| Scan and grade physical submissions | ✓ | ✓ | Own classes | ✗ | ✗ | ✗ |
| Access AI tutor | ✓ | ✓ | ✓ | ✓ | ✗ | ✗ |
| View Q&A bank | ✓ | ✓ | Own courses | ✗ | ✗ | ✗ |
| View student risk scores | ✓ | ✓ | Own classes | ✗ | ✗ | Assigned |
| View AI cost dashboard | ✓ | ✓ | Own usage | ✗ | ✗ | ✗ |
| Content moderation review | ✓ | ✓ | ✗ | ✗ | ✗ | ✗ |
| Process data deletion requests | ✓ | ✓ | ✗ | Self-request | Request for child | ✗ |
| Manage roles and permissions | ✓ | Institution | ✗ | ✗ | ✗ | ✗ |
| Configure platform settings | ✓ | Institution | ✗ | ✗ | ✗ | ✗ |

---

## Student Data Access Boundaries

All data access follows the principle of minimum necessary information:

- **Teacher** sees: students in their classes only. Not students in other teachers' classes.
- **Parent** sees: own child's mastery, assignments, and teacher communications. Not class-wide data, not other students' information.
- **Counselor** sees: aggregate risk signals and summary academic performance for students referred to them. Does NOT see AI tutor conversation content.
- **Researcher** sees: fully anonymised, aggregated, differentially private data. Zero individual records.

---

## New Role Technical Setup

### Adding a new user role

```sql
-- roles table
INSERT INTO roles (name, description, base_permissions) VALUES
('peer_tutor', 'Student who tutors other students with AI assistance', '{"view_tutee_mastery": true, "access_ai_coaching": true}'),
('school_counselor', 'Mental health and academic support professional', '{"view_risk_signals": true, "manage_counseling_notes": true}'),
('content_creator', 'Curriculum designer without student data access', '{"create_course_templates": true, "view_content_analytics": true}'),
('researcher', 'Accesses anonymised aggregate data for research', '{"access_anonymised_data": true, "export_irb_datasets": true}');

-- role assignment
INSERT INTO user_roles (user_id, role_id, institution_id, scope_id, scope_type, assigned_by, expires_at)
VALUES ($user_id, $role_id, $institution_id, $scope_id, 'course', $admin_id, NULL);
```

### Role-based middleware

```python
from functools import wraps
from lumina.auth import get_current_user

def require_role(*allowed_roles):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            user = await get_current_user()
            if user.role not in allowed_roles:
                raise PermissionError(f"Role {user.role} cannot access this resource")
            return await func(*args, **kwargs)
        return wrapper
    return decorator

# Usage:
@require_role('teacher', 'institution_admin', 'super_admin')
async def verify_ai_answer(answer_id: str, action: str):
    ...

@require_role('student')
async def submit_question_to_tutor(question: str):
    ...
```
