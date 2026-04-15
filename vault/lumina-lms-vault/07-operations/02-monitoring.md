# Monitoring

> **File:** `07-operations/02-monitoring.md`
> **Related:** [[07-operations/03-logging]], [[07-operations/04-error-handling]]
> **Last Updated:** 2026-04-15

What to monitor, alert thresholds, and dashboard structure for a Lumina deployment.

---

## Key Metrics to Monitor

### Application Health

| Metric | Warning threshold | Critical threshold | Source |
|---|---|---|---|
| API response time (p95) | > 1000ms | > 3000ms | FastAPI middleware |
| API error rate (5xx) | > 1% of requests | > 5% of requests | FastAPI middleware |
| AI Engine response time (p95) | > 15s | > 30s | AI Engine middleware |
| Active background tasks | > 50 | > 200 | FastAPI task count |
| Failed agent jobs (per hour) | > 5 | > 20 | `agent_error_log` table |

### Queue Health (TILA)

| Metric | Warning | Critical | Source |
|---|---|---|---|
| Oldest PENDING queue item age | > 4 hours | > 24 hours | `ai_answer_queue` |
| PENDING queue depth per teacher | > 20 items | > 50 items | Redis `queue_count:{teacher_id}` |
| Guardian BLOCK rate (per hour) | > 5% of jobs | > 15% of jobs | `guardian_block_log` |

### Infrastructure

| Metric | Warning | Critical | Source |
|---|---|---|---|
| PostgreSQL connection pool usage | > 70% | > 90% | asyncpg pool stats |
| Redis memory usage | > 70% | > 85% | Redis INFO |
| MinIO disk usage | > 70% | > 85% | MinIO metrics API |
| FAISS index size | > 80% of allocated RAM | > 95% | AI Engine memory |

### Business Metrics (Weekly Review)

- Active students per institution (students who logged in at least once in 7 days)
- AI queue approval rate (APPROVED / total non-blocked queue items)
- Average queue wait time (APPROVED_AT - CREATED_AT for APPROVED items)
- Dropout prediction alert follow-through rate (teachers who acted on HIGH alerts)
- FSRS review completion rate (cards reviewed on schedule / cards due)

## Alert Destinations

All alerts are sent to:
1. In-platform notification to the relevant Teacher/Faculty/HOD (for queue alerts)
2. Email to Institution Admin (for infrastructure alerts)
3. Email to Super Admin (for critical infrastructure alerts)

No third-party alerting service (PagerDuty, Slack) is included in the base system. Integration is possible via webhook configuration in platform settings.

## Health Check Endpoints

```
GET /api/health          → { status: "ok", timestamp }
GET /api/health/db       → { status: "ok|error", latency_ms }
GET /api/health/redis    → { status: "ok|error", latency_ms }
GET /api/health/minio    → { status: "ok|error", latency_ms }
GET /api/health/ai       → { status: "ok|error", latency_ms }
```

These endpoints do not require authentication and are used by load balancers and monitoring tools.
