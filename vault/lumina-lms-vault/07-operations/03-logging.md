# Logging

> **File:** `07-operations/03-logging.md`
> **Related:** [[07-operations/02-monitoring]], [[07-operations/04-error-handling]]
> **Last Updated:** 2026-04-15

What Lumina logs, where it logs it, and retention policy.

---

## Logging Destinations

| Log type | Destination | Retention |
|---|---|---|
| Application logs (structured JSON) | Files rotated daily (`/var/log/lumina/`) | 30 days |
| Audit logs | PostgreSQL `audit_logs` table (INSERT-only RLS) | Permanent (no deletion policy) |
| Agent invocation logs | PostgreSQL `agent_invocation_log` | 90 days |
| Guardian block logs | PostgreSQL `guardian_block_log` | 90 days |
| Login history | PostgreSQL `login_history` | 1 year |
| Access violation logs | PostgreSQL `access_violation_log` | 1 year |
| Researcher query logs | PostgreSQL `researcher_query_log` | Permanent |

## Structured Log Format (Application)

Every application log line is a JSON object:

```json
{
  "timestamp": "2026-04-15T10:30:00.000Z",
  "level": "INFO|WARNING|ERROR|CRITICAL",
  "service": "backend|ai-engine|frontend",
  "request_id": "uuid",
  "user_id": "uuid|null",
  "institution_id": "uuid|null",
  "endpoint": "/api/queue/submit",
  "method": "POST",
  "status_code": 200,
  "latency_ms": 45,
  "message": "string"
}
```

## Audit Log Schema (`audit_logs` table)

```sql
CREATE TABLE audit_logs (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id UUID NOT NULL REFERENCES institutions(id),
  user_id     UUID NOT NULL REFERENCES users(id),
  role        TEXT NOT NULL,
  action      TEXT NOT NULL,  -- e.g. "queue.approve", "user.create", "course.delete"
  resource_type TEXT NOT NULL, -- e.g. "ai_answer_queue", "users", "courses"
  resource_id UUID,
  before_state JSONB,
  after_state  JSONB,
  ip_address  INET,
  user_agent  TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Row-Level Security: INSERT only. No UPDATE or DELETE for ANY role.
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY audit_insert_only ON audit_logs FOR INSERT TO lumina_app WITH CHECK (true);
-- No SELECT policy granted to application role — only read via admin reporting views
```

## What Is Logged to `audit_logs`

Every state-changing action is audited:

- User creation, update, deactivation
- Course creation, update, publication, deletion
- AI queue item state changes (APPROVE, REJECT, ESCALATE)
- Role grants and revocations
- Institution configuration changes
- Parent-child link verification
- Researcher grant creation and expiry
- Super Admin actions (all of them)

## What Is Never Logged

- Student question text (privacy — only `queue_item_id` is logged)
- Counselling note content (encrypted at client; server never sees plaintext)
- Raw password attempts (only count of failures logged)
- Individual student quiz answers in plaintext (only score and KC_id are logged)
- PII in application logs (user_id UUID is logged, never name or email)

## Agent Invocation Log Schema

```sql
CREATE TABLE agent_invocation_log (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  institution_id  UUID NOT NULL,
  agent_type      TEXT NOT NULL,  -- "tutor"|"guardian"|"assessment"|"pathway"
  student_id_hash TEXT,           -- 8-char SHA-256 hash, never real student_id
  course_id       UUID,
  concept_id      UUID,
  input_tokens    INTEGER,
  output_tokens   INTEGER,
  latency_ms      INTEGER,
  guardian_result TEXT,           -- "PASS"|"FLAG"|"BLOCK"|null
  queue_item_id   UUID,           -- null if blocked
  model_used      TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```
