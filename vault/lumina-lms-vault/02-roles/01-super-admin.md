# Super Admin

> **File:** `02-roles/01-super-admin.md`
> **Related:** [[02-roles/00-roles-index]], [[02-roles/02-institution-admin]], [[06-auth/02-rbac]]
> **Last Updated:** 2026-04-15

Super Admin is the platform-level governance role. One or two Super Admin accounts exist for the entire Lumina deployment.

---

## Definition

Super Admin manages the Lumina platform itself — not any single institution. They provision institutions, manage platform-wide configuration, grant Researcher access, and can view aggregated (not individual) data across all institutions.

## Responsibilities

- Create, configure, and deactivate Institution accounts
- Set platform-wide defaults (FSRS parameters, dropout threshold, Guardian sensitivity)
- Grant Researcher data access with defined dataset scopes and expiry dates
- View platform health dashboard (total students, queue depth, AI cost per institution)
- Manage platform-level secrets (MinIO credentials, external SMTP config)
- Run compliance exports for regulatory requirements

## Permissions

| Resource | Create | Read | Update | Delete |
|---|---|---|---|---|
| Institutions | ✅ | ✅ (all) | ✅ | ✅ (deactivate only) |
| Institution Admins | ✅ | ✅ | ✅ | ✅ |
| Platform config | ✅ | ✅ | ✅ | — |
| Researcher grants | ✅ | ✅ | ✅ | ✅ |
| Audit logs | — | ✅ (read-only) | ❌ | ❌ |
| Individual student data | ❌ | ❌ | ❌ | ❌ |
| Counselling notes | ❌ | ❌ (ciphertext only) | ❌ | ❌ |
| Courses (any institution) | ❌ | ❌ | ❌ | ❌ |

## What Super Admin Cannot Do

- Read individual student records (grades, progress, submissions) — cross-institution student data is never exposed
- Read counselling session notes in plaintext — AES-256-GCM encryption means the server never holds the key
- Modify audit logs — INSERT-only RLS policy prevents UPDATE/DELETE even for SA
- Approve AI Queue items — queue actions are scoped to Teacher/Faculty/HOD within an institution

## How Super Admin Accounts Are Created

Super Admin accounts are created by direct database insertion during the initial platform setup. There is no UI for creating Super Admin accounts. This is intentional — the only way to gain SA access is through direct server access.

## Common Workflows

**Onboarding a new institution:**
1. SA logs in → Admin panel → "Add Institution"
2. Fills institution name, address, SMTP config, department list
3. Creates the initial Institution Admin account (generates temporary password)
4. Institution Admin receives onboarding email with login credentials

**Granting Researcher access:**
1. SA → Researcher Management → "New Grant"
2. Selects institution(s), defines dataset scope (anonymised tables allowed), sets expiry date
3. System creates Researcher account with restricted permissions
4. All Researcher queries are logged in `researcher_query_log` with SA review access

## Edge Cases

**Institution deactivation** — Deactivating an institution suspends all logins for that institution_id but does not delete data. Data is retained for 90 days before permanent deletion. Students receive a 30-day advance notice email.

**SA account compromise** — Because SA accounts have no institution_id scope, compromise is highest-severity. The mitigation is: SA accounts require IP allowlisting and have a 15-minute JWT TTL (non-renewable without re-authentication).
