# Security Policy

## Supported Versions

We actively maintain and provide security updates for the following versions of Lumina:

| Version | Supported |
|---------|-----------|
| `main` (latest) | Yes |
| Older releases | No — please upgrade |

---

## Reporting a Vulnerability

**Please do NOT report security vulnerabilities through public GitHub issues.**

Lumina handles sensitive data including student educational records, parent/guardian information, and AI-generated learning profiles. We take security seriously.

### How to Report

Send a detailed report to:

**Email:** harikiran138@[your-domain].com
_(Replace with your actual security contact email)_

Or use [GitHub's private vulnerability reporting](../../security/advisories/new) if enabled on this repository.

### What to Include

Please provide as much of the following as possible:

- **Type of vulnerability** (e.g., SQL injection, XSS, broken auth, data exposure, IDOR)
- **Affected component** (frontend portal, FastAPI backend, Supabase RLS, auth flow)
- **Steps to reproduce** — be specific
- **Proof of concept** (screenshots, request/response logs, code snippets)
- **Potential impact** — what data or functionality could be affected
- **Suggested fix** (optional but appreciated)

### What to Expect

| Timeline | Action |
|----------|--------|
| **24–48 hours** | Acknowledgement of your report |
| **7 days** | Initial assessment and severity triage |
| **30–90 days** | Fix development and deployment (depending on severity) |
| **After fix** | Credit in release notes (if desired) |

We ask that you:
- Give us reasonable time to fix the issue before public disclosure
- Not exploit the vulnerability beyond what is needed to demonstrate it
- Not access, modify, or delete data that belongs to others

---

## Scope

### In Scope

- Authentication and authorization flaws (JWT, Supabase RLS, role-based access)
- Injection vulnerabilities (SQL, command, SSRF)
- Cross-site scripting (XSS) and cross-site request forgery (CSRF)
- Sensitive data exposure (student PII, parent info, AI learning profiles)
- Broken access control (portal isolation — student/teacher/admin/parent separation)
- Insecure direct object references (IDOR)
- Security misconfigurations in API routes or Supabase policies

### Out of Scope

- Vulnerabilities in third-party dependencies (report to the upstream project)
- Denial of service attacks
- Social engineering attacks
- Issues requiring physical access to infrastructure
- Theoretical vulnerabilities without a working proof of concept

---

## Privacy & FERPA Considerations

Lumina is a privacy-first platform that may handle data protected under FERPA, COPPA, and GDPR depending on deployment context. Any vulnerability that could expose:

- Student educational records
- Minors' personal information
- Parent/guardian contact details
- AI-generated behavioral or learning profiles

...will be treated as **critical severity** and prioritized accordingly.

---

## Acknowledgements

We appreciate the security research community. Responsible disclosures that lead to fixes will be credited in our changelog (with your permission).
