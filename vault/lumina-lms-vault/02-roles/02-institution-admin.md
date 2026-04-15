 # Institution Admin

> **File:** `02-roles/02-institution-admin.md`
> **Related:** [[02-roles/00-roles-index]], [[02-roles/01-super-admin]], [[02-roles/03-instructor]]
> **Last Updated:** 2026-04-15

Institution Admin (also called College Admin) manages a single institution — its departments, teachers, students, and operational configuration.

---

## Definition

Institution Admin is the highest role within a college deployment. They are accountable for every account and all data under their `institution_id`. They cannot access or affect any other institution.

## Responsibilities

- Create and manage HOD, Faculty, and Teacher accounts within their institution
- Configure departments, branches, and academic years
- Bulk-import student accounts via CSV (with hall ticket number as primary identifier)
- Set attendance thresholds (default 75% — customisable per institution)
- Configure institution SMTP for outgoing emails
- Verify parent_child_links (required before parents can access student data)
- Run full-institution analytics and generate regulatory reports
- Manage the institution's MinIO bucket configuration

## Permissions

| Resource | Create | Read | Update | Delete |
|---|---|---|---|---|
| HOD accounts | ✅ | ✅ | ✅ | ✅ (deactivate) |
| Faculty accounts | ✅ | ✅ | ✅ | ✅ (deactivate) |
| Teacher accounts | ✅ | ✅ | ✅ | ✅ (deactivate) |
| Student accounts | ✅ (bulk/individual) | ✅ | ✅ | ✅ (deactivate) |
| Parent accounts | ✅ | ✅ | ✅ | ✅ |
| parent_child_links | ✅ | ✅ | ✅ (verify) | ✅ |
| Courses (all in institution) | ❌ | ✅ (metadata only) | ❌ | ❌ |
| AI Queue items | ❌ | ✅ (count summaries) | ❌ | ❌ |
| Dropout risk scores | ❌ | ✅ (aggregate) | ❌ | ❌ |
| Counselling notes | ❌ | ❌ | ❌ | ❌ |
| Audit logs | ❌ | ✅ | ❌ | ❌ |

## How Institution Admin Accounts Are Created

Created by Super Admin during institution onboarding. The account is assigned `role = 'institution_admin'` and `institution_id = <new institution UUID>`. IA receives a temporary password via the institution's configured SMTP.

## Common Workflows

**Bulk student import:**
1. IA → Admin Panel → Students → "Import CSV"
2. CSV format: `hall_ticket, name, email, branch, year, section`
3. System creates accounts with hall_ticket as username and temporary password
4. Students receive onboarding email

**Verifying a parent link:**
1. Parent submits request with student hall_ticket
2. IA → Parent Management → pending links
3. IA verifies relationship (e.g., checks admission records) and clicks "Verify"
4. `parent_child_links.verified_by_admin = TRUE` — parent can now log in

## Edge Cases

**Teacher deletes a course mid-enrollment** — IA is notified via alert. Enrolled students retain their progress records but lose access to new content. IA can reassign the course to another Teacher.

**IA account deletion** — Only SA can deactivate an IA account. If the only IA is deactivated, SA must create a replacement before students lose institutional support access.
